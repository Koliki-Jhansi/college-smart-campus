const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['direct', 'project', 'study_group', 'skill_swap'],
    default: 'direct',
    index: true,
  },
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  }],
  referenceId: {
    type: mongoose.Schema.Types.ObjectId, // Project ID, StudyGroup ID, SkillSession ID
    index: true,
  },
  title: {
    type: String,
    default: '',
  },
  lastMessage: {
    type: String,
    default: '',
  },
  lastMessageSender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  lastMessageAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

conversationSchema.index({ participants: 1 });

module.exports = mongoose.model('Conversation', conversationSchema);
