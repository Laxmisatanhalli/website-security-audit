const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Scan = sequelize.define('Scan', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },

    status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'pending'
    }
});

module.exports = Scan;