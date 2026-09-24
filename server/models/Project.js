const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Project title is required'],
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
  },
  problemStatement: {
    type: String,
    default: '',
  },
  category: {
    type: String,
    default: 'Web Development',
  },
  technologies: [{
    type: String,
    trim: true,
  }],
  requiredSkills: [{
    type: String,
    trim: true,
  }],
  maxTeamSize: {
    type: Number,
    default: 4,
    min: 1,
    max: 20,
  },
  status: {
    type: String,
    enum: ['Idea', 'Recruiting', 'In Development', 'Testing', 'Completed', 'Archived'],
    default: 'Recruiting',
    index: true,
  },
  githubRepo: {
    type: String,
    default: '',
    trim: true,
  },
  liveDemo: {
    type: String,
    default: '',
    trim: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  mentor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    role: {
      type: String,
      default: 'Developer',
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    }
  }],
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  milestones: [{
    title: String,
    dueDate: Date,
    completed: { type: Boolean, default: false },
    completedAt: Date,
  }],
  links: [{
    title: String,
    url: String,
  }],
  activityLog: [{
    action: String,
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    timestamp: { type: Date, default: Date.now },
  }]
}, {
  timestamps: true,
});

projectSchema.index({ technologies: 1 });
projectSchema.index({ requiredSkills: 1 });
projectSchema.index({ 'members.user': 1 });

module.exports = mongoose.model('Project', projectSchema);
