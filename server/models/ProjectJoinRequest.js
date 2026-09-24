const mongoose = require('mongoose');

const projectJoinRequestSchema = new mongoose.Schema({
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
    index: true,
  },
  applicant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  message: {
    type: String,
    default: '',
  },
  skills: [String],
  roleOffered: {
    type: String,
    default: 'Developer',
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending',
    index: true,
  },
}, {
  timestamps: true,
});

projectJoinRequestSchema.index({ project: 1, applicant: 1 }, { unique: true });

module.exports = mongoose.model('ProjectJoinRequest', projectJoinRequestSchema);
