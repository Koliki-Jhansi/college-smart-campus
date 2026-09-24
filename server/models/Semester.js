const mongoose = require('mongoose');

const semesterSchema = new mongoose.Schema({
  number: {
    type: Number,
    required: true,
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
  },
  academicYear: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AcademicYear',
  },
  isActive: {
    type: Boolean,
    default: true,
  }
}, {
  timestamps: true,
});

semesterSchema.index({ course: 1, number: 1 }, { unique: true });

module.exports = mongoose.model('Semester', semesterSchema);
