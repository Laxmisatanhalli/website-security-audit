// src/routes/settings.routes.js
const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/rbac.middleware');

const FILE = path.join(__dirname, '..', 'config', 'settings.json');
const DEFAULTS = {
  scanTimeoutSeconds: 10, scanRetries: 1, schedulerIntervalMinutes: 15,
  sslCheckHourUtc: 6, emailNotificationsEnabled: true, inAppNotificationsEnabled: true,
};
const NUMBERS = ['scanTimeoutSeconds', 'scanRetries', 'schedulerIntervalMinutes', 'sslCheckHourUtc'];
const BOOLS = ['emailNotificationsEnabled', 'inAppNotificationsEnabled'];

function load() {
  try { return { ...DEFAULTS, ...JSON.parse(fs.readFileSync(FILE, 'utf8')) }; }
  catch { return { ...DEFAULTS }; }
}

router.use(authMiddleware);
router.get('/', requireRole('Administrator'), (req, res) => res.json({ settings: load() }));

router.put('/', requireRole('Administrator'), (req, res) => {
  const next = load();
  for (const k of NUMBERS) {
    if (req.body[k] === undefined) continue;
    const n = Number(req.body[k]);
    if (!Number.isFinite(n) || n < 0) return res.status(400).json({ message: `${k} must be a positive number` });
    next[k] = n;
  }
  for (const k of BOOLS) if (req.body[k] !== undefined) next[k] = !!req.body[k];
  fs.writeFileSync(FILE, JSON.stringify(next, null, 2));
  res.json({ settings: next });
});

module.exports = router;