const BusRoute = require('../models/BusRoute');
const Bus = require('../models/Bus');
const TransportIssue = require('../models/TransportIssue');

// @desc    Get all active bus routes with stops & schedules
// @route   GET /api/transport/routes
// @access  Private
const getRoutes = async (req, res, next) => {
  try {
    const { searchStop } = req.query;
    let query = { isActive: true };

    if (searchStop) {
      query['stops.stopName'] = { $regex: new RegExp(searchStop, 'i') };
    }

    const routes = await BusRoute.find(query).populate('assignedBus');
    res.json({ success: true, count: routes.length, routes });
  } catch (err) {
    next(err);
  }
};

// @desc    Get All Buses
// @route   GET /api/transport/buses
// @access  Private
const getBuses = async (req, res, next) => {
  try {
    const buses = await Bus.find().populate('currentRoute', 'routeName routeNumber');
    res.json({ success: true, count: buses.length, buses });
  } catch (err) {
    next(err);
  }
};

// @desc    Create / Update Bus Route (Transport Staff / Admin)
// @route   POST /api/transport/routes
// @access  Private (Transport Staff / Admin)
const createRoute = async (req, res, next) => {
  try {
    const { routeName, routeNumber, startLocation, destination, stops, assignedBus, announcement } = req.body;

    if (!routeName || !routeNumber || !startLocation) {
      return res.status(400).json({ success: false, message: 'Route Name, Number, and Starting point are required.' });
    }

    const route = await BusRoute.create({
      routeName: routeName.trim(),
      routeNumber: routeNumber.trim().toUpperCase(),
      startLocation: startLocation.trim(),
      destination: destination || 'Main Campus',
      stops: stops || [],
      assignedBus: assignedBus || null,
      announcement: announcement || '',
    });

    if (assignedBus) {
      await Bus.findByIdAndUpdate(assignedBus, { currentRoute: route._id });
    }

    res.status(201).json({ success: true, message: 'Bus route created.', route });
  } catch (err) {
    next(err);
  }
};

// @desc    Create Bus (Transport Staff / Admin)
// @route   POST /api/transport/buses
// @access  Private (Transport Staff / Admin)
const createBus = async (req, res, next) => {
  try {
    const { busNumber, vehicleNumber, driverName, driverPhone, capacity, status } = req.body;

    if (!busNumber || !vehicleNumber || !driverName || !driverPhone) {
      return res.status(400).json({ success: false, message: 'Bus Number, Vehicle Number, and Driver info are required.' });
    }

    const bus = await Bus.create({
      busNumber: busNumber.trim().toUpperCase(),
      vehicleNumber: vehicleNumber.trim().toUpperCase(),
      driverName: driverName.trim(),
      driverPhone: driverPhone.trim(),
      capacity: Number(capacity) || 50,
      status: status || 'Active',
    });

    res.status(201).json({ success: true, message: 'Bus created.', bus });
  } catch (err) {
    next(err);
  }
};

// @desc    Report Transport Issue
// @route   POST /api/transport/issues
// @access  Private
const reportTransportIssue = async (req, res, next) => {
  try {
    const { busNumber, routeName, title, description } = req.body;
    if (!title || !description) {
      return res.status(400).json({ success: false, message: 'Title and description are required.' });
    }

    const issue = await TransportIssue.create({
      reportedBy: req.user._id,
      busNumber: busNumber || '',
      routeName: routeName || '',
      title: title.trim(),
      description: description.trim(),
    });

    res.status(201).json({ success: true, message: 'Transport issue logged.', issue });
  } catch (err) {
    next(err);
  }
};

// @desc    Get Transport Issues
// @route   GET /api/transport/issues
// @access  Private
const getTransportIssues = async (req, res, next) => {
  try {
    const issues = await TransportIssue.find()
      .populate('reportedBy', 'name email phone')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: issues.length, issues });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getRoutes,
  getBuses,
  createRoute,
  createBus,
  reportTransportIssue,
  getTransportIssues,
};
