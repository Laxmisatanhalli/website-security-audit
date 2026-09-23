const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth.middleware');
const notificationsController = require('../controllers/notifications.controller');

router.use(authMiddleware);

router.get('/', notificationsController.listNotifications);
router.patch('/:id/read', notificationsController.markRead);
router.patch('/read-all', notificationsController.markAllRead);

module.exports = router;
