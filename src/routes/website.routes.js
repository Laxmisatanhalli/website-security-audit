const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/rbac.middleware');
const websiteController = require('../controllers/website.controller');

router.use(authMiddleware);

// Administrators and Security Analysts can add/edit/delete websites.
// Viewers can only list/read.
router.post('/', requireRole('Administrator', 'Security Analyst'), websiteController.addWebsite);
router.get('/', websiteController.listWebsites);
router.get('/:id', websiteController.getWebsite);
router.put('/:id', requireRole('Administrator', 'Security Analyst'), websiteController.updateWebsite);
router.delete('/:id', requireRole('Administrator'), websiteController.deleteWebsite);
router.patch('/:id/status', requireRole('Administrator', 'Security Analyst'), websiteController.setWebsiteStatus);

module.exports = router;
