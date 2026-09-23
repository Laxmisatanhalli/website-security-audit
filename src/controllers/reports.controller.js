const { Scan, Website } = require('../models');
const {
  buildExecutiveSummary,
  buildTechnicalReport,
  buildComplianceReport,
  buildVulnerabilityReport,
  buildRemediationReport,
  buildTrendReport,
} = require('../services/reportData.service');
const { generatePdf } = require('../reports/pdfGenerator');
const { generateExcel } = require('../reports/excelGenerator');
const { generateCsv } = require('../reports/csvGenerator');

const BUILDERS = {
  executive: buildExecutiveSummary,
  technical: buildTechnicalReport,
  compliance: buildComplianceReport,
  vulnerability: buildVulnerabilityReport,
  remediation: buildRemediationReport,
};

const CONTENT_TYPES = {
  pdf: 'application/pdf',
  excel: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  csv: 'text/csv',
};

const EXTENSIONS = { pdf: 'pdf', excel: 'xlsx', csv: 'csv' };

async function assertScanAccess(user, scan) {
  if (!scan) return false;
  if (user.role === 'Administrator') return true;
  return scan.Website && scan.Website.UserId === user.id;
}

async function assertWebsiteAccess(user, website) {
  if (!website) return false;
  if (user.role === 'Administrator') return true;
  return website.UserId === user.id;
}

/**
 * GET /reports/:scanId?type=executive|technical|compliance|vulnerability|remediation&format=pdf|excel|csv
 */
async function generateScanReport(req, res) {
  try {
    const { scanId } = req.params;
    const type = (req.query.type || 'technical').toLowerCase();
    const format = (req.query.format || 'pdf').toLowerCase();

    if (!BUILDERS[type]) {
      return res.status(400).json({ message: `Unknown report type. Use one of: ${Object.keys(BUILDERS).join(', ')}` });
    }
    if (!CONTENT_TYPES[format]) {
      return res.status(400).json({ message: `Unknown format. Use one of: ${Object.keys(CONTENT_TYPES).join(', ')}` });
    }

    const scan = await Scan.findByPk(scanId, { include: [Website] });
    const authorized = await assertScanAccess(req.user, scan);
    if (!authorized) {
      return res.status(404).json({ message: 'Scan not found' });
    }

    const reportData = await BUILDERS[type](scanId);

    let buffer;
    if (format === 'pdf') buffer = await generatePdf(reportData);
    else if (format === 'excel') buffer = await generateExcel(reportData);
    else buffer = Buffer.from(generateCsv(reportData), 'utf-8');

    const filename = `${type}-report-${scanId}.${EXTENSIONS[format]}`;
    res.setHeader('Content-Type', CONTENT_TYPES[format]);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.status(200).send(buffer);
  } catch (err) {
    console.error('generateScanReport error:', err);
    const status = err.status || 500;
    return res.status(status).json({ message: err.message || 'Internal server error' });
  }
}

/**
 * GET /reports/trend/:websiteId?format=pdf|excel|csv&limit=10
 */
async function generateTrendReport(req, res) {
  try {
    const { websiteId } = req.params;
    const format = (req.query.format || 'pdf').toLowerCase();
    const limit = Math.min(Number(req.query.limit) || 10, 50);

    if (!CONTENT_TYPES[format]) {
      return res.status(400).json({ message: `Unknown format. Use one of: ${Object.keys(CONTENT_TYPES).join(', ')}` });
    }

    const website = await Website.findByPk(websiteId);
    const authorized = await assertWebsiteAccess(req.user, website);
    if (!authorized) {
      return res.status(404).json({ message: 'Website not found' });
    }

    const reportData = await buildTrendReport(websiteId, limit);

    let buffer;
    if (format === 'pdf') buffer = await generatePdf(reportData);
    else if (format === 'excel') buffer = await generateExcel(reportData);
    else buffer = Buffer.from(generateCsv(reportData), 'utf-8');

    const filename = `trend-report-${websiteId}.${EXTENSIONS[format]}`;
    res.setHeader('Content-Type', CONTENT_TYPES[format]);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.status(200).send(buffer);
  } catch (err) {
    console.error('generateTrendReport error:', err);
    const status = err.status || 500;
    return res.status(status).json({ message: err.message || 'Internal server error' });
  }
}

module.exports = { generateScanReport, generateTrendReport };
