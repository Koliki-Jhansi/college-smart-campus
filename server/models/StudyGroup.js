const mongoose = require('mongoose');

const studyGroupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Group name is required'],
    trim: true,
  },
  subject: {
    type: String,
    required: [true, 'Subject/Topic is required'],
    trim: true,
  },
  description: {
    type: String,
    default: '',
  },
  department: {
    type: String,
    default: 'All',
  },
  semester: {
    type: Number,
    default: 1,
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  facultyAdvisor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  maxMembers: {
    type: Number,
    default: 10,
    min: 2,
    max: 50,
  },
  isPrivate: {
    type: Boolean,
    default: false,
  },
  scheduleInfo: {
    type: String,
    default: '',
  },
  meetingLink: {
    type: String,
    default: '',
  },
  resources: [{
    title: String,
    url: String,
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    addedAt: { type: Date, default: Date.now },
  }],
}, {
  timestamps: true,
});

module.exports = mongoose.model('StudyGroup', studyGroupSchema);
