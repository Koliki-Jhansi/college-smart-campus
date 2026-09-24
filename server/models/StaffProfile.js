const mongoose = require('mongoose');

const staffProfileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true,
  },
  employeeId: {
    type: String,
    required: [true, 'Employee ID is required'],
    unique: true,
    trim: true,
    uppercase: true,
    index: true,
  },
  staffType: {
    type: String,
    enum: ['maintenance', 'transport', 'general'],
    required: true,
    index: true,
  },
  assignedDepartment: {
    type: String,
    default: 'Campus Operations',
  },
  skills: [String],
  resolvedTicketsCount: {
    type: Number,
    default: 0,
  },
  averageRating: {
    type: Number,
    default: 5.0,
  }
}, {
  timestamps: true,
});

module.exports = mongoose.model('StaffProfile', staffProfileSchema);
