const { User } = require('../models');
const { Op } = require('sequelize');

const VALID_ROLES = ['Administrator', 'Security Analyst', 'Viewer'];

// IMPORTANT: never hash passwords here. src/models/user.js has
// beforeCreate/beforeUpdate hooks that hash automatically whenever a
// plaintext `password` field is set/changed. Hashing it again in this
// controller before calling create()/update() would double-hash it and
// break login for any user created or reset this way.

function sanitizeUser(user) {
  const { id, username, email, role, systemUser, createdAt, updatedAt } = user;
  return { id, username, email, role, systemUser, createdAt, updatedAt };
}

/**
 * GET /users - Administrator only. Lists all users (Section 4: "Manage users").
 */
async function listUsers(req, res) {
  try {
    const users = await User.findAll({ order: [['createdAt', 'DESC']] });
    return res.status(200).json({ users: users.map(sanitizeUser) });
  } catch (err) {
    console.error('listUsers error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

/**
 * POST /users - Administrator only. Creates a new user with a given role.
 */
async function createUser(req, res) {
  try {
    const { username, email, password, role } = req.body;

    if (!username || username.length < 3 || username.length > 50) {
      return res.status(400).json({ message: 'username must be 3-50 characters' });
    }
    if (!email) {
      return res.status(400).json({ message: 'email is required' });
    }
    if (!password || password.length < 8) {
      return res.status(400).json({ message: 'password must be at least 8 characters' });
    }
    if (role && !VALID_ROLES.includes(role)) {
      return res.status(400).json({ message: `role must be one of: ${VALID_ROLES.join(', ')}` });
    }

    const existing = await User.findOne({ where: { [Op.or]: [{ email }, { username }] } });
    if (existing) {
      return res.status(409).json({ message: 'A user with this email or username already exists' });
    }

    // Pass plaintext password straight through — the model's beforeCreate
    // hook hashes it. Do not hash it here.
    const user = await User.create({ username, email, password, role: role || 'Viewer' });

    return res.status(201).json({ user: sanitizeUser(user) });
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ message: 'A user with this email or username already exists' });
    }
    if (err.name === 'SequelizeValidationError') {
      return res.status(400).json({ message: err.errors?.[0]?.message || 'Invalid input' });
    }
    console.error('createUser error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

/**
 * PUT /users/:id - Administrator only. Updates a user's username, email,
 * and/or role. Password changes go through the reset-password endpoint,
 * not this one.
 */
async function updateUser(req, res) {
  try {
    const { id } = req.params;
    const { username, email, role } = req.body;

    if (role && !VALID_ROLES.includes(role)) {
      return res.status(400).json({ message: `role must be one of: ${VALID_ROLES.join(', ')}` });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent an admin from locking themselves out by demoting the last Administrator.
    if (role && role !== 'Administrator' && user.role === 'Administrator') {
      const adminCount = await User.count({ where: { role: 'Administrator' } });
      if (adminCount <= 1) {
        return res.status(409).json({ message: 'Cannot demote the last remaining Administrator' });
      }
    }

    await user.update({
      ...(username !== undefined ? { username } : {}),
      ...(email !== undefined ? { email } : {}),
      ...(role !== undefined ? { role } : {}),
    });

    return res.status(200).json({ user: sanitizeUser(user) });
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ message: 'A user with this email or username already exists' });
    }
    if (err.name === 'SequelizeValidationError') {
      return res.status(400).json({ message: err.errors?.[0]?.message || 'Invalid input' });
    }
    console.error('updateUser error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

/**
 * DELETE /users/:id - Administrator only.
 */
async function deleteUser(req, res) {
  try {
    const { id } = req.params;

    if (Number(id) === req.user.id) {
      return res.status(400).json({ message: 'You cannot delete your own account' });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role === 'Administrator') {
      const adminCount = await User.count({ where: { role: 'Administrator' } });
      if (adminCount <= 1) {
        return res.status(409).json({ message: 'Cannot delete the last remaining Administrator' });
      }
    }

    await user.destroy();
    return res.status(200).json({ message: 'User deleted' });
  } catch (err) {
    console.error('deleteUser error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

/**
 * PATCH /users/:id/reset-password - Administrator only.
 * Issues a new temporary password (returned once in the response so the
 * admin can relay it out-of-band). The user should change it on next login.
 */
async function resetPassword(req, res) {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const tempPassword = Math.random().toString(36).slice(-10) + 'Aa1!';

    // Plaintext in, hook hashes it on save via user.changed('password').
    await user.update({ password: tempPassword });

    return res.status(200).json({ message: 'Password reset', temporaryPassword: tempPassword });
  } catch (err) {
    console.error('resetPassword error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

module.exports = { listUsers, createUser, updateUser, deleteUser, resetPassword };