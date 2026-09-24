const express = require('express');
const router = express.Router();
const {
  getEvents,
  getMyRegistrations,
  getEventById,
  createEvent,
  registerForEvent,
  checkInAttendee,
  downloadCertificatePDF,
  getMyCertificates,
} = require('../controllers/eventController');
const { protect, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.get('/', protect, getEvents);
router.get('/my', protect, getMyRegistrations);
router.get('/my-certificates', protect, getMyCertificates);
router.get('/:id', protect, getEventById);
router.post('/', protect, authorize('admin', 'club_coordinator', 'faculty'), upload.single('banner'), createEvent);
router.post('/:id/register', protect, registerForEvent);
router.post('/check-in', protect, checkInAttendee);
router.get('/certificates/:certificateId/pdf', protect, downloadCertificatePDF);

module.exports = router;
