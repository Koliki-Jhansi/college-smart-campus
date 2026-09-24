const express = require('express');
const router = express.Router();
const {
  getStudyGroups,
  getMyStudyGroups,
  createStudyGroup,
  joinStudyGroup,
  leaveStudyGroup,
  addGroupResource,
} = require('../controllers/studyGroupController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getStudyGroups);
router.get('/my', protect, getMyStudyGroups);
router.post('/', protect, createStudyGroup);
router.post('/:id/join', protect, joinStudyGroup);
router.post('/:id/leave', protect, leaveStudyGroup);
router.post('/:id/resources', protect, addGroupResource);

module.exports = router;
