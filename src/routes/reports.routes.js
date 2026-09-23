const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth.middleware');
const reportsController = require('../controllers/reports.controller');

router.use(authMiddleware);

router.get('/trend/:websiteId', reportsController.generateTrendReport);
router.get('/:scanId', reportsController.generateScanReport);

module.exports = router;
