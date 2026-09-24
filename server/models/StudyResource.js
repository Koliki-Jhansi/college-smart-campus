const mongoose = require('mongoose');

const studyResourceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Resource title is required'],
    trim: true,
  },
  description: {
    type: String,
    default: '',
  },
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true,
  },
  department: {
    type: String,
    required: true,
    index: true,
  },
  semester: {
    type: Number,
    required: true,
    index: true,
  },
  type: {
    type: String,
    enum: ['Notes', 'PDF', 'Presentation', 'Useful Link', 'Tutorial', 'Question Paper', 'Reference Material'],
    default: 'Notes',
    index: true,
  },
  fileUrl: {
    type: String,
    default: '',
  },
  externalUrl: {
    type: String,
    default: '',
  },
  fileSize: {
    type: Number,
    default: 0,
  },
  mimeType: {
    type: String,
    default: '',
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  downloadCount: {
    type: Number,
    default: 0,
  },
  bookmarksCount: {
    type: Number,
    default: 0,
  },
  tags: [String],
  isReported: {
    type: Boolean,
    default: false,
  }
}, {
  timestamps: true,
});

studyResourceSchema.index({ title: 'text', description: 'text', subject: 'text' });

module.exports = mongoose.model('StudyResource', studyResourceSchema);
