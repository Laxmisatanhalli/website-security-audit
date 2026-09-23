const { Website, Scan, ScanResult } = require('../models');
const { runScanner } = require('./scanner.service');
const { computeSecurityScore, scoreToCategory, summarizeSeverities } = require('../utils/scoring');
const {
  notifyScanCompleted,
  notifyScanFailed,
  notifyCriticalVulnerabilities,
  notifyNewHighRiskIssues,
} = require('./notification.service');

const VALID_SEVERITIES = ['Info', 'Low', 'Medium', 'High', 'Critical'];

/**
 * Runs a full scan for a website: executes the Python scanner, persists
 * results, computes the security score, updates the website record, and
 * fires the relevant notifications (Section 13). Used by both the manual
 * "start scan" API endpoint and the Scheduler (Section 12).
 *
 * `owner` is the User record notifications should be sent to (the
 * website's owner); pass null to skip notifications (e.g. dry runs).
 */
async function runScanForWebsite(website, owner) {
  const scan = await website.createScan({ status: 'running' });

  let results;
  try {
    results = await runScanner(website.url);
  } catch (scanErr) {
    await scan.update({ status: 'failed' });
    if (owner) {
      await notifyScanFailed(owner, website, scanErr.message).catch((e) =>
        console.error('notifyScanFailed failed:', e.message)
      );
    }
    const err = new Error(`Scan failed: ${scanErr.message}`);
    err.scan = scan;
    throw err;
  }

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

  const score = computeSecurityScore(sanitizedResults);
  const category = scoreToCategory(score);
  const severityCounts = summarizeSeverities(sanitizedResults);

  await scan.update({ status: 'completed', securityScore: score, scoreCategory: category });

  const sslFinding = results.find((r) => r.module === 'SSL/TLS' && r.data && r.data.expiresAt);
  const websiteUpdates = { lastScanDate: new Date(), securityScore: score };
  if (sslFinding) websiteUpdates.sslExpiryDate = new Date(sslFinding.data.expiresAt);

  // Advance nextScanDate for automated (non-Manual) scans so the scheduler
  // knows when to run this website again.
  if (website.scanFrequency && website.scanFrequency !== 'Manual') {
    websiteUpdates.nextScanDate = computeNextScanDate(website.scanFrequency);
  }

  await website.update(websiteUpdates);

  const scanWithResults = await Scan.findByPk(scan.id, { include: ScanResult });

  if (owner) {
    await notifyScanCompleted(owner, website, scanWithResults, severityCounts).catch((e) =>
      console.error('notifyScanCompleted failed:', e.message)
    );

    const criticalFindings = sanitizedResults.filter((r) => r.severity === 'Critical');
    await notifyCriticalVulnerabilities(owner, website, criticalFindings).catch((e) =>
      console.error('notifyCriticalVulnerabilities failed:', e.message)
    );

    await notifyIfNewHighRiskIssues(owner, website, scan.id, sanitizedResults).catch((e) =>
      console.error('notifyIfNewHighRiskIssues failed:', e.message)
    );
  }

  return { scan: scanWithResults, securityScore: score, scoreCategory: category, severityCounts };
}

/**
 * Compares this scan's High/Critical findings against the website's
 * previous completed scan and notifies on anything newly introduced.
 */
async function notifyIfNewHighRiskIssues(owner, website, currentScanId, currentResults) {
  const previousScan = await Scan.findOne({
    where: { WebsiteId: website.id, status: 'completed', id: { [require('sequelize').Op.ne]: currentScanId } },
    order: [['createdAt', 'DESC']],
    include: [ScanResult],
  });

  if (!previousScan) return; // first scan for this website, nothing to compare

  const key = (r) => `${r.module}::${r.issue}`;
  const previousKeys = new Set(previousScan.ScanResults.map(key));

  const newHighRisk = currentResults.filter(
    (r) => (r.severity === 'High' || r.severity === 'Critical') && !previousKeys.has(key(r))
  );

  await notifyNewHighRiskIssues(owner, website, newHighRisk);
}

function computeNextScanDate(frequency) {
  const now = new Date();
  switch (frequency) {
    case 'Daily':
      return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    case 'Weekly':
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    case 'Monthly': {
      const d = new Date(now);
      d.setMonth(d.getMonth() + 1);
      return d;
    }
    default:
      return null;
  }
}

module.exports = { runScanForWebsite, computeNextScanDate };
