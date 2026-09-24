const CampusResource = require('../models/CampusResource');
const ResourceBooking = require('../models/ResourceBooking');
const { generateQRCodeDataURL } = require('../utils/qrHelper');
const { sendNotificationToUser } = require('../sockets/socketHandler');
const { logAuditAction } = require('../middleware/auditMiddleware');

// @desc    Get all campus bookable resources
// @route   GET /api/bookings/resources
// @access  Private
const getCampusResources = async (req, res, next) => {
  try {
    const { category, search } = req.query;
    const query = { isActive: true };

    if (category && category !== 'All') {
      query.category = category;
    }
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [{ name: searchRegex }, { location: searchRegex }, { description: searchRegex }];
    }

    const resources = await CampusResource.find(query).sort({ category: 1, name: 1 });
    res.json({ success: true, count: resources.length, resources });
  } catch (err) {
    next(err);
  }
};

// @desc    Create Campus Resource (Admin)
// @route   POST /api/bookings/resources
// @access  Private (Admin)
const createCampusResource = async (req, res, next) => {
  try {
    const { name, category, location, description, capacity, approvalRequired, bookingRules } = req.body;
    if (!name || !category || !location) {
      return res.status(400).json({ success: false, message: 'Resource name, category, and location are required.' });
    }

    let image = '';
    if (req.file) {
      image = `/uploads/${req.file.filename}`;
    }

    const resource = await CampusResource.create({
      name: name.trim(),
      category,
      location: location.trim(),
      description: description || '',
      capacity: Number(capacity) || 30,
      approvalRequired: approvalRequired !== undefined ? Boolean(approvalRequired) : true,
      bookingRules: bookingRules || '',
      image,
    });

    await logAuditAction(req, 'CREATE_CAMPUS_RESOURCE', 'CampusSlot', resource._id, { name: resource.name });
    res.status(201).json({ success: true, message: 'Campus resource created.', resource });
  } catch (err) {
    next(err);
  }
};

