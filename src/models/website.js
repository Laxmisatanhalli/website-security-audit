const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Website = sequelize.define('Website', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },

    url: {
        type: DataTypes.STRING,
        allowNull: false
    }
});

module.exports = Website;