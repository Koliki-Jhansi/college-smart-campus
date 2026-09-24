const express = require('express');
const router = express.Router();
const {
  getSuggestions,
  createSuggestion,
  toggleUpvote,
  respondToSuggestion,
} = require('../controllers/voiceController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/', protect, getSuggestions);
router.get('/suggestions', protect, getSuggestions);
router.post('/', protect, createSuggestion);
router.post('/suggestions', protect, createSuggestion);
router.post('/:id/vote', protect, toggleUpvote);
router.put('/:id/respond', protect, authorize('admin'), respondToSuggestion);

module.exports = router;
