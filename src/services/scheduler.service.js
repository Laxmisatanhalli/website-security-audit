const cron = require('node-cron');
const { Op } = require('sequelize');
const { Website, User } = require('../models');
const { runScanForWebsite } = require('./scanRunner.service');
const { notifySslExpiry } = require('./notification.service');
const { getSettings } = require('./settings.service');

let dueScansTask = null;
let sslCheckTask = null;

/**
 * Runs every 15 minutes: finds websites whose nextScanDate has passed
 * (Daily/Weekly/Monthly frequency, status Enabled) and scans them.
 * Manual-frequency websites are never picked up here.
 */
async function runDueScans() {
  const now = new Date();

  const dueWebsites = await Website.findAll({
    where: {
      status: 'Enabled',
      scanFrequency: { [Op.ne]: 'Manual' },
      nextScanDate: { [Op.lte]: now },
    },
  });

  for (const website of dueWebsites) {
    try {
      const owner = await User.findByPk(website.UserId);
      console.log(`[scheduler] Running scheduled scan for website ${website.id} (${website.url})`);
      await runScanForWebsite(website, owner);
    } catch (err) {
      // runScanForWebsite already records the failure and notifies; just
      // log here so one failing website doesn't stop the batch.
      console.error(`[scheduler] Scheduled scan failed for website ${website.id}:`, err.message);
    }
  }

  return dueWebsites.length;
}

/**
 * Runs daily: checks SSL expiry across all enabled websites and notifies
 * owners at the 30/7/1 day thresholds, plus on actual expiry.
 */
async function runSslExpiryCheck() {
  const now = new Date();
  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const websites = await Website.findAll({
    where: {
      status: 'Enabled',
      sslExpiryDate: { [Op.ne]: null, [Op.lte]: in30Days },
    },
  });

  const alertThresholds = new Set([30, 7, 1, 0]);

  for (const website of websites) {
    const daysRemaining = Math.ceil((new Date(website.sslExpiryDate) - now) / (24 * 60 * 60 * 1000));
    const shouldAlert = daysRemaining < 0 || alertThresholds.has(daysRemaining);

    if (!shouldAlert) continue;

    try {
      const owner = await User.findByPk(website.UserId);
      if (owner) {
        await notifySslExpiry(owner, website, daysRemaining);
      }
    } catch (err) {
      console.error(`[scheduler] SSL expiry notification failed for website ${website.id}:`, err.message);
    }
  }

  return websites.length;
}

/**
 * Initializes the recurring cron jobs. Call once at app startup, e.g. from
 * server.js: require('./src/services/scheduler.service').startScheduler();
 */
function startScheduler() {
  if (dueScansTask || sslCheckTask) {
    console.warn('[scheduler] startScheduler() called more than once, ignoring');
    return;
  }

  // Every 15 minutes
    const settings = getSettings();
  dueScansTask = cron.schedule(`*/${settings.schedulerIntervalMinutes} * * * *`, () => {
    runDueScans().catch((err) => console.error('[scheduler] runDueScans crashed:', err));
  });

  // Daily at 06:00 server time
    sslCheckTask = cron.schedule(`0 ${settings.sslCheckHourUtc} * * *`, () => {
    runSslExpiryCheck().catch((err) => console.error('[scheduler] runSslExpiryCheck crashed:', err));
  });

  console.log('[scheduler] Scheduled scan and SSL expiry jobs started');
}

function stopScheduler() {
  if (dueScansTask) { dueScansTask.stop(); dueScansTask = null; }
  if (sslCheckTask) { sslCheckTask.stop(); sslCheckTask = null; }
}

function restartScheduler() {
  stopScheduler();
  startScheduler();
}
module.exports = { startScheduler, stopScheduler, restartScheduler, runDueScans, runSslExpiryCheck };