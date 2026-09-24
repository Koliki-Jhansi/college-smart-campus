const { DEFAULT_SLA_HOURS } = require('../config/constants');

const calculateSlaHours = (priority, customSettings = {}) => {
  const settings = { ...DEFAULT_SLA_HOURS, ...customSettings };
  return settings[priority] || settings['Medium'] || 12;
};

const calculateSlaDeadline = (priority, customSettings = {}) => {
  const hours = calculateSlaHours(priority, customSettings);
  const deadline = new Date(Date.now() + hours * 60 * 60 * 1000);
  return { slaHours: hours, slaDeadline: deadline };
};

module.exports = {
  calculateSlaHours,
  calculateSlaDeadline,
};
