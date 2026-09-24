const mongoose = require('mongoose');

const facultyProfileSchema = new mongoose.Schema({
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
  department: {
    type: String,
    required: [true, 'Department is required'],
    index: true,
  },
  designation: {
    type: String,
    required: [true, 'Designation is required'],
    trim: true,
  },
  cabinLocation: {
    type: String,
    default: '',
  },
  officeHours: {
    type: String,
    default: '10:00 AM - 4:00 PM',
  },
  researchInterests: [{
    type: String,
    trim: true,
  }],
  bio: {
    type: String,
    default: '',
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('FacultyProfile', facultyProfileSchema);
