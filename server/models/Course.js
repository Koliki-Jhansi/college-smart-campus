const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Course name is required'],
    trim: true,
  },
  code: {
    type: String,
    required: [true, 'Course code is required'],
    trim: true,
    uppercase: true,
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: true,
  },
  departmentCode: {
    type: String,
    trim: true,
    uppercase: true,
  },
  degreeType: {
    type: String,
    enum: ['B.Tech', 'M.Tech', 'B.Sc', 'M.Sc', 'BCA', 'MCA', 'BBA', 'MBA', 'Diploma', 'Ph.D', 'Other'],
    default: 'B.Tech',
  },
  duration: {
    type: String,
    default: '4 Years',
  },
  totalSemesters: {
    type: Number,
    default: 8,
  },
  description: {
    type: String,
    default: '',
  },
  isActive: {
    type: Boolean,
    default: true,
  }
}, {
  timestamps: true,
});

module.exports = mongoose.model('Course', courseSchema);
