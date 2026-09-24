const Complaint = require('../models/Complaint');
const ComplaintComment = require('../models/ComplaintComment');
const SystemConfig = require('../models/SystemConfig');
const User = require('../models/User');
const StaffProfile = require('../models/StaffProfile');
const { calculateSlaDeadline } = require('../utils/slaHelper');
const { sendNotificationToUser, broadcastToRole } = require('../sockets/socketHandler');

// @desc    Create Complaint Ticket
// @route   POST /api/complaints
// @access  Private
const createComplaint = async (req, res, next) => {
  try {
    const { title, description, category, location, priority = 'Medium', assignedDepartment } = req.body;

    if (!title || !description || !category || !location) {
      return res.status(400).json({ success: false, message: 'Title, description, category, and location are required.' });
    }

    let photo = '';
    if (req.file) {
      photo = `/uploads/${req.file.filename}`;
    }

    // Get college SLA config
    const config = await SystemConfig.findOne();
    const { slaHours, slaDeadline } = calculateSlaDeadline(priority, config ? config.slaSettings : {});

    // Generate unique Ticket Number (e.g. FIX-2026-8742)
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    const ticketNumber = `FIX-${new Date().getFullYear()}-${randomDigits}`;

    const complaint = await Complaint.create({
      ticketNumber,
      title: title.trim(),
      description,
      category,
      location: location.trim(),
      photo,
      priority,
      reportedBy: req.user._id,
      assignedDepartment: assignedDepartment || 'Maintenance & Facilities',
      status: 'Open',
      slaHours,
      slaDeadline,
      statusHistory: [{
        status: 'Open',
        changedBy: req.user._id,
        note: 'Ticket reported by user',
      }],
    });

    // Notify maintenance staff role
    broadcastToRole('maintenance_staff', 'new_ticket_reported', {
      ticketNumber,
      title,
      category,
      priority,
    });

    res.status(201).json({
      success: true,
      message: 'Complaint ticket created successfully!',
      complaint,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get My Complaints (For logged-in Student or Faculty)
// @route   GET /api/complaints/my
// @access  Private
const getMyComplaints = async (req, res, next) => {
  try {
    const complaints = await Complaint.find({ reportedBy: req.user._id })
      .populate('assignedStaff', 'name avatar phone')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: complaints.length, complaints });
  } catch (err) {
    next(err);
  }
};

// @desc    Get All Complaints / Workboard (Staff & Admin)
// @route   GET /api/complaints
// @access  Private
const getAllComplaints = async (req, res, next) => {
  try {
    const { status, priority, category, assignedToMe, search } = req.query;
    const query = {};

    if (status && status !== 'All') {
      query.status = status;
    }
    if (priority && priority !== 'All') {
      query.priority = priority;
    }
    if (category && category !== 'All') {
      query.category = category;
    }

    if (assignedToMe === 'true') {
      query.assignedStaff = req.user._id;
    }

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { ticketNumber: searchRegex },
        { title: searchRegex },
        { description: searchRegex },
        { location: searchRegex },
      ];
    }

    // Check & update SLA breaches dynamically
    const now = new Date();
    await Complaint.updateMany(
      {
        status: { $nin: ['Resolved', 'Closed', 'Rejected'] },
        slaDeadline: { $lt: now },
        slaBreached: false,
      },
      { $set: { slaBreached: true } }
    );

    const complaints = await Complaint.find(query)
      .populate('reportedBy', 'name email avatar role')
      .populate('assignedStaff', 'name email avatar phone')
      .sort({ priority: -1, createdAt: -1 });

    res.json({ success: true, count: complaints.length, complaints });
  } catch (err) {
    next(err);
  }
};

