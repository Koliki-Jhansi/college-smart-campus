const express = require('express');
const router = express.Router();
const {
  getCampusResources,
  createCampusResource,
  checkAvailability,
  requestBooking,
  getMyBookings,
  getAllBookings,
  updateBookingStatus,
  checkInBooking,
  cancelBooking,
} = require('../controllers/slotController');
const { protect, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.get('/resources', protect, getCampusResources);
router.post('/resources', protect, authorize('admin'), upload.single('image'), createCampusResource);
router.get('/availability/:resourceId', protect, checkAvailability);
router.post('/', protect, requestBooking);
router.post('/bookings', protect, requestBooking);
router.get('/my', protect, getMyBookings);
router.get('/bookings/my', protect, getMyBookings);
router.get('/', protect, authorize('admin', 'faculty', 'maintenance_staff'), getAllBookings);
router.get('/bookings', protect, authorize('admin', 'faculty', 'maintenance_staff'), getAllBookings);
router.put('/:id/status', protect, authorize('admin', 'faculty'), updateBookingStatus);
router.post('/check-in', protect, checkInBooking);
router.put('/:id/cancel', protect, cancelBooking);

module.exports = router;
