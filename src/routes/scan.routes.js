const express = require('express');
const router = express.Router();

const scanController = require('../controllers/scan.controller');
const { authMiddleware } = require('../middleware/auth.middleware');

router.use(authMiddleware);

router.post('/', authMiddleware, scanController.startScan);
router.get('/:id', scanController.getScan);
router.get('/', scanController.listScans)
module.exports = router;