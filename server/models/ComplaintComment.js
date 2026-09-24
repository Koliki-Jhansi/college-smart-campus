const mongoose = require('mongoose');

const complaintCommentSchema = new mongoose.Schema({
  complaint: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Complaint',
    required: true,
    index: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  message: {
    type: String,
    required: true,
    trim: true,
  },
  attachment: {
    type: String,
    default: '',
  },
  isInternal: {
    type: Boolean,
    default: false, // Internal staff-only comments
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('ComplaintComment', complaintCommentSchema);
