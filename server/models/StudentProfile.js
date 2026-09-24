const mongoose = require('mongoose');

const studentProfileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true,
  },
  collegeId: {
    type: String,
    required: [true, 'College ID / Roll Number is required'],
    unique: true,
    trim: true,
    uppercase: true,
    index: true,
  },
  department: {
    type: String,
    required: [true, 'Department is required'],
    index: true,
  },
  course: {
    type: String,
    required: [true, 'Course is required'],
  },
  year: {
    type: Number,
    required: [true, 'Year of study is required'],
    min: 1,
    max: 6,
    index: true,
  },
  semester: {
    type: Number,
    required: [true, 'Semester is required'],
    min: 1,
    max: 12,
  },
  section: {
    type: String,
    default: 'A',
    trim: true,
  },
  bio: {
    type: String,
    default: '',
    maxlength: 1000,
  },
  skills: [{
    type: String,
    trim: true,
  }],
  skillsWanted: [{
    type: String,
    trim: true,
  }],
  interests: [{
    type: String,
    trim: true,
  }],
  github: {
    type: String,
    default: '',
    trim: true,
  },
  linkedin: {
    type: String,
    default: '',
    trim: true,
  },
  portfolio: {
    type: String,
    default: '',
    trim: true,
  },
  achievements: [{
    title: String,
    description: String,
    date: { type: Date, default: Date.now },
    category: String,
    verified: { type: Boolean, default: true },
  }],
  rating: {
    type: Number,
    default: 5.0,
  },
  ratingsCount: {
    type: Number,
    default: 0,
  },
  sessionsHelpedCount: {
    type: Number,
    default: 0,
  },
  isPublic: {
    type: Boolean,
    default: true,
  }
}, {
  timestamps: true,
});

studentProfileSchema.index({ skills: 1 });
studentProfileSchema.index({ skillsWanted: 1 });
studentProfileSchema.index({ department: 1, year: 1 });

module.exports = mongoose.model('StudentProfile', studentProfileSchema);
