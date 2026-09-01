const { DataTypes } = require('sequelize');
const bcrypt = require('bcrypt');
const { sequelize } = require('../config/db');

const User = sequelize.define('User', {
  username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            notEmpty: { msg: 'username is required' },
            len: {
                args: [3, 50],
                msg: 'username must be 3-50 characters'
            },
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
    },
    role: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'Viewer',
    },

    systemUser: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
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
        withSystemUser: {
            attributes: {},
        }
    },

});

module.exports = User;