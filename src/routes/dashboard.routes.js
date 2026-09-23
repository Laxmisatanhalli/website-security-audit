const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth.middleware');
const dashboardController = require('../controllers/dashboard.controller');

router.use(authMiddleware);

router.get('/overview', dashboardController.getOverview);
router.get('/upcoming-scans', dashboardController.getUpcomingScans);
router.get('/charts/risk-distribution', dashboardController.getRiskDistribution);
router.get('/charts/vulnerability-categories', dashboardController.getVulnerabilityCategories);
router.get('/charts/score-trend', dashboardController.getScoreTrend);
router.get('/charts/ssl-expiry-timeline', dashboardController.getSslExpiryTimeline);
router.get('/charts/monthly-scan-summary', dashboardController.getMonthlyScanSummary);

module.exports = router;
