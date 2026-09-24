const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
  ticketNumber: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  title: {
    type: String,
    required: [true, 'Complaint title is required'],
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
  },
  category: {
    type: String,
    enum: ['Wi-Fi', 'Electrical', 'Classroom', 'Lab Equipment', 'Water', 'Cleanliness', 'Hostel Maintenance', 'Transport', 'Infrastructure', 'Other'],
    required: true,
    index: true,
  },
  location: {
    type: String,
    required: [true, 'Location is required'],
    trim: true,
  },
  photo: {
    type: String,
    default: '',
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium',
    index: true,
  },
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  assignedDepartment: {
    type: String,
    default: 'Maintenance & Facilities',
  },
  assignedStaff: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true,
  },
  status: {
    type: String,
    enum: ['Open', 'Assigned', 'Accepted', 'In Progress', 'Waiting', 'Resolved', 'Reopened', 'Closed', 'Rejected'],
    default: 'Open',
    index: true,
  },
  slaHours: {
    type: Number,
    default: 12,
  },
  slaDeadline: {
    type: Date,
    required: true,
    index: true,
  },
  slaBreached: {
    type: Boolean,
    default: false,
    index: true,
  },
  slaEscalated: {
    type: Boolean,
    default: false,
  },
  resolutionProof: {
    type: String,
    default: '',
  },
  resolutionNotes: {
    type: String,
    default: '',
  },
  resolvedAt: Date,
  closedAt: Date,
  userRating: {
    type: Number,
    min: 1,
    max: 5,
  },
  userFeedback: {
    type: String,
    default: '',
  },
  statusHistory: [{
    status: String,
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    note: String,
    timestamp: { type: Date, default: Date.now },
  }],
}, {
  timestamps: true,
});

module.exports = mongoose.model('Complaint', complaintSchema);
