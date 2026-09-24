const CampusEvent = require('../models/CampusEvent');
const EventRegistration = require('../models/EventRegistration');
const Certificate = require('../models/Certificate');
const StudentProfile = require('../models/StudentProfile');
const { generateQRCodeDataURL } = require('../utils/qrHelper');
const { generateCertificateBuffer } = require('../utils/pdfGenerator');
const { sendNotificationToUser } = require('../sockets/socketHandler');

// @desc    Get all events with filters & search
// @route   GET /api/events
// @access  Private
const getEvents = async (req, res, next) => {
  try {
    const { category, timeframe, search, page = 1, limit = 9 } = req.query;
    const query = { isPublished: true };

    if (category && category !== 'All') {
      query.category = category;
    }

    const now = new Date();
    if (timeframe === 'upcoming') {
      query.startDate = { $gte: now };
    } else if (timeframe === 'past') {
      query.endDate = { $lt: now };
    }

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [{ title: searchRegex }, { description: searchRegex }, { venue: searchRegex }];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await CampusEvent.countDocuments(query);

    const events = await CampusEvent.find(query)
      .populate('organizer', 'name email avatar')
      .populate('club', 'name code logo')
      .sort({ startDate: 1 })
      .skip(skip)
      .limit(Number(limit));

    // Get registrations count for each event
    const enriched = await Promise.all(
      events.map(async (ev) => {
        const regCount = await EventRegistration.countDocuments({
          event: ev._id,
          status: { $in: ['registered', 'attended'] },
        });
        const isUserRegistered = await EventRegistration.exists({
          event: ev._id,
          user: req.user._id,
          status: { $in: ['registered', 'attended'] },
        });
        return {
          ...ev.toObject(),
          currentRegistrations: regCount,
          isUserRegistered: Boolean(isUserRegistered),
          isFull: regCount >= ev.maxParticipants,
        };
      })
    );

    res.json({
      success: true,
      events: enriched,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get My Event Registrations
// @route   GET /api/events/my
// @access  Private
const getMyRegistrations = async (req, res, next) => {
  try {
    const registrations = await EventRegistration.find({ user: req.user._id })
      .populate({
        path: 'event',
        populate: [{ path: 'organizer', select: 'name avatar' }, { path: 'club', select: 'name logo' }]
      })
      .populate('certificateId')
      .sort({ registrationDate: -1 });

    res.json({ success: true, count: registrations.length, registrations });
  } catch (err) {
    next(err);
  }
};

// @desc    Get Single Event Detail
// @route   GET /api/events/:id
// @access  Private
const getEventById = async (req, res, next) => {
  try {
    const event = await CampusEvent.findById(req.params.id)
      .populate('organizer', 'name email avatar role')
      .populate('club', 'name code logo coordinator');

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    const regCount = await EventRegistration.countDocuments({
      event: event._id,
      status: { $in: ['registered', 'attended'] },
    });

    const userRegistration = await EventRegistration.findOne({
      event: event._id,
      user: req.user._id,
    }).populate('certificateId');

    const attendees = await EventRegistration.find({
      event: event._id,
      status: { $in: ['registered', 'attended'] },
    }).populate('user', 'name avatar role department');

    const isOrganizer = String(event.organizer._id) === String(req.user._id) || req.user.role === 'admin';

    res.json({
      success: true,
      event: {
        ...event.toObject(),
        currentRegistrations: regCount,
        isFull: regCount >= event.maxParticipants,
      },
      userRegistration,
      attendees: isOrganizer ? attendees : attendees.slice(0, 10), // Limit public attendee list
      isOrganizer,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create Event
// @route   POST /api/events
// @access  Private (Club Coordinator / Faculty / Admin)
const createEvent = async (req, res, next) => {
  try {
    const {
      title,
      description,
      category = 'Workshop',
      venue,
      startDate,
      endDate,
      registrationDeadline,
      maxParticipants = 100,
      club,
      contactInfo,
      eligibility,
    } = req.body;

    if (!title || !description || !venue || !startDate || !endDate) {
      return res.status(400).json({ success: false, message: 'Title, description, venue, start date, and end date are required.' });
    }

    let banner = '';
    if (req.file) {
      banner = `/uploads/${req.file.filename}`;
    }

    const event = await CampusEvent.create({
      title: title.trim(),
      description,
      category,
      venue: venue.trim(),
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      registrationDeadline: new Date(registrationDeadline || startDate),
      maxParticipants: Number(maxParticipants),
      organizer: req.user._id,
      club: club || null,
      banner,
      contactInfo: contactInfo || '',
      eligibility: eligibility || 'Open to all students',
    });

    res.status(201).json({
      success: true,
      message: 'Event published successfully!',
      event,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Register for Event
// @route   POST /api/events/:id/register
// @access  Private
const registerForEvent = async (req, res, next) => {
  try {
    const event = await CampusEvent.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    // Check duplicate
    const existing = await EventRegistration.findOne({
      event: event._id,
      user: req.user._id,
      status: { $in: ['registered', 'attended'] },
    });

    if (existing) {
      return res.status(400).json({ success: false, message: 'You are already registered for this event.' });
    }

    // Check deadline
    if (new Date() > new Date(event.registrationDeadline)) {
      return res.status(400).json({ success: false, message: 'Registration deadline for this event has passed.' });
    }

    // Check capacity
    const currentCount = await EventRegistration.countDocuments({
      event: event._id,
      status: { $in: ['registered', 'attended'] },
    });

    if (currentCount >= event.maxParticipants) {
      return res.status(400).json({ success: false, message: 'Event registration is full.' });
    }

    const ticketCode = `EVT-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;
    const qrCode = await generateQRCodeDataURL(`COLLEGEHUB:EVENT_TICKET:${ticketCode}:${event._id}:${req.user._id}`);

    const registration = await EventRegistration.create({
      event: event._id,
      user: req.user._id,
      ticketCode,
      qrCode,
      status: 'registered',
    });

    await sendNotificationToUser(req.user._id, {
      sender: event.organizer,
      title: 'Event Registration Confirmed! 🎫',
      message: `You are confirmed for "${event.title}". View your digital QR ticket.`,
      type: 'event_registration',
      link: `/events/${event._id}`,
    });

    res.status(201).json({
      success: true,
      message: 'Registered successfully! QR ticket generated.',
      registration,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    QR Attendance Check-In
// @route   POST /api/events/check-in
// @access  Private (Organizer / Staff / Admin)
const checkInAttendee = async (req, res, next) => {
  try {
    const { qrData, ticketCode } = req.body;
    let code = ticketCode;

    if (qrData && qrData.startsWith('COLLEGEHUB:EVENT_TICKET:')) {
      const parts = qrData.split(':');
      code = parts[2];
    }

    if (!code) {
      return res.status(400).json({ success: false, message: 'Invalid ticket QR data.' });
    }

    const reg = await EventRegistration.findOne({ ticketCode: code })
      .populate('event')
      .populate('user', 'name email');

    if (!reg) {
      return res.status(404).json({ success: false, message: 'Ticket registration not found.' });
    }

    if (reg.status === 'attended') {
      return res.json({ success: true, message: 'Attendee already checked in.', registration: reg });
    }

    reg.status = 'attended';
    reg.checkInTime = new Date();
    await reg.save();

    // Auto issue Certificate for attended participants
    let certificate = await Certificate.findOne({ user: reg.user._id, event: reg.event._id });
    if (!certificate) {
      const studentProf = await StudentProfile.findOne({ user: reg.user._id });
      const certNumber = `CERT-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

      certificate = await Certificate.create({
        certificateNumber: certNumber,
        user: reg.user._id,
        event: reg.event._id,
        recipientName: reg.user.name,
        rollNumber: studentProf ? studentProf.collegeId : '',
        eventTitle: reg.event.title,
        category: reg.event.category,
      });

      reg.certificateGenerated = true;
      reg.certificateId = certificate._id;
      await reg.save();
    }

    res.json({
      success: true,
      message: `Checked in successfully: ${reg.user.name} for "${reg.event.title}". Verified Certificate issued!`,
      registration: reg,
      certificate,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Download / View Certificate PDF
// @route   GET /api/events/certificates/:certificateId/pdf
// @access  Private
const downloadCertificatePDF = async (req, res, next) => {
  try {
    const certificate = await Certificate.findById(req.params.certificateId);
    if (!certificate) {
      return res.status(404).json({ success: false, message: 'Certificate not found.' });
    }

    const pdfBuffer = await generateCertificateBuffer({
      recipientName: certificate.recipientName,
      rollNumber: certificate.rollNumber,
      eventTitle: certificate.eventTitle,
      category: certificate.category,
      certificateNumber: certificate.certificateNumber,
      issueDate: certificate.issueDate,
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Certificate_${certificate.certificateNumber}.pdf`);
    res.send(pdfBuffer);
  } catch (err) {
    next(err);
  }
};

// @desc    Get All My Verified Certificates
// @route   GET /api/events/my-certificates
// @access  Private
const getMyCertificates = async (req, res, next) => {
  try {
    const certificates = await Certificate.find({ user: req.user._id })
      .populate('event', 'title category startDate venue banner')
      .sort({ issueDate: -1 });

    res.json({ success: true, count: certificates.length, certificates });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getEvents,
  getMyRegistrations,
  getEventById,
  createEvent,
  registerForEvent,
  checkInAttendee,
  downloadCertificatePDF,
  getMyCertificates,
};
