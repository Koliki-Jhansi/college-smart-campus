const mongoose = require('mongoose');

const suggestionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Suggestion title is required'],
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
  },
  category: {
    type: String,
    enum: ['Academic', 'Campus Facilities', 'Hostel & Food', 'Library', 'Extracurricular', 'Transport', 'Other'],
    default: 'Campus Facilities',
    index: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  isAnonymous: {
    type: Boolean,
    default: false,
  },
  status: {
    type: String,
    enum: ['Submitted', 'Under Review', 'Planned', 'Implemented', 'Rejected'],
    default: 'Submitted',
    index: true,
  },
  upvotes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  upvotesCount: {
    type: Number,
    default: 0,
    index: true,
  },
  adminResponse: {
    type: String,
    default: '',
  },
  respondedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  respondedAt: Date,
}, {
  timestamps: true,
});

module.exports = mongoose.model('Suggestion', suggestionSchema);
