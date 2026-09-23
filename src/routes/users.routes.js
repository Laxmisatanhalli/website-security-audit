// src/routes/users.routes.js
const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/rbac.middleware'); // adjust to match your export
const usersController = require('../controllers/users.controller');

router.use(authMiddleware);
router.use(requireRole('admin')); // user management should be admin-only

router.get('/', usersController.listUsers);
router.post('/', usersController.createUser);
router.put('/:id', usersController.updateUser);
router.delete('/:id', usersController.deleteUser);
router.post('/:id/reset-password', usersController.resetPassword);

module.exports = router;