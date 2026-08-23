const { DataTypes } = require('sequelize');
const bcrypt = require('bcrypt');
const { sequelize } = require('../config/db');

const User = sequelize.define('User', {
  name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: { msg: 'name is required' },
        },
    },

    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            notEmpty: { msg: 'email is required' },
            isEmail: { msg: 'Please enter a valid email address' },
        },
    },

    password: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: { msg: 'password is required' },
            len: {
                args: [6, 100],
                msg: 'password must be at least 6 characters long'
            },
        },
    } 
}, 
{ 
  hooks: {
        beforeCreate: async (user) => {
            if (user.password) {
                user.password = await bcrypt.hash(user.password, 10);
            }
        },

        beforeUpdate: async (user) => {
            if (user.changed('password')) {
                user.password = await bcrypt.hash(user.password, 10);
            }
        },
    },

    defaultScope: {
        attributes: { exclude: ['password'] },
    },

    scopes: {
        withPassword: {
            attributes: {},
        },
    },

});

module.exports = User;