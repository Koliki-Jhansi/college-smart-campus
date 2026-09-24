const mongoose = require('mongoose');

const skillSessionSchema = new mongoose.Schema({
  skillRequest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SkillRequest',
  },
  mentor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  learner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  skill: {
    type: String,
    required: true,
  },
  scheduledAt: {
    type: Date,
    required: true,
  },
  durationMinutes: {
    type: Number,
    default: 60,
  },
  meetingLink: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    enum: ['scheduled', 'completed', 'cancelled'],
    default: 'scheduled',
    index: true,
  },
  mentorNotes: {
    type: String,
    default: '',
  },
  learnerRating: {
    type: Number,
    min: 1,
    max: 5,
  },
  learnerReview: {
    type: String,
    default: '',
  },
  mentorRating: {
    type: Number,
    min: 1,
    max: 5,
  },
  mentorReview: {
    type: String,
    default: '',
  },
  completedAt: Date,
}, {
  timestamps: true,
});

module.exports = mongoose.model('SkillSession', skillSessionSchema);
