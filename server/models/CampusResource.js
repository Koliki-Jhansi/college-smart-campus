const mongoose = require('mongoose');

const campusResourceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Resource name is required'],
    trim: true,
  },
  category: {
    type: String,
    enum: ['Computer Lab', 'AI Lab', 'Electronics Lab', 'Classroom', 'Seminar Hall', 'Auditorium', 'Conference Room', 'Projector', 'Camera', 'Robotics Kit', 'Sports Ground', 'Other'],
    required: true,
    index: true,
  },
  location: {
    type: String,
    required: [true, 'Location is required'],
    trim: true,
  },
  building: {
    type: String,
    default: '',
    trim: true,
  },
  block: {
    type: String,
    default: '',
    trim: true,
  },
  roomNumber: {
    type: String,
    default: '',
    trim: true,
  },
  description: {
    type: String,
    default: '',
  },
  capacity: {
    type: Number,
    default: 30,
  },
  image: {
    type: String,
    default: '',
  },
  approvalRequired: {
    type: Boolean,
    default: true,
  },
  bookingRules: {
    type: String,
    default: 'Bookings must be requested at least 2 hours in advance. Keep equipment clean and return on time.',
  },
  isActive: {
    type: Boolean,
    default: true,
  }
}, {
  timestamps: true,
});

module.exports = mongoose.model('CampusResource', campusResourceSchema);
