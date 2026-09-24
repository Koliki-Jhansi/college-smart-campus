const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema({
  certificateNumber: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CampusEvent',
    required: true,
  },
  recipientName: {
    type: String,
    required: true,
  },
  rollNumber: {
    type: String,
    default: '',
  },
  eventTitle: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    default: 'Participation',
  },
  issueDate: {
    type: Date,
    default: Date.now,
  },
  qrVerificationUrl: String,
  signatory: {
    name: { type: String, default: 'Dean of Student Affairs' },
    designation: { type: String, default: 'Head of Campus Affairs' }
  }
}, {
  timestamps: true,
});

module.exports = mongoose.model('Certificate', certificateSchema);
