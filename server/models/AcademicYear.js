const mongoose = require('mongoose');

const academicYearSchema = new mongoose.Schema({
  year: {
    type: String, // e.g., "2025-2026"
    required: true,
    unique: true,
  },
  label: {
    type: String,
    default: '',
  },
  isCurrent: {
    type: Boolean,
    default: false,
  }
}, {
  timestamps: true,
});

module.exports = mongoose.model('AcademicYear', academicYearSchema);
