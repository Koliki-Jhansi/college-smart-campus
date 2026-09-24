const mongoose = require('mongoose');

const eventRegistrationSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CampusEvent',
    required: true,
    index: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  registrationDate: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ['registered', 'attended', 'cancelled', 'waitlist'],
    default: 'registered',
    index: true,
  },
  ticketCode: {
    type: String,
    unique: true,
    index: true,
  },
  qrCode: {
    type: String,
    default: '',
  },
  checkInTime: Date,
  certificateGenerated: {
    type: Boolean,
    default: false,
  },
  certificateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Certificate',
  },
  feedbackRating: {
    type: Number,
    min: 1,
    max: 5,
  },
  feedbackComments: String,
}, {
  timestamps: true,
});

eventRegistrationSchema.index({ event: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('EventRegistration', eventRegistrationSchema);
