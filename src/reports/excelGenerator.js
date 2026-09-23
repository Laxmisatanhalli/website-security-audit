const ExcelJS = require('exceljs');

const SEVERITY_FILL = {
  Critical: 'FF7A0D0D',
  High: 'FFC0392B',
  Medium: 'FFD68910',
  Low: 'FF2E86C1',
  Info: 'FF7F8C8D',
};

function styleHeaderRow(row) {
  row.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2C3E50' } };
  row.alignment = { vertical: 'middle' };
}

function addFindingsSheet(workbook, sheetName, findings) {
  const sheet = workbook.addWorksheet(sheetName);
  sheet.columns = [
    { header: 'Module', key: 'module', width: 28 },
    { header: 'Severity', key: 'severity', width: 12 },
    { header: 'Issue', key: 'issue', width: 60 },
    { header: 'Recommendation', key: 'recommendation', width: 60 },
  ];
  styleHeaderRow(sheet.getRow(1));

  findings.forEach((f) => {
    const row = sheet.addRow(f);
    const severityCell = row.getCell('severity');
    const color = SEVERITY_FILL[f.severity];
    if (color) {
      severityCell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
      severityCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: color } };
    }
    row.getCell('issue').alignment = { wrapText: true };
    row.getCell('recommendation').alignment = { wrapText: true };
  });

  sheet.autoFilter = { from: 'A1', to: 'D1' };
  return sheet;
}

/**
 * Renders a report data object into an Excel workbook buffer.
 * Returns a Promise<Buffer>.
 */
async function generateExcel(reportData) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Website Security Audit & Vulnerability Scanner';
  workbook.created = new Date();

  switch (reportData.reportType) {
    case 'Executive Summary': {
      const summary = workbook.addWorksheet('Summary');
      summary.columns = [{ key: 'label', width: 28 }, { key: 'value', width: 60 }];
      summary.addRow(['Website', `${reportData.website.name} (${reportData.website.url})`]);
      summary.addRow(['Scan date', new Date(reportData.scanDate).toLocaleString()]);
      summary.addRow(['Security score', reportData.securityScore ?? 'N/A']);
      summary.addRow(['Score category', reportData.scoreCategory]);
      summary.addRow(['Critical findings', reportData.severityCounts.Critical]);
      summary.addRow(['High findings', reportData.severityCounts.High]);
      summary.addRow(['Medium findings', reportData.severityCounts.Medium]);
      summary.addRow(['Low findings', reportData.severityCounts.Low]);
      summary.addRow([]);
      summary.addRow(['Narrative']);
      summary.addRow([reportData.narrative]);
      addFindingsSheet(workbook, 'Top Findings', reportData.topFindings);
      break;
    }

    case 'Technical Report':
    case 'Vulnerability Report': {
      addFindingsSheet(workbook, 'Findings', reportData.findings);
      break;
    }

    case 'Compliance Report': {
      const sheet = workbook.addWorksheet('Compliance');
      sheet.columns = [
        { header: 'Control', key: 'control', width: 50 },
        { header: 'Status', key: 'status', width: 12 },
        { header: 'Related Findings', key: 'relatedFindings', width: 60 },
      ];
      styleHeaderRow(sheet.getRow(1));
      reportData.controls.forEach((c) => {
        const row = sheet.addRow({ ...c, relatedFindings: c.relatedFindings.join('; ') });
        const cell = row.getCell('status');
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: c.status === 'Pass' ? 'FF1E8449' : 'FFC0392B' },
        };
      });
      break;
    }

    case 'Remediation Report': {
      const sheet = workbook.addWorksheet('Remediation');
      sheet.columns = [
        { header: 'Module', key: 'module', width: 25 },
        { header: 'Issue', key: 'issue', width: 45 },
        { header: 'Severity', key: 'severity', width: 12 },
        { header: 'Recommendation', key: 'recommendation', width: 45 },
        { header: 'Fix Description', key: 'fixDescription', width: 45 },
      ];
      styleHeaderRow(sheet.getRow(1));
      reportData.modules.forEach((group) => {
        group.items.forEach((item) => {
          sheet.addRow({
            module: group.module,
            issue: item.issue,
            severity: item.severity,
            recommendation: item.recommendation,
            fixDescription: item.steps ? item.steps.description : '',
          });
        });
      });
      break;
    }

    case 'Trend Report': {
      const sheet = workbook.addWorksheet('Trend');
      sheet.columns = [
        { header: 'Date', key: 'date', width: 20 },
        { header: 'Score', key: 'score', width: 10 },
        { header: 'Category', key: 'category', width: 18 },
        { header: 'Critical', key: 'critical', width: 10 },
        { header: 'High', key: 'high', width: 10 },
        { header: 'Medium', key: 'medium', width: 10 },
        { header: 'Low', key: 'low', width: 10 },
      ];
      styleHeaderRow(sheet.getRow(1));
      reportData.history.forEach((h) => {
        sheet.addRow({
          date: new Date(h.date).toLocaleDateString(),
          score: h.securityScore,
          category: h.scoreCategory,
          critical: h.severityCounts.Critical,
          high: h.severityCounts.High,
          medium: h.severityCounts.Medium,
          low: h.severityCounts.Low,
        });
      });
      break;
    }

    default:
      workbook.addWorksheet('Report').addRow([`Unsupported report type: ${reportData.reportType}`]);
  }

  return workbook.xlsx.writeBuffer();
}

module.exports = { generateExcel };
