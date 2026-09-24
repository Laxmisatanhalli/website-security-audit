const { Website, Scan, ScanResult } = require('../models');
const { runScanForWebsite } = require('../services/scanRunner.service');

function canSeeAll(user) {
  return user.role === 'Administrator' || user.role === 'Viewer';
}
async function startScan(req, res) {
  try {
    const { websiteId } = req.body;

    if (!websiteId) {
      return res.status(400).json({ message: 'websiteId is required' });
    }

    const where = req.user.role === 'Administrator'
      ? { id: websiteId }
      : { id: websiteId, UserId: req.user.id };

    const website = await Website.findOne({ where });

    if (!website) {
      return res.status(404).json({ message: 'Website not found' });
    }

    if (website.status === 'Disabled') {
      return res.status(409).json({ message: 'Website is disabled, enable it before scanning' });
    }

    try {
      const { scan, securityScore, scoreCategory, severityCounts } = await runScanForWebsite(website, req.user);
      return res.status(201).json({ scan, securityScore, scoreCategory, severityCounts });
    } catch (scanErr) {
      console.error('scan run error:', scanErr);
      return res.status(502).json({
        message: 'Scan failed to complete',
        error: scanErr.message,
        scan: scanErr.scan || null,
      });
    }
  } catch (err) {
    console.error('startScan error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

async function getScan(req, res) {
  try {
    const { id } = req.params;

    const scan = await Scan.findByPk(id, {
      include: [{ model: ScanResult }, { model: Website }],
    });

    if (!scan) {
      return res.status(404).json({ message: 'Scan not found' });
    }
    if (!canSeeAll(req.user) && scan.Website.UserId !== req.user.id){
      return res.status(404).json({ message: 'Scan not found' });
    }

    return res.status(200).json({ scan });
  } catch (err) {
    console.error('getScan error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

async function listScans(req, res) {
  try {
    let websiteIds;

    if(canSeeAll(req.user)) {
      const all = await Website.findAll({ attributes: ['id'] });
      websiteIds = all.map((w) => w.id);
    } else {
      const websites = await req.user.getWebsites({ attributes: ['id'] });
      websiteIds = websites.map((w) => w.id);
    }

    const scans = await Scan.findAll({
      where: { WebsiteId: websiteIds },
      include: [{ model: ScanResult }, { model: Website }],
      order: [['createdAt', 'DESC']],
    });

    return res.status(200).json({ scans });
  } catch (err) {
    console.error('listScans error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}


async function compareScans(req, res) {
  try {
    const { previousId, currentId } = req.query;

    if (!previousId || !currentId) {
      return res.status(400).json({ message: 'previousId and currentId are required' });
    }

    const [previous, current] = await Promise.all([
      Scan.findByPk(previousId, { include: [ScanResult, Website] }),
      Scan.findByPk(currentId, { include: [ScanResult, Website] }),
    ]);

    if (!previous || !current) {
      return res.status(404).json({ message: 'One or both scans not found' });
    }
    if (previous.WebsiteId !== current.WebsiteId) {
      return res.status(400).json({ message: 'Scans must belong to the same website' });
    }
    if (!canSeeAll(req.user) && current.Website.UserId !== req.user.id){
      return res.status(404).json({ message: 'Scan not found' });
    }

    const key = (r) => `${r.module}::${r.issue}`;
    const prevKeys = new Set(previous.ScanResults.map(key));
    const currKeys = new Set(current.ScanResults.map(key));

    const resolved = previous.ScanResults.filter((r) => !currKeys.has(key(r)));
    const recurring = current.ScanResults.filter((r) => prevKeys.has(key(r)));
    const newIssues = current.ScanResults.filter((r) => !prevKeys.has(key(r)));

    return res.status(200).json({
      resolved,
      recurring,
      newIssues,
      summary: {
        resolvedCount: resolved.length,
        recurringCount: recurring.length,
        newCount: newIssues.length,
      },
    });
  } catch (err) {
    console.error('compareScans error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

module.exports = { startScan, getScan, listScans, compareScans };
