const express = require('express');
const router = express.Router();
const {
  getUserProfile,
  updateStudentProfile,
  updateFacultyProfile,
  uploadAvatar,
  searchStudents,
  sendConnectionRequest,
  handleConnectionResponse,
  getMyConnections,
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.get('/profile/:id', protect, getUserProfile);
router.put('/student-profile', protect, updateStudentProfile);
router.put('/faculty-profile', protect, updateFacultyProfile);
router.post('/avatar', protect, upload.single('avatar'), uploadAvatar);

// CampusConnect
router.get('/students', protect, searchStudents);
router.post('/connect/:recipientId', protect, sendConnectionRequest);
router.put('/connect/:connectionId', protect, handleConnectionResponse);
router.get('/connections', protect, getMyConnections);

module.exports = router;
