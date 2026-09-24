const mongoose = require('mongoose');

const resourceBookingSchema = new mongoose.Schema({
  resource: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CampusResource',
    required: true,
    index: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  bookingDate: {
    type: Date,
    required: true,
    index: true,
  },
  startTime: {
    type: String, // e.g. "14:00"
    required: true,
  },
  endTime: {
    type: String, // e.g. "16:00"
    required: true,
  },
  startDateTime: {
    type: Date,
    required: true,
    index: true,
  },
  endDateTime: {
    type: Date,
    required: true,
    index: true,
  },
  purpose: {
    type: String,
    required: true,
  },
  attendeeCount: {
    type: Number,
    default: 1,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'checked_in', 'completed', 'cancelled'],
    default: 'pending',
    index: true,
  },
  bookingReference: {
    type: String,
    unique: true,
    index: true,
  },
  qrCode: {
    type: String,
    default: '',
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  rejectionReason: String,
  checkInTime: Date,
  remarks: String,
}, {
  timestamps: true,
});

resourceBookingSchema.index({ resource: 1, startDateTime: 1, endDateTime: 1, status: 1 });

module.exports = mongoose.model('ResourceBooking', resourceBookingSchema);
