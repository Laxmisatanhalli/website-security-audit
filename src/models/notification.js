const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Notification = sequelize.define('Notification', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },

    type: {
        type: DataTypes.ENUM(
            'scan_completed',
            'scan_failed',
            'critical_vulnerability',
            'ssl_expiry',
            'new_high_risk_issue'
        ),
        allowNull: false
    },

    severity: {
        type: DataTypes.ENUM('Info', 'Low', 'Medium', 'High', 'Critical'),
        allowNull: false,
        defaultValue: 'Info'
    },

    title: {
        type: DataTypes.STRING,
        allowNull: false
    },

    message: {
        type: DataTypes.TEXT,
        allowNull: false
    },

    isRead: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },

    emailSent: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    }
});

module.exports = Notification;
