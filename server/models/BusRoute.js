const mongoose = require('mongoose');

const busRouteSchema = new mongoose.Schema({
  routeName: {
    type: String, // e.g., "North Campus Express"
    required: true,
    trim: true,
  },
  routeNumber: {
    type: String, // e.g., "R-101"
    required: true,
    unique: true,
    uppercase: true,
  },
  startLocation: {
    type: String,
    required: true,
  },
  destination: {
    type: String,
    required: true,
    default: 'Main Campus',
  },
  stops: [{
    stopName: { type: String, required: true },
    timeMorning: { type: String, required: true }, // e.g. "07:30 AM"
    timeEvening: { type: String, required: true }, // e.g. "05:15 PM"
    sequence: { type: Number, default: 1 },
  }],
  assignedBus: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bus',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  announcement: String,
}, {
  timestamps: true,
});

module.exports = mongoose.model('BusRoute', busRouteSchema);
