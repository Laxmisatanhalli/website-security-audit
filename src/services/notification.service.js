const { Notification, User } = require('../models');
const { sendEmail } = require('./email.service');

/**
 * Creates an in-app notification for a user and, when the user has an
 * email address, sends a matching email. Failures to email do not block
 * the in-app notification from being saved.
 */
async function notifyUser(userId, { type, severity = 'Info', title, message }) {
  const notification = await Notification.create({
    UserId: userId,
    type,
    severity,
    title,
    message,
  });

  const user = await User.findByPk(userId);
  if (user && user.email) {
    const result = await sendEmail({
      to: user.email,
      subject: `[Security Scanner] ${title}`,
      text: message,
    });
    if (result.sent) {
      await notification.update({ emailSent: true });
    }
  }

  return notification;
}

async function notifyScanCompleted(user, website, scan, severityCounts) {
  return notifyUser(user.id, {
    type: 'scan_completed',
    severity: 'Info',
    title: `Scan completed: ${website.name}`,
    message: `Scan of ${website.url} finished with a security score of ${scan.securityScore} `
      + `(${scan.scoreCategory}). Findings — Critical: ${severityCounts.Critical}, High: ${severityCounts.High}, `
      + `Medium: ${severityCounts.Medium}, Low: ${severityCounts.Low}.`,
  });
}

async function notifyScanFailed(user, website, errorMessage) {
  return notifyUser(user.id, {
    type: 'scan_failed',
    severity: 'Medium',
    title: `Scan failed: ${website.name}`,
    message: `The scan of ${website.url} did not complete: ${errorMessage}`,
  });
}

async function notifyCriticalVulnerabilities(user, website, criticalFindings) {
  if (!criticalFindings.length) return null;
  return notifyUser(user.id, {
    type: 'critical_vulnerability',
    severity: 'Critical',
    title: `${criticalFindings.length} critical issue(s) found on ${website.name}`,
    message: criticalFindings.map((f) => `- [${f.module}] ${f.issue}`).join('\n'),
  });
}

async function notifySslExpiry(user, website, daysRemaining) {
  return notifyUser(user.id, {
    type: 'ssl_expiry',
    severity: daysRemaining < 0 ? 'Critical' : daysRemaining <= 7 ? 'High' : 'Medium',
    title: daysRemaining < 0
      ? `SSL certificate expired: ${website.name}`
      : `SSL certificate expiring soon: ${website.name}`,
    message: daysRemaining < 0
      ? `The SSL certificate for ${website.url} has expired.`
      : `The SSL certificate for ${website.url} expires in ${daysRemaining} day(s).`,
  });
}

async function notifyNewHighRiskIssues(user, website, newIssues) {
  if (!newIssues.length) return null;
  return notifyUser(user.id, {
    type: 'new_high_risk_issue',
    severity: 'High',
    title: `${newIssues.length} new high-risk issue(s) on ${website.name}`,
    message: newIssues.map((f) => `- [${f.module}] ${f.issue}`).join('\n'),
  });
}

module.exports = {
  notifyUser,
  notifyScanCompleted,
  notifyScanFailed,
  notifyCriticalVulnerabilities,
  notifySslExpiry,
  notifyNewHighRiskIssues,
};
