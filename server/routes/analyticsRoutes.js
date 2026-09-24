const express = require('express');
const router = express.Router();
const {
  getDashboardData,
  exportDataCSV,
} = require('../controllers/analyticsController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/dashboard', protect, getDashboardData);
router.get('/export/:type', protect, authorize('admin'), exportDataCSV);

module.exports = router;
