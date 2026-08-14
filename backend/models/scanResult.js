const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const ScanResult = sequelize.define('ScanResult', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },

    module: {
        type: DataTypes.STRING,
        allowNull: false
    },

    severity: {
        type: DataTypes.STRING,
        allowNull: false
    },

    issue: {
        type: DataTypes.TEXT,
        allowNull: false
    },

    recommendation: {
        type: DataTypes.TEXT
    }
});

module.exports = ScanResult;