// @desc    Check Resource Availability for a Date
// @route   GET /api/bookings/availability/:resourceId
// @access  Private
const checkAvailability = async (req, res, next) => {
  try {
    const { date } = req.query;
    if (!date) {
      return res.status(400).json({ success: false, message: 'Date parameter (YYYY-MM-DD) is required.' });
    }

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const bookings = await ResourceBooking.find({
      resource: req.params.resourceId,
      bookingDate: { $gte: startOfDay, $lte: endOfDay },
      status: { $in: ['approved', 'pending', 'checked_in'] },
    }).select('startTime endTime startDateTime endDateTime status purpose user')
      .populate('user', 'name');

    res.json({
      success: true,
      date,
      existingBookings: bookings,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Request Resource Booking (with robust backend conflict prevention)
// @route   POST /api/bookings
// @access  Private
const requestBooking = async (req, res, next) => {
  try {
    const { resourceId, bookingDate, startTime, endTime, purpose, attendeeCount } = req.body;

    if (!resourceId || !bookingDate || !startTime || !endTime || !purpose) {
      return res.status(400).json({ success: false, message: 'All booking fields are required.' });
    }

    const resource = await CampusResource.findById(resourceId);
    if (!resource || !resource.isActive) {
      return res.status(404).json({ success: false, message: 'Campus resource not found or inactive.' });
    }

    // Parse start and end Date objects
    // Expected format: bookingDate="2026-09-25", startTime="14:00", endTime="16:00"
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);

    const startDateTime = new Date(bookingDate);
    startDateTime.setHours(startH, startM, 0, 0);

    const endDateTime = new Date(bookingDate);
    endDateTime.setHours(endH, endM, 0, 0);

    if (endDateTime <= startDateTime) {
      return res.status(400).json({ success: false, message: 'End time must be strictly after start time.' });
    }

    if (startDateTime < new Date()) {
      return res.status(400).json({ success: false, message: 'Cannot book a past time slot.' });
    }

    // BACKEND OVERLAP CHECK:
    // Existing booking overlaps if (existing.start < new.end) AND (existing.end > new.start)
    const overlappingBooking = await ResourceBooking.findOne({
      resource: resourceId,
      status: { $in: ['approved', 'checked_in'] },
      $and: [
        { startDateTime: { $lt: endDateTime } },
        { endDateTime: { $gt: startDateTime } }
      ]
    });

    if (overlappingBooking) {
      return res.status(400).json({
        success: false,
        message: `That time slot is already booked and approved (${overlappingBooking.startTime} - ${overlappingBooking.endTime}). Please pick a different slot.`,
      });
    }

    // Auto-approve if no approval required, else pending
    const initialStatus = resource.approvalRequired ? 'pending' : 'approved';
    const bookingRef = `BK-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;

    let qrCode = '';
    if (initialStatus === 'approved') {
      qrCode = await generateQRCodeDataURL(`COLLEGEHUB:BOOKING:${bookingRef}:${resource._id}:${req.user._id}`);
    }

    const booking = await ResourceBooking.create({
      resource: resourceId,
      user: req.user._id,
      bookingDate: new Date(bookingDate),
      startTime,
      endTime,
      startDateTime,
      endDateTime,
      purpose,
      attendeeCount: Number(attendeeCount) || 1,
      status: initialStatus,
      bookingReference: bookingRef,
      qrCode,
    });

    res.status(201).json({
      success: true,
      message: initialStatus === 'approved' ? 'Booking confirmed automatically! Your QR pass is ready.' : 'Booking request submitted for administrator approval.',
      booking,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get My Bookings
// @route   GET /api/bookings/my
// @access  Private
const getMyBookings = async (req, res, next) => {
  try {
    const bookings = await ResourceBooking.find({ user: req.user._id })
      .populate('resource')
      .sort({ startDateTime: -1 });

    res.json({ success: true, count: bookings.length, bookings });
  } catch (err) {
    next(err);
  }
};

// @desc    Get All Bookings (Admin / Facility Staff)
// @route   GET /api/bookings
// @access  Private (Admin / Faculty)
const getAllBookings = async (req, res, next) => {
  try {
    const { status, resourceId, date } = req.query;
    const query = {};

    if (status && status !== 'All') {
      query.status = status;
    }
    if (resourceId && resourceId !== 'All') {
      query.resource = resourceId;
    }
    if (date) {
      const d = new Date(date);
      d.setHours(0,0,0,0);
      const dEnd = new Date(date);
      dEnd.setHours(23,59,59,999);
      query.bookingDate = { $gte: d, $lte: dEnd };
    }

    const bookings = await ResourceBooking.find(query)
      .populate('resource')
      .populate('user', 'name email role')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: bookings.length, bookings });
  } catch (err) {
    next(err);
  }
};

// @desc    Approve / Reject Booking (Admin)
// @route   PUT /api/bookings/:id/status
// @access  Private (Admin / Faculty)
const updateBookingStatus = async (req, res, next) => {
  try {
    const { status, remarks } = req.body; // 'approved' or 'rejected'
    const booking = await ResourceBooking.findById(req.params.id).populate('resource').populate('user', 'name email');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    if (status === 'approved') {
      // Re-verify overlap before final approval
      const overlap = await ResourceBooking.findOne({
        _id: { $ne: booking._id },
        resource: booking.resource._id,
        status: { $in: ['approved', 'checked_in'] },
        $and: [
          { startDateTime: { $lt: booking.endDateTime } },
          { endDateTime: { $gt: booking.startDateTime } }
        ]
      });

      if (overlap) {
        return res.status(400).json({
          success: false,
          message: 'Cannot approve: another overlapping booking has already been confirmed for this time slot.',
        });
      }

      const qrCode = await generateQRCodeDataURL(`COLLEGEHUB:BOOKING:${booking.bookingReference}:${booking.resource._id}:${booking.user._id}`);
      booking.qrCode = qrCode;
      booking.status = 'approved';
      booking.approvedBy = req.user._id;

      await sendNotificationToUser(booking.user._id, {
        sender: req.user._id,
        title: 'Booking Approved! 🎟️',
        message: `Your booking for "${booking.resource.name}" on ${new Date(booking.bookingDate).toLocaleDateString()} (${booking.startTime} - ${booking.endTime}) has been approved.`,
        type: 'booking_status',
        link: '/campus-slot/my-bookings',
      });
    } else if (status === 'rejected') {
      booking.status = 'rejected';
      booking.rejectionReason = remarks || 'Slot unavailable';

      await sendNotificationToUser(booking.user._id, {
        sender: req.user._id,
        title: 'Booking Request Declined',
        message: `Your booking request for "${booking.resource.name}" was declined. Reason: ${remarks || 'Slot unavailable'}.`,
        type: 'booking_status',
        link: '/campus-slot/my-bookings',
      });
    } else {
      booking.status = status;
    }

    if (remarks) booking.remarks = remarks;
    await booking.save();

    res.json({ success: true, message: `Booking marked as ${status}.`, booking });
  } catch (err) {
    next(err);
  }
};

// @desc    QR Check-In Verification
// @route   POST /api/bookings/check-in
// @access  Private (Staff / Admin / User)
const checkInBooking = async (req, res, next) => {
  try {
    const { qrData, bookingReference } = req.body;
    let ref = bookingReference;

    if (qrData && qrData.startsWith('COLLEGEHUB:BOOKING:')) {
      const parts = qrData.split(':');
      ref = parts[2];
    }

    if (!ref) {
      return res.status(400).json({ success: false, message: 'Invalid booking QR code or reference.' });
    }

    const booking = await ResourceBooking.findOne({ bookingReference: ref })
      .populate('resource')
      .populate('user', 'name email');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    if (booking.status === 'checked_in') {
      return res.json({ success: true, message: 'Already checked in.', booking });
    }

    if (booking.status !== 'approved') {
      return res.status(400).json({ success: false, message: `Cannot check in. Booking status is '${booking.status}'.` });
    }

    booking.status = 'checked_in';
    booking.checkInTime = new Date();
    await booking.save();

    res.json({
      success: true,
      message: `Check-in confirmed for ${booking.user.name} at ${booking.resource.name}!`,
      booking,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Cancel Booking
// @route   PUT /api/bookings/:id/cancel
// @access  Private
const cancelBooking = async (req, res, next) => {
  try {
    const booking = await ResourceBooking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    const isOwner = String(booking.user) === String(req.user._id);
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized to cancel this booking.' });
    }

    booking.status = 'cancelled';
    await booking.save();

    res.json({ success: true, message: 'Booking cancelled successfully.', booking });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getCampusResources,
  createCampusResource,
  checkAvailability,
  requestBooking,
  getMyBookings,
  getAllBookings,
  updateBookingStatus,
  checkInBooking,
  cancelBooking,
};
