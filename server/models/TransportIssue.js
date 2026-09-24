const mongoose = require('mongoose');

const transportIssueSchema = new mongoose.Schema({
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  busNumber: {
    type: String,
    default: '',
  },
  routeName: {
    type: String,
    default: '',
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['Reported', 'Under Review', 'Resolved'],
    default: 'Reported',
  },
  response: String,
  resolvedAt: Date,
}, {
  timestamps: true,
});

module.exports = mongoose.model('TransportIssue', transportIssueSchema);
