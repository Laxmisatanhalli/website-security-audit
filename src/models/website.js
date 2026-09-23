const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Website = sequelize.define('Website', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },

    name: {
        type: DataTypes.STRING,
        allowNull: false
    },

    url: {
        type: DataTypes.STRING,
        allowNull: false
    },

    ipAddress: {
        type: DataTypes.STRING,
        allowNull: true
    },

    owner: {
        type: DataTypes.STRING,
        allowNull: true
    },

    environment: {
        type: DataTypes.ENUM('Production', 'Staging', 'Development'),
        allowNull: false,
        defaultValue: 'Production'
    },

    serverType: {
        type: DataTypes.STRING,
        allowNull: true
    },

    cmsType: {
        type: DataTypes.STRING,
        allowNull: true
    },

    framework: {
        type: DataTypes.STRING,
        allowNull: true
    },

    scanFrequency: {
        type: DataTypes.ENUM('Manual', 'Daily', 'Weekly', 'Monthly'),
        allowNull: false,
        defaultValue: 'Manual'
    },

    scanType: {
        type: DataTypes.ENUM('Full', 'Headers Only', 'SSL Only', 'Quick'),
        allowNull: false,
        defaultValue: 'Full'
    },

    notes: {
        type: DataTypes.TEXT,
        allowNull: true
    },

    group: {
        type: DataTypes.STRING,
        allowNull: true
    },

    lastScanDate: {
        type: DataTypes.DATE,
        allowNull: true
    },

    sslExpiryDate: {
        type: DataTypes.DATE,
        allowNull: true
    },

    nextScanDate: {
        type: DataTypes.DATE,
        allowNull: true
    },

    status: {
        type: DataTypes.ENUM('Enabled', 'Disabled'),
        allowNull: false,
        defaultValue: 'Enabled'
    },

    securityScore: {
        type: DataTypes.INTEGER,
        allowNull: true
    }
});

module.exports = Website;
