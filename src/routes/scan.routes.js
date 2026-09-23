const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/rbac.middleware');
const scanController = require('../controllers/scan.controller');

router.use(authMiddleware);

router.post('/', requireRole('Administrator', 'Security Analyst'), scanController.startScan);
router.get('/', scanController.listScans);
router.get('/compare', scanController.compareScans);
router.get('/:id', scanController.getScan);

module.exports = router;
