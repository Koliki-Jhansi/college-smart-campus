const mongoose = require('mongoose');

const skillRequestSchema = new mongoose.Schema({
  requester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  mentor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  skillOffered: {
    type: String,
    trim: true,
  },
  skillWanted: {
    type: String,
    required: true,
    trim: true,
  },
  message: {
    type: String,
    default: '',
  },
  proposedDate: Date,
  status: {
    type: String,
    enum: ['requested', 'accepted', 'scheduled', 'completed', 'rejected', 'cancelled'],
    default: 'requested',
    index: true,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('SkillRequest', skillRequestSchema);
