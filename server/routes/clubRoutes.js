const express = require('express');
const router = express.Router();
const {
  getClubs,
  createClub,
  getClubById,
  requestClubJoin,
  handleClubMember,
  createClubAnnouncement,
} = require('../controllers/clubController');
const { protect, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.get('/', protect, getClubs);
router.post('/', protect, authorize('admin', 'club_coordinator'), upload.single('logo'), createClub);
router.get('/:id', protect, getClubById);
router.post('/:id/join', protect, requestClubJoin);
router.put('/members/:memberId', protect, handleClubMember);
router.post('/:id/announcements', protect, createClubAnnouncement);

module.exports = router;
