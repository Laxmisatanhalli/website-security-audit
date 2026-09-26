const PDFDocument = require('pdfkit');

const SEVERITY_COLORS = {
  Critical: '#7a0d0d',
  High: '#c0392b',
  Medium: '#d68910',
  Low: '#2e86c1',
  Info: '#7f8c8d',
};

function addHeader(doc, title, website, scanDate) {
  doc.fontSize(20).fillColor('#111').text(title, { align: 'left' });
  doc.moveDown(0.3);
  doc.fontSize(11).fillColor('#444');
  if (website) doc.text(`Website: ${website.name} (${website.url})`);
  if (scanDate) doc.text(`Scan date: ${new Date(scanDate).toLocaleString()}`);
  doc.moveDown(1);
  doc.strokeColor('#ccc').moveTo(doc.x, doc.y).lineTo(545, doc.y).stroke();
  doc.moveDown(1);
}

function addFindingRow(doc, finding) {
  const color = SEVERITY_COLORS[finding.severity] || '#333';
  doc.fontSize(11).fillColor(color).text(`[${finding.severity}] `, { continued: true });
  doc.fillColor('#111').text(`${finding.module}: ${finding.issue}`);
  if (finding.recommendation) {
    doc.fontSize(10).fillColor('#555').text(`Recommendation: ${finding.recommendation}`, { indent: 14 });
  }
  doc.moveDown(0.6);
}

const SEVERITY_ORDER = ['Critical', 'High', 'Medium', 'Low', 'Info'];

function addFindingsGroupedBySeverity(doc, findings) {
  for (const severity of SEVERITY_ORDER) {
    const group = findings.filter((f) => f.severity === severity);
    if (!group.length) continue;

    doc.fontSize(13).fillColor(SEVERITY_COLORS[severity] || '#333').text(severity.toUpperCase());
    doc.moveDown(0.3);

    group.forEach((f, i) => {
      doc.fontSize(11).fillColor('#111').text(`${i + 1}) ${f.module}: ${f.issue}`);
      if (f.recommendation) {
        doc.fontSize(10).fillColor('#555').text(`Recommendation: ${f.recommendation}`, { indent: 14 });
      }
      doc.moveDown(0.5);
    });
    doc.moveDown(0.6);
  }
}

/**
 * Renders a report data object (from reportData.service.js) into a PDF
 * buffer. Returns a Promise<Buffer>.
 */
function generatePdf(reportData) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    try {
      switch (reportData.reportType) {
        case 'Executive Summary': {
          addHeader(doc, 'Executive Summary', reportData.website, reportData.scanDate);
          doc.fontSize(14).fillColor('#111').text(
            `Security Score: ${reportData.securityScore ?? 'N/A'} (${reportData.scoreCategory})`
          );
          doc.moveDown(0.5);
          doc.fontSize(11).fillColor('#333').text(reportData.narrative, { align: 'left' });
          doc.moveDown(1);
          doc.fontSize(13).fillColor('#111').text('Findings by severity');
          doc.moveDown(0.3);
          const sc = reportData.severityCounts;
          doc.fontSize(11).fillColor('#333').list([
            `Critical: ${sc.Critical}`,
            `High: ${sc.High}`,
            `Medium: ${sc.Medium}`,
            `Low: ${sc.Low}`,
          ]);
          if (reportData.topFindings.length) {
            doc.moveDown(1);
            doc.fontSize(13).fillColor('#111').text('Top issues requiring attention');
            doc.moveDown(0.3);
            reportData.topFindings.forEach((f) => addFindingRow(doc, f));
          }
          break;
        }

        case 'Technical Report': {
          addHeader(doc, 'Technical Report', reportData.website, reportData.scanDate);
          addFindingsGroupedBySeverity(doc, reportData.findings);
          break;
        }

        case 'Vulnerability Report': {
          addHeader(doc, 'Vulnerability Report', reportData.website, reportData.scanDate);
          doc.fontSize(11).fillColor('#333').text(`Total vulnerabilities: ${reportData.totalVulnerabilities}`);
          doc.moveDown(0.8);
          addFindingsGroupedBySeverity(doc, reportData.findings);
          break;
        }

        case 'Compliance Report': {
          addHeader(doc, 'Compliance Report', reportData.website, reportData.scanDate);
          doc.fontSize(12).fillColor('#111').text(`Compliance rate: ${reportData.complianceRate}`);
          doc.moveDown(0.8);
          reportData.controls.forEach((c) => {
            const color = c.status === 'Pass' ? '#1e8449' : '#c0392b';
            doc.fontSize(11).fillColor(color).text(`[${c.status}] `, { continued: true });
            doc.fillColor('#111').text(c.control);
            if (c.relatedFindings.length) {
              doc.fontSize(9).fillColor('#666').text(c.relatedFindings.join('; '), { indent: 14 });
            }
            doc.moveDown(0.5);
          });
          break;
        }

        case 'Remediation Report': {
          addHeader(doc, 'Remediation Report', reportData.website, reportData.scanDate);
          reportData.modules.forEach((group) => {
            doc.fontSize(13).fillColor('#111').text(group.module);
            doc.moveDown(0.2);
            group.items.forEach((item) => {
              addFindingRow(doc, item);
              if (item.steps) {
                doc.fontSize(9).fillColor('#555').text(`Fix: ${item.steps.description}`, { indent: 14 });
                if (item.steps.apache) doc.fontSize(8).fillColor('#777').text(`Apache: ${item.steps.apache}`, { indent: 14 });
                if (item.steps.nginx) doc.fontSize(8).fillColor('#777').text(`Nginx: ${item.steps.nginx}`, { indent: 14 });
              }
              doc.moveDown(0.4);
            });
            doc.moveDown(0.5);
          });
          break;
        }

        case 'Trend Report': {
          addHeader(doc, 'Trend Report', reportData.website, null);
          reportData.history.forEach((h) => {
            doc.fontSize(11).fillColor('#111').text(
              `${new Date(h.date).toLocaleDateString()} — Score: ${h.securityScore ?? 'N/A'} (${h.scoreCategory || 'Unrated'})`
            );
            doc.fontSize(9).fillColor('#555').text(
              `Critical: ${h.severityCounts.Critical}  High: ${h.severityCounts.High}  Medium: ${h.severityCounts.Medium}  Low: ${h.severityCounts.Low}`,
              { indent: 14 }
            );
            doc.moveDown(0.5);
          });
          break;
        }

        default:
          doc.text(`Unsupported report type: ${reportData.reportType}`);
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = { generatePdf };
