const express = require('express');
const router = express.Router();
const {
  getSkillMatches,
  searchSkills,
  sendSkillRequest,
  getMySkillRequests,
  scheduleSession,
  completeSession,
  getMySessions,
} = require('../controllers/skillSwapController');
const { protect } = require('../middleware/authMiddleware');

router.get('/matches', protect, getSkillMatches);
router.get('/search', protect, searchSkills);
router.post('/requests', protect, sendSkillRequest);
router.get('/requests', protect, getMySkillRequests);
router.post('/sessions', protect, scheduleSession);
router.put('/sessions/:id/complete', protect, completeSession);
router.get('/my-sessions', protect, getMySessions);

module.exports = router;
