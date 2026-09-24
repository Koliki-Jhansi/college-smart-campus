const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');

// @desc    Get All Conversations for logged-in user
// @route   GET /api/chat/conversations
// @access  Private
const getConversations = async (req, res, next) => {
  try {
    const conversations = await Conversation.find({ participants: req.user._id })
      .populate('participants', 'name email avatar role')
      .populate('lastMessageSender', 'name')
      .sort({ lastMessageAt: -1 });

    res.json({ success: true, count: conversations.length, conversations });
  } catch (err) {
    next(err);
  }
};

// @desc    Get or Create Direct Conversation
// @route   POST /api/chat/conversations/direct
// @access  Private
const getOrCreateDirectConversation = async (req, res, next) => {
  try {
    const { recipientId } = req.body;
    if (!recipientId) {
      return res.status(400).json({ success: false, message: 'Recipient ID is required.' });
    }

    let conversation = await Conversation.findOne({
      type: 'direct',
      participants: { $all: [req.user._id, recipientId], $size: 2 },
    }).populate('participants', 'name email avatar role');

    if (!conversation) {
      const recipient = await User.findById(recipientId);
      conversation = await Conversation.create({
        type: 'direct',
        participants: [req.user._id, recipientId],
        title: `${recipient ? recipient.name : 'Chat'}`,
      });
      conversation = await Conversation.findById(conversation._id).populate('participants', 'name email avatar role');
    }

    res.json({ success: true, conversation });
  } catch (err) {
    next(err);
  }
};

// @desc    Get Messages for a Conversation
// @route   GET /api/chat/conversations/:id/messages
// @access  Private
const getMessages = async (req, res, next) => {
  try {
    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found.' });
    }

    if (!conversation.participants.includes(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized for this conversation.' });
    }

    const messages = await Message.find({ conversation: conversation._id })
      .populate('sender', 'name avatar role')
      .sort({ createdAt: 1 });

    // Mark as read for this user
    await Message.updateMany(
      { conversation: conversation._id, readBy: { $ne: req.user._id } },
      { $addToSet: { readBy: req.user._id } }
    );

    res.json({ success: true, count: messages.length, messages });
  } catch (err) {
    next(err);
  }
};

// @desc    Send Message via REST API fallback
// @route   POST /api/chat/conversations/:id/messages
// @access  Private
const sendMessageREST = async (req, res, next) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ success: false, message: 'Message text is required.' });
    }

    let attachments = [];
    if (req.file) {
      attachments.push(`/uploads/${req.file.filename}`);
    }

    const message = await Message.create({
      conversation: req.params.id,
      sender: req.user._id,
      text: text.trim(),
      attachments,
      readBy: [req.user._id],
    });

    await Conversation.findByIdAndUpdate(req.params.id, {
      lastMessage: text.trim(),
      lastMessageSender: req.user._id,
      lastMessageAt: new Date(),
    });

    const populated = await Message.findById(message._id).populate('sender', 'name avatar role');

    res.status(201).json({ success: true, message: populated });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getConversations,
  getOrCreateDirectConversation,
  getMessages,
  sendMessageREST,
};
