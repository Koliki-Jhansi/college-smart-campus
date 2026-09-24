const Club = require('../models/Club');
const ClubMember = require('../models/ClubMember');
const ClubAnnouncement = require('../models/ClubAnnouncement');
const { sendNotificationToUser } = require('../sockets/socketHandler');

// @desc    Get all clubs
// @route   GET /api/clubs
// @access  Private
const getClubs = async (req, res, next) => {
  try {
    const { category, search } = req.query;
    const query = { isActive: true };

    if (category && category !== 'All') {
      query.category = category;
    }
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [{ name: searchRegex }, { code: searchRegex }, { description: searchRegex }];
    }

    const clubs = await Club.find(query)
      .populate('coordinator', 'name email avatar')
      .populate('facultyAdvisor', 'name designation')
      .sort({ name: 1 });

    const enriched = await Promise.all(
      clubs.map(async (c) => {
        const myMembership = await ClubMember.findOne({ club: c._id, user: req.user._id });
        const activeMembersCount = await ClubMember.countDocuments({ club: c._id, status: 'active' });
        return {
          ...c.toObject(),
          membersCount: activeMembersCount,
          membershipStatus: myMembership ? myMembership.status : 'none',
          membershipRole: myMembership ? myMembership.role : null,
        };
      })
    );

    res.json({ success: true, count: enriched.length, clubs: enriched });
  } catch (err) {
    next(err);
  }
};

// @desc    Create Club
// @route   POST /api/clubs
// @access  Private (Admin / Club Coordinator)
const createClub = async (req, res, next) => {
  try {
    const { name, code, description, category, facultyAdvisor, socialLinks } = req.body;
    if (!name || !code || !description) {
      return res.status(400).json({ success: false, message: 'Name, code, and description are required.' });
    }

    let logo = '';
    if (req.file) {
      logo = `/uploads/${req.file.filename}`;
    }

    const club = await Club.create({
      name: name.trim(),
      code: code.trim().toUpperCase(),
      description,
      category: category || 'Technical',
      logo,
      coordinator: req.user._id,
      facultyAdvisor: facultyAdvisor || null,
      socialLinks: socialLinks || {},
    });

    // Make creator a lead member
    await ClubMember.create({
      club: club._id,
      user: req.user._id,
      role: 'lead',
      status: 'active',
    });

    res.status(201).json({ success: true, message: 'Club created successfully!', club });
  } catch (err) {
    next(err);
  }
};

// @desc    Get Single Club Details
// @route   GET /api/clubs/:id
// @access  Private
const getClubById = async (req, res, next) => {
  try {
    const club = await Club.findById(req.params.id)
      .populate('coordinator', 'name email avatar role')
      .populate('facultyAdvisor', 'name email designation avatar');

    if (!club) {
      return res.status(404).json({ success: false, message: 'Club not found.' });
    }

    const members = await ClubMember.find({ club: club._id, status: 'active' })
      .populate('user', 'name email avatar role');

    const pendingRequests = await ClubMember.find({ club: club._id, status: 'pending' })
      .populate('user', 'name email avatar role');

    const announcements = await ClubAnnouncement.find({ club: club._id })
      .populate('author', 'name avatar')
      .sort({ isPinned: -1, createdAt: -1 });

    const isCoordinator = String(club.coordinator._id) === String(req.user._id) || req.user.role === 'admin';
    const myMembership = await ClubMember.findOne({ club: club._id, user: req.user._id });

    res.json({
      success: true,
      club,
      members,
      pendingRequests: isCoordinator ? pendingRequests : [],
      announcements,
      isCoordinator,
      membershipStatus: myMembership ? myMembership.status : 'none',
      membershipRole: myMembership ? myMembership.role : null,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Request Club Membership / Join
// @route   POST /api/clubs/:id/join
// @access  Private
const requestClubJoin = async (req, res, next) => {
  try {
    const { joinMessage } = req.body;
    const club = await Club.findById(req.params.id);

    if (!club) {
      return res.status(404).json({ success: false, message: 'Club not found.' });
    }

    const existing = await ClubMember.findOne({ club: club._id, user: req.user._id });
    if (existing && existing.status === 'active') {
      return res.status(400).json({ success: false, message: 'You are already an active member.' });
    }
    if (existing && existing.status === 'pending') {
      return res.status(400).json({ success: false, message: 'You already have a pending membership request.' });
    }

    const member = await ClubMember.create({
      club: club._id,
      user: req.user._id,
      joinMessage: joinMessage || '',
      status: 'pending',
    });

    await sendNotificationToUser(club.coordinator, {
      sender: req.user._id,
      title: 'New Club Join Request',
      message: `${req.user.name} applied to join "${club.name}".`,
      type: 'club_request',
      link: `/clubs/${club._id}`,
    });

    res.status(201).json({ success: true, message: 'Membership request submitted!', member });
  } catch (err) {
    next(err);
  }
};

// @desc    Handle Member Request (Accept / Reject)
// @route   PUT /api/clubs/members/:memberId
// @access  Private (Coordinator / Admin)
const handleClubMember = async (req, res, next) => {
  try {
    const { status, role } = req.body; // status: 'active', 'rejected'
    const member = await ClubMember.findById(req.params.memberId).populate('club');

    if (!member) {
      return res.status(404).json({ success: false, message: 'Member request not found.' });
    }

    if (status) member.status = status;
    if (role) member.role = role;
    await member.save();

    if (status === 'active') {
      await Club.findByIdAndUpdate(member.club._id, { $inc: { membersCount: 1 } });
      await sendNotificationToUser(member.user, {
        sender: req.user._id,
        title: 'Club Membership Approved! 🎉',
        message: `You are now an active member of "${member.club.name}".`,
        type: 'general',
        link: `/clubs/${member.club._id}`,
      });
    }

    res.json({ success: true, message: `Member status updated to ${status}.`, member });
  } catch (err) {
    next(err);
  }
};

// @desc    Post Club Announcement
// @route   POST /api/clubs/:id/announcements
// @access  Private (Coordinator / Lead / Admin)
const createClubAnnouncement = async (req, res, next) => {
  try {
    const { title, content, isPinned } = req.body;
    if (!title || !content) {
      return res.status(400).json({ success: false, message: 'Title and content are required.' });
    }

    const announcement = await ClubAnnouncement.create({
      club: req.params.id,
      title: title.trim(),
      content,
      author: req.user._id,
      isPinned: Boolean(isPinned),
    });

    const populated = await ClubAnnouncement.findById(announcement._id).populate('author', 'name avatar');

    res.status(201).json({ success: true, message: 'Announcement posted.', announcement: populated });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getClubs,
  createClub,
  getClubById,
  requestClubJoin,
  handleClubMember,
  createClubAnnouncement,
};
