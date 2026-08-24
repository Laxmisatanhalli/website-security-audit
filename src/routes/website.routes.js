const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth.middleware');
const websiteController = require('../controllers/website.controller');

router.use(authMiddleware);

router.post('/', websiteController.addWebsite);
router.get('/', websiteController.listWebsites);

module.exports = router;
