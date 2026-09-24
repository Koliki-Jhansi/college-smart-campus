const express = require('express');
const router = express.Router();
const {
  createComplaint,
  getMyComplaints,
  getAllComplaints,
  getComplaintById,
  assignComplaint,
  updateTicketStatus,
  confirmClosure,
  addComplaintComment,
} = require('../controllers/complaintController');
const { protect, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.post('/', protect, upload.single('photo'), createComplaint);
router.get('/my', protect, getMyComplaints);
router.get('/', protect, authorize('admin', 'maintenance_staff'), getAllComplaints);
router.get('/:id', protect, getComplaintById);
router.put('/:id/assign', protect, authorize('admin', 'maintenance_staff'), assignComplaint);
router.put('/:id/status', protect, authorize('admin', 'maintenance_staff'), upload.single('resolutionProof'), updateTicketStatus);
router.put('/:id/confirm-closure', protect, confirmClosure);
router.post('/:id/comments', protect, upload.single('attachment'), addComplaintComment);

module.exports = router;
