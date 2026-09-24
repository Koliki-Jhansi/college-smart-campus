const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  action: {
    type: String,
    required: true,
  },
  module: {
    type: String,
    required: true,
  },
  targetId: String,
  details: {
    type: mongoose.Schema.Types.Mixed,
  },
  ipAddress: String,
}, {
  timestamps: true,
});

module.exports = mongoose.model('AuditLog', auditLogSchema);
