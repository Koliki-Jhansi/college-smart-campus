const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');
const FacultyProfile = require('../models/FacultyProfile');
const StaffProfile = require('../models/StaffProfile');
const Connection = require('../models/Connection');
const Project = require('../models/Project');
const { sendNotificationToUser } = require('../sockets/socketHandler');

// @desc    Get user profile by User ID (Public or Detailed view)
// @route   GET /api/users/profile/:id
// @access  Private
const getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    let profile = null;
    if (user.role === 'student') {
      profile = await StudentProfile.findOne({ user: user._id });
    } else if (user.role === 'faculty') {
      profile = await FacultyProfile.findOne({ user: user._id });
    } else if (['maintenance_staff', 'transport_staff', 'club_coordinator'].includes(user.role)) {
      profile = await StaffProfile.findOne({ user: user._id });
    }

    // Check connection status between current user and target user
    let connectionStatus = 'none';
    if (req.user && String(req.user._id) !== String(user._id)) {
      const conn = await Connection.findOne({
        $or: [
          { requester: req.user._id, recipient: user._id },
          { requester: user._id, recipient: req.user._id }
        ]
      });
      if (conn) {
        connectionStatus = conn.status === 'accepted' ? 'connected' : (String(conn.requester) === String(req.user._id) ? 'outgoing_pending' : 'incoming_pending');
      }
    }

    // Projects by user
    const userProjects = await Project.find({
      $or: [
        { createdBy: user._id },
        { 'members.user': user._id }
      ]
    }).select('title description category technologies status progress');

    res.json({
      success: true,
      user,
      profile,
      connectionStatus,
      projects: userProjects,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update Student Profile
// @route   PUT /api/users/student-profile
// @access  Private (Student)
const updateStudentProfile = async (req, res, next) => {
  try {
    const {
      name,
      phone,
      bio,
      skills,
      skillsWanted,
      interests,
      github,
      linkedin,
      portfolio,
      section,
      year,
      semester,
      isPublic,
    } = req.body;

    // Update User model fields
    if (name || phone !== undefined) {
      await User.findByIdAndUpdate(req.user._id, {
        ...(name && { name }),
        ...(phone !== undefined && { phone }),
      });
    }

    // Process array fields
    const cleanArray = (val) => {
      if (Array.isArray(val)) return val.map(s => String(s).trim()).filter(Boolean);
      if (typeof val === 'string') return val.split(',').map(s => s.trim()).filter(Boolean);
      return undefined;
    };

    let profile = await StudentProfile.findOne({ user: req.user._id });
    if (!profile) {
      profile = new StudentProfile({ user: req.user._id });
    }

    if (bio !== undefined) profile.bio = bio;
    if (github !== undefined) profile.github = github;
    if (linkedin !== undefined) profile.linkedin = linkedin;
    if (portfolio !== undefined) profile.portfolio = portfolio;
    if (section !== undefined) profile.section = section;
    if (year !== undefined) profile.year = Number(year);
    if (semester !== undefined) profile.semester = Number(semester);
    if (isPublic !== undefined) profile.isPublic = isPublic;

    if (skills !== undefined) profile.skills = cleanArray(skills);
    if (skillsWanted !== undefined) profile.skillsWanted = cleanArray(skillsWanted);
    if (interests !== undefined) profile.interests = cleanArray(interests);

    await profile.save();

    const updatedUser = await User.findById(req.user._id);

    res.json({
      success: true,
      message: 'Profile updated successfully!',
      user: updatedUser,
      profile,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update Faculty Profile
// @route   PUT /api/users/faculty-profile
// @access  Private (Faculty)
const updateFacultyProfile = async (req, res, next) => {
  try {
    const { name, phone, designation, cabinLocation, officeHours, researchInterests, bio } = req.body;

    if (name || phone !== undefined) {
      await User.findByIdAndUpdate(req.user._id, {
        ...(name && { name }),
        ...(phone !== undefined && { phone }),
      });
    }

    let profile = await FacultyProfile.findOne({ user: req.user._id });
    if (!profile) {
      profile = new FacultyProfile({ user: req.user._id });
    }

    if (designation) profile.designation = designation;
    if (cabinLocation !== undefined) profile.cabinLocation = cabinLocation;
    if (officeHours !== undefined) profile.officeHours = officeHours;
    if (bio !== undefined) profile.bio = bio;
    if (researchInterests) {
      profile.researchInterests = Array.isArray(researchInterests)
        ? researchInterests
        : researchInterests.split(',').map(s => s.trim()).filter(Boolean);
    }

    await profile.save();
    const updatedUser = await User.findById(req.user._id);

    res.json({
      success: true,
      message: 'Faculty profile updated successfully.',
      user: updatedUser,
      profile,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Upload User Avatar
// @route   POST /api/users/avatar
// @access  Private
const uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload an image file.' });
    }

    const avatarUrl = `/uploads/${req.file.filename}`;
    const user = await User.findByIdAndUpdate(req.user._id, { avatar: avatarUrl }, { new: true });

    res.json({
      success: true,
      message: 'Avatar uploaded successfully.',
      avatar: avatarUrl,
      user,
    });
  } catch (err) {
    next(err);
  }
};

// --- CAMPUSCONNECT (NETWORKING) ---

// @desc    Search and Discover Students (CampusConnect)
// @route   GET /api/users/students
// @access  Private
const searchStudents = async (req, res, next) => {
  try {
    const {
      search,
      department,
      year,
      skill,
      page = 1,
      limit = 12,
    } = req.query;

    const query = { isPublic: true };

    // Exclude self
    query.user = { $ne: req.user._id };

    if (department && department !== 'All') {
      query.department = department;
    }

    if (year && year !== 'All') {
      query.year = Number(year);
    }

    if (skill) {
      query.skills = { $regex: new RegExp(skill, 'i') };
    }

    // Find student profiles with pagination
    const skip = (Number(page) - 1) * Number(limit);

    let profiles = await StudentProfile.find(query)
      .populate('user', 'name email avatar role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    // If search text is provided, filter also by student user name
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      profiles = profiles.filter(p => {
        const matchesName = p.user && searchRegex.test(p.user.name);
        const matchesCollegeId = searchRegex.test(p.collegeId);
        const matchesSkill = p.skills && p.skills.some(s => searchRegex.test(s));
        return matchesName || matchesCollegeId || matchesSkill;
      });
    }

    const total = await StudentProfile.countDocuments(query);

    res.json({
      success: true,
      students: profiles,
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

// @desc    Send Connection Request
// @route   POST /api/users/connect/:recipientId
// @access  Private
const sendConnectionRequest = async (req, res, next) => {
  try {
    const { recipientId } = req.params;
    const { message } = req.body;

    if (String(req.user._id) === String(recipientId)) {
      return res.status(400).json({ success: false, message: 'You cannot connect with yourself.' });
    }

    const existing = await Connection.findOne({
      $or: [
        { requester: req.user._id, recipient: recipientId },
        { requester: recipientId, recipient: req.user._id },
      ],
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: existing.status === 'accepted' ? 'You are already connected.' : 'A connection request already exists.',
      });
    }

    const connection = await Connection.create({
      requester: req.user._id,
      recipient: recipientId,
      message: message || '',
    });

    // Real-time Notification
    await sendNotificationToUser(recipientId, {
      sender: req.user._id,
      title: 'New Connection Request',
      message: `${req.user.name} sent you a connection request on CampusConnect.`,
      type: 'connection_request',
      link: '/campus-connect',
    });

    res.status(201).json({
      success: true,
      message: 'Connection request sent successfully!',
      connection,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Accept / Reject Connection Request
// @route   PUT /api/users/connect/:connectionId
// @access  Private
const handleConnectionResponse = async (req, res, next) => {
  try {
    const { connectionId } = req.params;
    const { action } = req.body; // 'accept' or 'reject'

    const connection = await Connection.findById(connectionId).populate('requester', 'name');
    if (!connection) {
      return res.status(404).json({ success: false, message: 'Connection request not found.' });
    }

    if (String(connection.recipient) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Not authorized to respond to this request.' });
    }

    if (action === 'accept') {
      connection.status = 'accepted';
      await connection.save();

      await sendNotificationToUser(connection.requester._id, {
        sender: req.user._id,
        title: 'Connection Accepted',
        message: `${req.user.name} accepted your connection request.`,
        type: 'connection_accepted',
        link: `/profile/${req.user._id}`,
      });

      return res.json({ success: true, message: 'Connection accepted!', connection });
    } else {
      connection.status = 'rejected';
      await connection.save();
      return res.json({ success: true, message: 'Connection request declined.' });
    }
  } catch (err) {
    next(err);
  }
};

// @desc    Get My Connections & Pending Requests
// @route   GET /api/users/connections
// @access  Private
const getMyConnections = async (req, res, next) => {
  try {
    const accepted = await Connection.find({
      $or: [{ requester: req.user._id }, { recipient: req.user._id }],
      status: 'accepted',
    })
      .populate('requester', 'name email avatar role')
      .populate('recipient', 'name email avatar role')
      .sort({ updatedAt: -1 });

    const pendingIncoming = await Connection.find({
      recipient: req.user._id,
      status: 'pending',
    }).populate('requester', 'name email avatar role');

    const pendingOutgoing = await Connection.find({
      requester: req.user._id,
      status: 'pending',
    }).populate('recipient', 'name email avatar role');

    res.json({
      success: true,
      connections: accepted.map(c => {
        const isRequester = String(c.requester._id) === String(req.user._id);
        const peer = isRequester ? c.recipient : c.requester;
        return {
          _id: c._id,
          peer,
          connectedSince: c.updatedAt,
        };
      }),
      pendingIncoming,
      pendingOutgoing,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Admin get all users
// @route   GET /api/admin/users
// @access  Private (Admin)
const getAllUsersAdmin = async (req, res, next) => {
  try {
    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: users.length, users });
  } catch (err) {
    next(err);
  }
};

// @desc    Admin approve or reject staff account
// @route   PATCH /api/admin/users/:id/approve-staff
// @access  Private (Admin)
const approveStaffAccount = async (req, res, next) => {
  try {
    const { approve } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    user.isApprovedStaff = approve === true;
    if (approve === false) {
      user.status = 'suspended';
    } else {
      user.status = 'active';
    }
    await user.save();

    res.json({ success: true, message: `Staff account ${approve ? 'approved' : 'rejected'}.`, user });
  } catch (err) {
    next(err);
  }
};

// @desc    Admin update user account status (active/suspended)
// @route   PATCH /api/admin/users/:id/status
// @access  Private (Admin)
const updateUserStatusAdmin = async (req, res, next) => {
  try {
    const { status } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (user.role === 'admin' && String(user._id) === String(req.user._id)) {
      return res.status(400).json({ success: false, message: 'You cannot suspend your own admin account.' });
    }

    user.status = status;
    await user.save();

    res.json({ success: true, message: `User status set to ${status}.`, user });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getUserProfile,
  updateStudentProfile,
  updateFacultyProfile,
  uploadAvatar,
  searchStudents,
  sendConnectionRequest,
  handleConnectionResponse,
  getMyConnections,
  getAllUsersAdmin,
  approveStaffAccount,
  updateUserStatusAdmin,
};
