const User = require('./User');
const Website = require('./Website');
const Scan = require('./Scan');
const ScanResult = require('./ScanResult');

User.hasMany(Website);
Website.belongsTo(User);

Website.hasMany(Scan);
Scan.belongsTo(Website);

Scan.hasMany(ScanResult);
ScanResult.belongsTo(Scan);

module.exports = {
    User,
    Website,
    Scan,
    ScanResult
};