// @desc    Get Single Complaint Detail with Comments
// @route   GET /api/complaints/:id
// @access  Private
const getComplaintById = async (req, res, next) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate('reportedBy', 'name email avatar role phone')
      .populate('assignedStaff', 'name email avatar phone')
      .populate('statusHistory.changedBy', 'name role');

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found.' });
    }

    // Authorize: reporter, assigned staff, or admin/maintenance staff
    const isReporter = String(complaint.reportedBy._id) === String(req.user._id);
    const isAssigned = complaint.assignedStaff && String(complaint.assignedStaff._id) === String(req.user._id);
    const isStaffOrAdmin = ['admin', 'maintenance_staff'].includes(req.user.role);

    if (!isReporter && !isAssigned && !isStaffOrAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this ticket.' });
    }

    const commentsQuery = { complaint: complaint._id };
    if (!isStaffOrAdmin) {
      commentsQuery.isInternal = false;
    }

    const comments = await ComplaintComment.find(commentsQuery)
      .populate('user', 'name avatar role')
      .sort({ createdAt: 1 });

    // Calculate SLA time remaining
    const now = new Date().getTime();
    const deadlineTime = new Date(complaint.slaDeadline).getTime();
    const msRemaining = deadlineTime - now;
    const hoursRemaining = Math.round(msRemaining / (1000 * 60 * 60) * 10) / 10;

    res.json({
      success: true,
      complaint,
      comments,
      slaStatus: {
        isBreached: msRemaining < 0 && !['Resolved', 'Closed'].includes(complaint.status),
        hoursRemaining: msRemaining > 0 ? hoursRemaining : 0,
        hoursOverdue: msRemaining < 0 ? Math.abs(hoursRemaining) : 0,
        isWarning: msRemaining > 0 && msRemaining < 2 * 60 * 60 * 1000, // < 2 hours
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Assign Staff to Complaint (Admin / Dispatcher)
// @route   PUT /api/complaints/:id/assign
// @access  Private (Admin / Maintenance Staff Lead)
const assignComplaint = async (req, res, next) => {
  try {
    const { staffId } = req.body;
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found.' });
    }

    const staffUser = await User.findById(staffId);
    if (!staffUser) {
      return res.status(404).json({ success: false, message: 'Staff member not found.' });
    }

    complaint.assignedStaff = staffId;
    complaint.status = 'Assigned';
    complaint.statusHistory.push({
      status: 'Assigned',
      changedBy: req.user._id,
      note: `Assigned to ${staffUser.name}`,
    });

    await complaint.save();

    await sendNotificationToUser(staffId, {
      sender: req.user._id,
      title: 'New Maintenance Ticket Assigned',
      message: `You were assigned ticket #${complaint.ticketNumber}: "${complaint.title}".`,
      type: 'complaint_assigned',
      link: `/campus-fix/${complaint._id}`,
    });

    res.json({ success: true, message: `Ticket assigned to ${staffUser.name}.`, complaint });
  } catch (err) {
    next(err);
  }
};

// @desc    Update Ticket Status (Staff / Admin)
// @route   PUT /api/complaints/:id/status
// @access  Private (Maintenance Staff / Admin)
const updateTicketStatus = async (req, res, next) => {
  try {
    const { status, note, resolutionProof, resolutionNotes } = req.body;
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found.' });
    }

    if (status === 'Resolved') {
      complaint.status = 'Resolved';
      complaint.resolvedAt = new Date();
      if (resolutionProof) complaint.resolutionProof = resolutionProof;
      if (req.file) complaint.resolutionProof = `/uploads/${req.file.filename}`;
      if (resolutionNotes) complaint.resolutionNotes = resolutionNotes;

      // Update staff statistics
      if (complaint.assignedStaff) {
        await StaffProfile.findOneAndUpdate(
          { user: complaint.assignedStaff },
          { $inc: { resolvedTicketsCount: 1 } }
        );
      }

      await sendNotificationToUser(complaint.reportedBy, {
        sender: req.user._id,
        title: 'Issue Resolved! Please Confirm ✅',
        message: `Ticket #${complaint.ticketNumber} has been resolved. Please review and confirm closure.`,
        type: 'complaint_resolved',
        link: `/campus-fix/${complaint._id}`,
      });
    } else {
      complaint.status = status;
    }

    complaint.statusHistory.push({
      status,
      changedBy: req.user._id,
      note: note || `Status updated to ${status}`,
    });

    await complaint.save();

    res.json({ success: true, message: `Ticket status updated to ${status}.`, complaint });
  } catch (err) {
    next(err);
  }
};

// @desc    Confirm Closure & Rate Maintenance (User)
// @route   PUT /api/complaints/:id/confirm-closure
// @access  Private (Reporter)
const confirmClosure = async (req, res, next) => {
  try {
    const { rating, feedback, reopen, reopenReason } = req.body;
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found.' });
    }

    if (String(complaint.reportedBy) !== String(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only the ticket reporter can confirm closure.' });
    }

    if (reopen) {
      complaint.status = 'Reopened';
      complaint.statusHistory.push({
        status: 'Reopened',
        changedBy: req.user._id,
        note: reopenReason || 'Reporter indicated problem persists',
      });
      await complaint.save();

      return res.json({ success: true, message: 'Ticket reopened. Staff notified.', complaint });
    }

    complaint.status = 'Closed';
    complaint.closedAt = new Date();
    if (rating) complaint.userRating = Number(rating);
    if (feedback) complaint.userFeedback = feedback;

    complaint.statusHistory.push({
      status: 'Closed',
      changedBy: req.user._id,
      note: `Closed by reporter with ${rating || 5} star rating.`,
    });

    await complaint.save();

    res.json({ success: true, message: 'Thank you for your feedback! Ticket closed.', complaint });
  } catch (err) {
    next(err);
  }
};

// @desc    Add Comment to Ticket
// @route   POST /api/complaints/:id/comments
// @access  Private
const addComplaintComment = async (req, res, next) => {
  try {
    const { message, isInternal } = req.body;
    if (!message) {
      return res.status(400).json({ success: false, message: 'Comment message is required.' });
    }

    let attachment = '';
    if (req.file) {
      attachment = `/uploads/${req.file.filename}`;
    }

    const comment = await ComplaintComment.create({
      complaint: req.params.id,
      user: req.user._id,
      message: message.trim(),
      attachment,
      isInternal: Boolean(isInternal),
    });

    const populated = await ComplaintComment.findById(comment._id).populate('user', 'name avatar role');

    res.status(201).json({ success: true, message: 'Comment added.', comment: populated });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createComplaint,
  getMyComplaints,
  getAllComplaints,
  getComplaintById,
  assignComplaint,
  updateTicketStatus,
  confirmClosure,
  addComplaintComment,
};
