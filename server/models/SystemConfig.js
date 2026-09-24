const mongoose = require('mongoose');

const systemConfigSchema = new mongoose.Schema({
  collegeName: {
    type: String,
    default: '',
  },
  shortName: {
    type: String,
    default: '',
  },
  collegeCode: {
    type: String,
    default: '',
    uppercase: true,
    trim: true,
  },
  collegeLogo: {
    type: String,
    default: '',
  },
  address: {
    type: String,
    default: '',
  },
  city: {
    type: String,
    default: '',
  },
  state: {
    type: String,
    default: '',
  },
  website: {
    type: String,
    default: '',
  },
  contactEmail: {
    type: String,
    default: '',
  },
  phone: {
    type: String,
    default: '',
  },
  currentAcademicYear: {
    type: String,
    default: '2026-2027',
  },
  collegeSetupCompleted: {
    type: Boolean,
    default: false,
  },
  slaSettings: {
    Critical: { type: Number, default: 1 },
    High: { type: Number, default: 4 },
    Medium: { type: Number, default: 12 },
    Low: { type: Number, default: 48 },
  },
  allowPublicRegistration: {
    type: Boolean,
    default: true,
  },
  requireStaffApproval: {
    type: Boolean,
    default: false,
  }
}, {
  timestamps: true,
});

module.exports = mongoose.model('SystemConfig', systemConfigSchema);
