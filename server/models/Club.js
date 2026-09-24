const mongoose = require('mongoose');

const clubSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Club name is required'],
    unique: true,
    trim: true,
  },
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true,
  },
  logo: {
    type: String,
    default: '',
  },
  description: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    enum: ['Technical', 'Cultural', 'Sports', 'Literary', 'Social & Volunteering', 'Arts & Design', 'Entrepreneurship', 'Other'],
    default: 'Technical',
  },
  coordinator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  facultyAdvisor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  membersCount: {
    type: Number,
    default: 1,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  socialLinks: {
    instagram: String,
    linkedin: String,
    github: String,
    website: String,
  }
}, {
  timestamps: true,
});

module.exports = mongoose.model('Club', clubSchema);
