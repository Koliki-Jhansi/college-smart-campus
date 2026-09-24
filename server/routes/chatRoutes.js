const express = require('express');
const router = express.Router();
const {
  getConversations,
  getOrCreateDirectConversation,
  getMessages,
  sendMessageREST,
} = require('../controllers/chatController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.get('/conversations', protect, getConversations);
router.post('/conversations/direct', protect, getOrCreateDirectConversation);
router.get('/conversations/:id/messages', protect, getMessages);
router.post('/conversations/:id/messages', protect, upload.single('attachment'), sendMessageREST);

module.exports = router;
