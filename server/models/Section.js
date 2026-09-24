const mongoose = require('mongoose');

const sectionSchema = new mongoose.Schema({
  name: {
    type: String, // e.g. "A", "B", "C"
    required: true,
    trim: true,
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
  },
  departmentCode: String,
  semester: {
    type: Number,
    required: true,
  },
  maxStudents: {
    type: Number,
    default: 60,
  }
}, {
  timestamps: true,
});

module.exports = mongoose.model('Section', sectionSchema);
