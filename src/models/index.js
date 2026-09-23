const { sequelize } = require('../config/db');

const User = require('./user');
const Website = require('./website');
const Scan = require('./scan');
const ScanResult = require('./scanResult');
const Notification = require('./notification');

// --- User <-> Website ---
User.hasMany(Website);
Website.belongsTo(User);

// --- Website <-> Scan ---
Website.hasMany(Scan);
Scan.belongsTo(Website);

// --- Scan <-> ScanResult ---
Scan.hasMany(ScanResult);
ScanResult.belongsTo(Scan);

// --- User <-> Notification ---
User.hasMany(Notification);
Notification.belongsTo(User);

module.exports = {
  sequelize,
  User,
  Website,
  Scan,
  ScanResult,
  Notification,
};
