const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '..', 'config', 'settings.json');

const DEFAULTS = {
  scanTimeoutSeconds: 300,
  scanRetries: 1,
  schedulerIntervalMinutes: 15,
  sslCheckHourUtc: 6,
  emailNotificationsEnabled: true,
  inAppNotificationsEnabled: true,
};

const LIMITS = {
  scanTimeoutSeconds: [30, 900],
  scanRetries: [0, 5],
  schedulerIntervalMinutes: [1, 59],
  sslCheckHourUtc: [0, 23],
};
const BOOLEANS = ['emailNotificationsEnabled', 'inAppNotificationsEnabled'];

function getSettings() {
  try {
    return { ...DEFAULTS, ...JSON.parse(fs.readFileSync(FILE, 'utf8')) };
  } catch (err) {
    return { ...DEFAULTS };
  }
}

function updateSettings(patch) {
  const next = getSettings();

  for (const [key, [min, max]] of Object.entries(LIMITS)) {
    if (patch[key] === undefined || patch[key] === '') continue;
    const n = Number(patch[key]);
    if (!Number.isInteger(n) || n < min || n > max) {
      const err = new Error(`${key} must be a whole number between ${min} and ${max}`);
      err.status = 400;
      throw err;
    }
    next[key] = n;
  }
  for (const key of BOOLEANS) {
    if (patch[key] !== undefined) next[key] = !!patch[key];
  }

  fs.writeFileSync(FILE, JSON.stringify(next, null, 2));
  return next;
}

module.exports = { getSettings, updateSettings, DEFAULTS };