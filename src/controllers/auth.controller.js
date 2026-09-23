const { User } = require('../models');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { Op } = require('sequelize');
 
const JWT_EXPIRES_IN = '1h';
 
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 60 * 60 * 1000, 
};
 
function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}
 
function isValidEmail(value) {
  return typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}
 
function signToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN, algorithm: 'HS256' }
  );
}
 
function toPublicUser(user) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
  };
}
 
async function registerUser(req, res) {
  try {
    const { username, email, password } = req.body;
 
    const role = 'Viewer';
 
    if (!isNonEmptyString(username) || username.length < 3 || username.length > 50) {
      return res.status(400).json({ message: 'Username must be 3-50 characters' });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ message: 'Invalid email' });
    }
    if (!isNonEmptyString(password) || password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }
 
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ email }, { username }],
      },
    });
 
    if (existingUser) {
      return res.status(409).json({ message: 'User already exists' });
    }
 
    const user = await User.create({
      username,
      email,
      password,
      role,
    });
 
    const token = signToken(user);
    res.cookie('token', token, COOKIE_OPTIONS);
 
    return res.status(201).json({
      message: 'User registered successfully',
      user: toPublicUser(user),
    });
  } catch (err) {
    
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ message: 'User already exists' });
    }
    if (err.name === 'SequelizeValidationError') {
      return res.status(400).json({ message: 'Invalid input' });
    }
    console.error('registerUser error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
 
async function loginUser(req, res) {
  try {
    const { username, email, password } = req.body;
 
    if (!isNonEmptyString(password)) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    if (!isNonEmptyString(username) && !isValidEmail(email)) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
 
    const user = await User.scope('withPassword').findOne({
      where: {
        [Op.or]: [
          email ? { email } : null,
          username ? { username } : null,
        ].filter(Boolean),
      },
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
 
    const isPasswordValid = await bcrypt.compare(password, user.password);
 
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
 
    const token = signToken(user);
    res.cookie('token', token, COOKIE_OPTIONS);
 
    return res.status(200).json({
      message: 'Login successful',
      user: toPublicUser(user),
    });
  } catch (err) {
    console.error('loginUser error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
 
async function logoutUser(req, res) {
  res.clearCookie('token', COOKIE_OPTIONS);
  return res.status(200).json({ message: 'Logged out successfully' });
}

/**
 * GET /auth/me - returns the current session's user, derived from the
 * verified JWT (req.user is populated by authMiddleware). Added so the
 * frontend can confirm/restore a session on page load instead of trusting
 * a value cached in localStorage — see frontend/src/context/AuthContext.jsx.
 */
async function getCurrentUser(req, res) {
  return res.status(200).json({ user: toPublicUser(req.user) });
}
 
module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  getCurrentUser,
};