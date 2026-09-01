const { Website, Scan, ScanResult } = require('../models');
const { runScanner } = require('../services/scanner.service');

const VALID_SEVERITIES = ['Info', 'Low', 'Medium', 'High', 'Critical'];

async function startScan(req, res) {
  try {
    const { websiteId } = req.body;

    if (!websiteId) {
      return res.status(400).json({ message: 'websiteId is required' });
    }

    const website = await Website.findOne({
      where: { id: websiteId, UserId: req.user.id },
    });

    if (!website) {
      return res.status(404).json({ message: 'Website not found' });
    }

    const scan = await website.createScan({ status: 'running' });

    try {
      const results = await runScanner(website.url);

      const sanitizedResults = results
        .filter((r) => VALID_SEVERITIES.includes(r.severity))
        .map((r) => ({
          ScanId: scan.id,
          module: r.module,
          severity: r.severity,
          issue: r.issue,
          recommendation: r.recommendation || null,
        }));

      if (sanitizedResults.length) {
        await ScanResult.bulkCreate(sanitizedResults);
      }

      await scan.update({ status: 'completed' });

      const scanWithResults = await Scan.findByPk(scan.id, {
        include: ScanResult,
      });

      return res.status(201).json({ scan: scanWithResults });
    } catch (scanErr) {
      console.error('scan run error:', scanErr);
      await scan.update({ status: 'failed' });
      return res.status(502).json({
        message: 'Scan failed to complete',
        error: scanErr.message,
        scan,
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

    if (!scan || scan.Website.UserId !== req.user.id) {
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
    const websites = await req.user.getWebsites({ attributes: ['id'] });
    const websiteIds = websites.map((w) => w.id);

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

module.exports = { startScan, getScan, listScans };
