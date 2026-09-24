const express = require('express');
const router = express.Router();
const {
  getRoutes,
  getBuses,
  createRoute,
  createBus,
  reportTransportIssue,
  getTransportIssues,
} = require('../controllers/transportController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/routes', protect, getRoutes);
router.get('/buses', protect, getBuses);
router.post('/routes', protect, authorize('admin', 'transport_staff'), createRoute);
router.post('/buses', protect, authorize('admin', 'transport_staff'), createBus);
router.post('/issues', protect, reportTransportIssue);
router.get('/issues', protect, authorize('admin', 'transport_staff'), getTransportIssues);

module.exports = router;
