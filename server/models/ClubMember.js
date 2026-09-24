const mongoose = require('mongoose');

const clubMemberSchema = new mongoose.Schema({
  club: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Club',
    required: true,
    index: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  role: {
    type: String,
    enum: ['member', 'core_member', 'lead'],
    default: 'member',
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'rejected', 'left'],
    default: 'pending',
    index: true,
  },
  joinMessage: String,
  joinedAt: {
    type: Date,
    default: Date.now,
  }
}, {
  timestamps: true,
});

clubMemberSchema.index({ club: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('ClubMember', clubMemberSchema);
