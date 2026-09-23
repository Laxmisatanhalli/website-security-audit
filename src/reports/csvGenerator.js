/**
 * Minimal CSV generator (no dependency needed). Flattens each report type's
 * data into rows appropriate for that report.
 */
function escapeCsvField(value) {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function rowsToCsv(headers, rows) {
  const lines = [headers.map(escapeCsvField).join(',')];
  for (const row of rows) {
    lines.push(headers.map((h) => escapeCsvField(row[h])).join(','));
  }
  return lines.join('\n');
}

function generateCsv(reportData) {
  switch (reportData.reportType) {
    case 'Executive Summary': {
      const headers = ['module', 'issue', 'severity'];
      return rowsToCsv(headers, reportData.topFindings);
    }
    case 'Technical Report':
    case 'Vulnerability Report': {
      const headers = ['module', 'severity', 'issue', 'recommendation'];
      return rowsToCsv(headers, reportData.findings);
    }
    case 'Compliance Report': {
      const headers = ['control', 'status', 'relatedFindings'];
      const rows = reportData.controls.map((c) => ({
        ...c,
        relatedFindings: c.relatedFindings.join('; '),
      }));
      return rowsToCsv(headers, rows);
    }
    case 'Remediation Report': {
      const headers = ['module', 'issue', 'severity', 'recommendation'];
      const rows = [];
      for (const group of reportData.modules) {
        for (const item of group.items) {
          rows.push({
            module: group.module,
            issue: item.issue,
            severity: item.severity,
            recommendation: item.recommendation,
          });
        }
      }
      return rowsToCsv(headers, rows);
    }
    case 'Trend Report': {
      const headers = ['date', 'securityScore', 'scoreCategory', 'critical', 'high', 'medium', 'low'];
      const rows = reportData.history.map((h) => ({
        date: h.date,
        securityScore: h.securityScore,
        scoreCategory: h.scoreCategory,
        critical: h.severityCounts.Critical,
        high: h.severityCounts.High,
        medium: h.severityCounts.Medium,
        low: h.severityCounts.Low,
      }));
      return rowsToCsv(headers, rows);
    }
    default:
      throw new Error(`Unsupported report type for CSV: ${reportData.reportType}`);
  }
}

module.exports = { generateCsv };
