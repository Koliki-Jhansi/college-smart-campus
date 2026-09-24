const AuditLog = require('../models/AuditLog');

const logAuditAction = async (req, action, moduleName, targetId = null, details = {}) => {
  try {
    await AuditLog.create({
      user: req.user ? req.user._id : null,
      action,
      module: moduleName,
      targetId: targetId ? String(targetId) : null,
      details,
      ipAddress: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress,
    });
  } catch (err) {
    console.error('Failed to write audit log:', err.message);
  }
};

module.exports = {
  logAuditAction,
};
