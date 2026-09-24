const mongoose = require('mongoose');

const busSchema = new mongoose.Schema({
  busNumber: {
    type: String, // e.g. "BUS-04"
    required: true,
    unique: true,
    trim: true,
    uppercase: true,
  },
  vehicleNumber: {
    type: String, // e.g. "DL-01-AB-1234"
    required: true,
    trim: true,
  },
  driverName: {
    type: String,
    required: true,
  },
  driverPhone: {
    type: String,
    required: true,
  },
  capacity: {
    type: Number,
    default: 50,
  },
  status: {
    type: String,
    enum: ['Active', 'In Maintenance', 'Standby', 'Inactive'],
    default: 'Active',
  },
  currentRoute: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BusRoute',
  }
}, {
  timestamps: true,
});

module.exports = mongoose.model('Bus', busSchema);
