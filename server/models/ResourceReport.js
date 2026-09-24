const mongoose = require('mongoose');

const resourceReportSchema = new mongoose.Schema({
  reporter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  resource: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StudyResource',
    required: true,
  },
  reason: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'resolved', 'dismissed'],
    default: 'pending',
  }
}, {
  timestamps: true,
});

module.exports = mongoose.model('ResourceReport', resourceReportSchema);
