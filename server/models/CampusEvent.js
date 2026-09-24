const mongoose = require('mongoose');

const campusEventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Event title is required'],
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'Event description is required'],
  },
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  club: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Club',
  },
  category: {
    type: String,
    enum: ['Hackathon', 'Workshop', 'Coding Contest', 'Technical Fest', 'Cultural Event', 'Sports', 'Seminar', 'Club Event', 'Competition'],
    default: 'Workshop',
    index: true,
  },
  venue: {
    type: String,
    required: [true, 'Venue is required'],
    trim: true,
  },
  startDate: {
    type: Date,
    required: true,
    index: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  registrationDeadline: {
    type: Date,
    required: true,
  },
  maxParticipants: {
    type: Number,
    default: 100,
    min: 1,
  },
  banner: {
    type: String,
    default: '',
  },
  contactInfo: {
    type: String,
    default: '',
  },
  eligibility: {
    type: String,
    default: 'Open to all students',
  },
  certificateIssued: {
    type: Boolean,
    default: false,
  },
  isPublished: {
    type: Boolean,
    default: true,
  }
}, {
  timestamps: true,
});

module.exports = mongoose.model('CampusEvent', campusEventSchema);
