const { Op } = require('sequelize');
const { Website, Scan, ScanResult } = require('../models');

async function scopedWebsiteIds(user) {
  if (user.role === 'Administrator' || user.role === 'Viewer')  {
    const all = await Website.findAll({ attributes: ['id'] });
    return all.map((w) => w.id);
  }
  const own = await user.getWebsites({ attributes: ['id'] });
  return own.map((w) => w.id);
}

/**
 * GET /dashboard/overview
 * Section 9 - top summary tiles.
 */
async function getOverview(req, res) {
  try {
    const websiteIds = await scopedWebsiteIds(req.user);

    const [totalWebsites, totalScans, scans] = await Promise.all([
      Website.count({ where: { id: websiteIds } }),
      Scan.count({ where: { WebsiteId: websiteIds } }),
      Scan.findAll({
        where: { WebsiteId: websiteIds },
        include: [ScanResult],
      }),
    ]);

    const severityCounts = { Critical: 0, High: 0, Medium: 0, Low: 0 };
    for (const scan of scans) {
      for (const result of scan.ScanResults || []) {
        if (severityCounts[result.severity] !== undefined) {
          severityCounts[result.severity] += 1;
        }
      }
    }

    const websites = await Website.findAll({ where: { id: websiteIds } });
    const scoredWebsites = websites.filter((w) => w.securityScore !== null);
    const avgScore = scoredWebsites.length
      ? Math.round(scoredWebsites.reduce((sum, w) => sum + w.securityScore, 0) / scoredWebsites.length)
      : null;

    const now = new Date();
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const sslExpiryAlerts = websites.filter(
      (w) => w.sslExpiryDate && new Date(w.sslExpiryDate) <= in30Days
    ).length;

    const recentlyScanned = await Website.findAll({
      where: { id: websiteIds, lastScanDate: { [Op.ne]: null } },
      order: [['lastScanDate', 'DESC']],
      limit: 5,
    });

    return res.status(200).json({
      totalWebsites,
      totalScans,
      criticalFindings: severityCounts.Critical,
      highFindings: severityCounts.High,
      mediumFindings: severityCounts.Medium,
      lowFindings: severityCounts.Low,
      averageSecurityScore: avgScore,
      sslExpiryAlerts,
      recentlyScannedWebsites: recentlyScanned,
    });
  } catch (err) {
    console.error('getOverview error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

/**
 * GET /dashboard/charts/risk-distribution
 * Pie/donut chart: count of findings per severity across all scans.
 */
async function getRiskDistribution(req, res) {
  try {
    const websiteIds = await scopedWebsiteIds(req.user);
    const scans = await Scan.findAll({ where: { WebsiteId: websiteIds }, include: [ScanResult] });

    const distribution = { Critical: 0, High: 0, Medium: 0, Low: 0, Info: 0 };
    for (const scan of scans) {
      for (const result of scan.ScanResults || []) {
        if (distribution[result.severity] !== undefined) distribution[result.severity] += 1;
      }
    }

    return res.status(200).json({ distribution });
  } catch (err) {
    console.error('getRiskDistribution error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

/**
 * GET /dashboard/charts/vulnerability-categories
 * Bar chart: count of findings per scanner module.
 */
async function getVulnerabilityCategories(req, res) {
  try {
    const websiteIds = await scopedWebsiteIds(req.user);
    const scans = await Scan.findAll({ where: { WebsiteId: websiteIds }, include: [ScanResult] });

    const categories = {};
    for (const scan of scans) {
      for (const result of scan.ScanResults || []) {
        if (result.severity === 'Info') continue; // only count actionable findings
        categories[result.module] = (categories[result.module] || 0) + 1;
      }
    }

    const sorted = Object.entries(categories)
      .sort((a, b) => b[1] - a[1])
      .map(([module, count]) => ({ module, count }));

    return res.status(200).json({ categories: sorted });
  } catch (err) {
    console.error('getVulnerabilityCategories error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

/**
 * GET /dashboard/charts/score-trend?websiteId=123
 * Line chart: security score over time for one website (or averaged across
 * all scoped websites if no websiteId is given).
 */
async function getScoreTrend(req, res) {
  try {
    const websiteIds = await scopedWebsiteIds(req.user);
    const { websiteId } = req.query;

    const where = { WebsiteId: websiteId ? [Number(websiteId)] : websiteIds };
    if (websiteId && !websiteIds.includes(Number(websiteId))) {
      return res.status(404).json({ message: 'Website not found' });
    }

    const scans = await Scan.findAll({
      where: { ...where, status: 'completed' },
      order: [['createdAt', 'ASC']],
      attributes: ['id', 'createdAt', 'securityScore', 'WebsiteId'],
    });

    const trend = scans.map((s) => ({
      date: s.createdAt,
      score: s.securityScore,
      websiteId: s.WebsiteId,
    }));

    return res.status(200).json({ trend });
  } catch (err) {
    console.error('getScoreTrend error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

/**
 * GET /dashboard/charts/ssl-expiry-timeline
 * Timeline of upcoming SSL certificate expirations across scoped websites.
 */
async function getSslExpiryTimeline(req, res) {
  try {
    const websiteIds = await scopedWebsiteIds(req.user);
    const websites = await Website.findAll({
      where: { id: websiteIds, sslExpiryDate: { [Op.ne]: null } },
      order: [['sslExpiryDate', 'ASC']],
      attributes: ['id', 'name', 'url', 'sslExpiryDate'],
    });

    const now = new Date();
    const timeline = websites.map((w) => {
      const daysRemaining = Math.ceil((new Date(w.sslExpiryDate) - now) / (24 * 60 * 60 * 1000));
      return {
        websiteId: w.id,
        name: w.name,
        url: w.url,
        sslExpiryDate: w.sslExpiryDate,
        daysRemaining,
        status: daysRemaining < 0 ? 'Expired' : daysRemaining <= 30 ? 'Expiring Soon' : 'Valid',
      };
    });

    return res.status(200).json({ timeline });
  } catch (err) {
    console.error('getSslExpiryTimeline error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

/**
 * GET /dashboard/charts/monthly-scan-summary
 * Bar chart: number of scans run per month for the last 12 months.
 */
async function getMonthlyScanSummary(req, res) {
  try {
    const websiteIds = await scopedWebsiteIds(req.user);
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
    twelveMonthsAgo.setDate(1);
    twelveMonthsAgo.setHours(0, 0, 0, 0);

    const scans = await Scan.findAll({
      where: { WebsiteId: websiteIds, createdAt: { [Op.gte]: twelveMonthsAgo } },
      attributes: ['createdAt'],
    });

    const buckets = {};
    for (let i = 0; i < 12; i += 1) {
      const d = new Date(twelveMonthsAgo);
      d.setMonth(d.getMonth() + i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      buckets[key] = 0;
    }

    for (const scan of scans) {
      const d = new Date(scan.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (buckets[key] !== undefined) buckets[key] += 1;
    }

    const summary = Object.entries(buckets).map(([month, count]) => ({ month, count }));

    return res.status(200).json({ summary });
  } catch (err) {
    console.error('getMonthlyScanSummary error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

/**
 * GET /dashboard/upcoming-scans
 * Section 9 - "Upcoming Scheduled Scans" tile.
 * Depends on the Scheduler (next batch) having written nextScanDate onto
 * Website; until then this returns websites with a non-Manual frequency
 * so the endpoint is usable immediately.
 */
async function getUpcomingScans(req, res) {
  try {
    const websiteIds = await scopedWebsiteIds(req.user);
    const websites = await Website.findAll({
      where: { id: websiteIds, scanFrequency: { [Op.ne]: 'Manual' }, status: 'Enabled' },
      attributes: ['id', 'name', 'url', 'scanFrequency', 'lastScanDate', 'nextScanDate'],
    });

    return res.status(200).json({ upcoming: websites });
  } catch (err) {
    console.error('getUpcomingScans error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

module.exports = {
  getOverview,
  getRiskDistribution,
  getVulnerabilityCategories,
  getScoreTrend,
  getSslExpiryTimeline,
  getMonthlyScanSummary,
  getUpcomingScans,
};
