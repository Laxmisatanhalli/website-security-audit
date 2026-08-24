const User = require('./user');
const Website = require('./website');
const Scan = require('./scan');
const ScanResult = require('./scanResult');

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