const { Op } = require('sequelize');
const { Website, Scan, ScanResult } = require('../models');
const { scoreToCategory, summarizeSeverities } = require('../utils/scoring');

const SEVERITY_ORDER = { Critical: 0, High: 1, Medium: 2, Low: 3, Info: 4 };

function sortBySeverity(results) {
  return [...results].sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);
}

async function loadScanWithFindings(scanId) {
  const scan = await Scan.findByPk(scanId, { include: [ScanResult, Website] });
  if (!scan) {
    const err = new Error('Scan not found');
    err.status = 404;
    throw err;
  }
  return scan;
}

/**
 * Executive Summary - high-level overview for non-technical stakeholders.
 */
async function buildExecutiveSummary(scanId) {
  const scan = await loadScanWithFindings(scanId);
  const findings = scan.ScanResults || [];
  const severityCounts = summarizeSeverities(findings);
  const topFindings = sortBySeverity(findings)
    .filter((f) => f.severity === 'Critical' || f.severity === 'High')
    .slice(0, 5)
    .map((f) => ({ module: f.module, issue: f.issue, severity: f.severity }));

  return {
    reportType: 'Executive Summary',
    website: { name: scan.Website.name, url: scan.Website.url },
    scanDate: scan.createdAt,
    securityScore: scan.securityScore,
    scoreCategory: scan.scoreCategory || scoreToCategory(scan.securityScore ?? 0),
    severityCounts,
    totalFindings: findings.length,
    topFindings,
    narrative: `This scan of ${scan.Website.url} on ${new Date(scan.createdAt).toDateString()} `
      + `produced a security score of ${scan.securityScore ?? 'N/A'} (${scan.scoreCategory || 'Unrated'}). `
      + `${severityCounts.Critical} critical and ${severityCounts.High} high-severity issues were identified `
      + `and should be prioritized for remediation.`,
  };
}

/**
 * Technical Report - full detail for engineering teams.
 */
async function buildTechnicalReport(scanId) {
  const scan = await loadScanWithFindings(scanId);
  const findings = sortBySeverity(scan.ScanResults || []);

  return {
    reportType: 'Technical Report',
    website: { name: scan.Website.name, url: scan.Website.url, environment: scan.Website.environment },
    scanDate: scan.createdAt,
    securityScore: scan.securityScore,
    findings: findings.map((f) => ({
      module: f.module,
      severity: f.severity,
      issue: f.issue,
      recommendation: f.recommendation,
    })),
  };
}

/**
 * Compliance Report - maps findings against an OWASP-aligned baseline
 * checklist and marks each control as Pass/Fail.
 */
const COMPLIANCE_BASELINE = [
  { control: 'HTTPS enforced (HTTP redirects to HTTPS)', modules: ['Redirect Analysis'] },
  { control: 'Valid, non-expired SSL/TLS certificate', modules: ['SSL/TLS'] },
  { control: 'Security headers present (CSP, HSTS, X-Frame-Options, etc.)', modules: ['Security Headers'] },
  { control: 'Cookies flagged Secure/HttpOnly/SameSite', modules: ['Cookie Security'] },
  { control: 'No server/version information disclosure', modules: ['Information Disclosure'] },
  { control: 'Directory listing disabled', modules: ['Directory Listing'] },
  { control: 'No sensitive files publicly exposed', modules: ['Sensitive File Exposure'] },
  { control: 'Unnecessary HTTP methods disabled', modules: ['HTTP Methods'] },
  { control: 'Email authentication (SPF/DMARC) configured', modules: ['Email Security', 'DNS Security'] },
];

async function buildComplianceReport(scanId) {
  const scan = await loadScanWithFindings(scanId);
  const findings = scan.ScanResults || [];

  const controls = COMPLIANCE_BASELINE.map((baseline) => {
    const relatedFailures = findings.filter(
      (f) => baseline.modules.includes(f.module) && f.severity !== 'Info'
    );
    return {
      control: baseline.control,
      status: relatedFailures.length === 0 ? 'Pass' : 'Fail',
      relatedFindings: relatedFailures.map((f) => f.issue),
    };
  });

  const passed = controls.filter((c) => c.status === 'Pass').length;

  return {
    reportType: 'Compliance Report',
    website: { name: scan.Website.name, url: scan.Website.url },
    scanDate: scan.createdAt,
    complianceRate: `${passed}/${controls.length}`,
    controls,
  };
}

/**
 * Vulnerability Report - every actionable finding, Info excluded.
 */
async function buildVulnerabilityReport(scanId) {
  const scan = await loadScanWithFindings(scanId);
  const findings = sortBySeverity((scan.ScanResults || []).filter((f) => f.severity !== 'Info'));

  return {
    reportType: 'Vulnerability Report',
    website: { name: scan.Website.name, url: scan.Website.url },
    scanDate: scan.createdAt,
    totalVulnerabilities: findings.length,
    findings: findings.map((f) => ({
      module: f.module,
      severity: f.severity,
      issue: f.issue,
      recommendation: f.recommendation,
    })),
  };
}

/**
 * Remediation Report - step-by-step fixes grouped by module, pulling from
 * the Remediation Knowledge Base (Section 8) for platform snippets where
 * the finding's own recommendation doesn't already carry one.
 */
const { getRemediationSteps } = require('./remediationKnowledgeBase.service');

async function buildRemediationReport(scanId) {
  const scan = await loadScanWithFindings(scanId);
  const findings = sortBySeverity((scan.ScanResults || []).filter((f) => f.severity !== 'Info'));

  const grouped = {};
  for (const f of findings) {
    if (!grouped[f.module]) grouped[f.module] = [];
    grouped[f.module].push({
      issue: f.issue,
      severity: f.severity,
      recommendation: f.recommendation,
      steps: getRemediationSteps(f.module, f.issue),
    });
  }

  return {
    reportType: 'Remediation Report',
    website: { name: scan.Website.name, url: scan.Website.url },
    scanDate: scan.createdAt,
    modules: Object.entries(grouped).map(([module, items]) => ({ module, items })),
  };
}

/**
 * Trend Report - score and severity-count history for a website across
 * its last N completed scans.
 */
async function buildTrendReport(websiteId, limit = 10) {
  const website = await Website.findByPk(websiteId);
  if (!website) {
    const err = new Error('Website not found');
    err.status = 404;
    throw err;
  }

  const scans = await Scan.findAll({
    where: { WebsiteId: websiteId, status: 'completed' },
    include: [ScanResult],
    order: [['createdAt', 'DESC']],
    limit,
  });

  const history = scans.reverse().map((s) => ({
    scanId: s.id,
    date: s.createdAt,
    securityScore: s.securityScore,
    scoreCategory: s.scoreCategory,
    severityCounts: summarizeSeverities(s.ScanResults || []),
  }));

  return {
    reportType: 'Trend Report',
    website: { name: website.name, url: website.url },
    history,
  };
}

module.exports = {
  buildExecutiveSummary,
  buildTechnicalReport,
  buildComplianceReport,
  buildVulnerabilityReport,
  buildRemediationReport,
  buildTrendReport,
};
