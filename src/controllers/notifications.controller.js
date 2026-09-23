const { Notification } = require('../models');

async function listNotifications(req, res) {
  try {
    const { unreadOnly } = req.query;
    const where = { UserId: req.user.id };
    if (unreadOnly === 'true') where.isRead = false;

    const notifications = await Notification.findAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: 100,
    });

    const unreadCount = await Notification.count({ where: { UserId: req.user.id, isRead: false } });

    return res.status(200).json({ notifications, unreadCount });
  } catch (err) {
    console.error('listNotifications error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

async function markRead(req, res) {
  try {
    const notification = await Notification.findOne({
      where: { id: req.params.id, UserId: req.user.id },
    });
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    await notification.update({ isRead: true });
    return res.status(200).json({ notification });
  } catch (err) {
    console.error('markRead error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

async function markAllRead(req, res) {
  try {
    await Notification.update(
      { isRead: true },
      { where: { UserId: req.user.id, isRead: false } }
    );
    return res.status(200).json({ message: 'All notifications marked as read' });
  } catch (err) {
    console.error('markAllRead error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

module.exports = { listNotifications, markRead, markAllRead };
