const StudentProfile = require('../models/StudentProfile');
const SkillRequest = require('../models/SkillRequest');
const SkillSession = require('../models/SkillSession');
const User = require('../models/User');
const Conversation = require('../models/Conversation');
const { sendNotificationToUser } = require('../sockets/socketHandler');

// @desc    Get Rule-based Skill Matches for Current Student
// @route   GET /api/skillswap/matches
// @access  Private
const getSkillMatches = async (req, res, next) => {
  try {
    const myProfile = await StudentProfile.findOne({ user: req.user._id });
    if (!myProfile) {
      return res.json({ success: true, matches: [], message: 'Please complete your student profile skills.' });
    }

    const mySkills = (myProfile.skills || []).map(s => s.toLowerCase());
    const myWanted = (myProfile.skillsWanted || []).map(s => s.toLowerCase());

    if (mySkills.length === 0 && myWanted.length === 0) {
      return res.json({ success: true, matches: [] });
    }

    // Find other public profiles
    const otherProfiles = await StudentProfile.find({
      user: { $ne: req.user._id },
      isPublic: true,
    }).populate('user', 'name email avatar role');

    const matches = [];

    for (const other of otherProfiles) {
      const otherSkills = (other.skills || []).map(s => s.toLowerCase());
      const otherWanted = (other.skillsWanted || []).map(s => s.toLowerCase());

      // Skills they have that I want
      const theyCanTeachMe = otherSkills.filter(s => myWanted.some(w => w.includes(s) || s.includes(w)));
      // Skills I have that they want
      const iCanTeachThem = mySkills.filter(s => otherWanted.some(w => w.includes(s) || s.includes(w)));

      // Mutual exchange score
      let matchScore = 0;
      let matchType = 'one-way';

      if (theyCanTeachMe.length > 0 && iCanTeachThem.length > 0) {
        matchScore = 95;
        matchType = 'mutual-swap';
      } else if (theyCanTeachMe.length > 0) {
        matchScore = 75;
        matchType = 'potential-mentor';
      } else if (iCanTeachThem.length > 0) {
        matchScore = 60;
        matchType = 'potential-learner';
      }

      if (matchScore > 0) {
        matches.push({
          user: other.user,
          profile: other,
          matchScore,
          matchType,
          theyCanTeachMe,
          iCanTeachThem,
          department: other.department,
          rating: other.rating || 5.0,
          sessionsHelpedCount: other.sessionsHelpedCount || 0,
        });
      }
    }

    matches.sort((a, b) => b.matchScore - a.matchScore);

    res.json({
      success: true,
      count: matches.length,
      matches,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Search Skills and Available Peers
// @route   GET /api/skillswap/search
// @access  Private
const searchSkills = async (req, res, next) => {
  try {
    const { skill, department } = req.query;
    const query = { isPublic: true, user: { $ne: req.user._id } };

    if (skill) {
      query.skills = { $regex: new RegExp(skill, 'i') };
    }
    if (department && department !== 'All') {
      query.department = department;
    }

    const peers = await StudentProfile.find(query)
      .populate('user', 'name email avatar role')
      .sort({ rating: -1, sessionsHelpedCount: -1 })
      .limit(20);

    res.json({
      success: true,
      count: peers.length,
      peers,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Send Skill Request
// @route   POST /api/skillswap/requests
// @access  Private
const sendSkillRequest = async (req, res, next) => {
  try {
    const { mentorId, skillWanted, skillOffered, message, proposedDate } = req.body;

    if (!mentorId || !skillWanted) {
      return res.status(400).json({ success: false, message: 'Mentor and skill wanted are required.' });
    }

    if (String(mentorId) === String(req.user._id)) {
      return res.status(400).json({ success: false, message: 'You cannot request a skill session with yourself.' });
    }

    const request = await SkillRequest.create({
      requester: req.user._id,
      mentor: mentorId,
      skillWanted,
      skillOffered: skillOffered || '',
      message: message || '',
      proposedDate: proposedDate || null,
    });

    await sendNotificationToUser(mentorId, {
      sender: req.user._id,
      title: 'New SkillSwap Request',
      message: `${req.user.name} sent you a request to learn "${skillWanted}".`,
      type: 'skill_request',
      link: '/skill-swap',
    });

    res.status(201).json({
      success: true,
      message: 'SkillSwap request sent!',
      request,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get My Skill Requests (Incoming and Outgoing)
// @route   GET /api/skillswap/requests
// @access  Private
const getMySkillRequests = async (req, res, next) => {
  try {
    const incoming = await SkillRequest.find({ mentor: req.user._id })
      .populate('requester', 'name email avatar')
      .sort({ createdAt: -1 });

    const outgoing = await SkillRequest.find({ requester: req.user._id })
      .populate('mentor', 'name email avatar')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      incoming,
      outgoing,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Schedule Session (Upon Accept)
// @route   POST /api/skillswap/sessions
// @access  Private
const scheduleSession = async (req, res, next) => {
  try {
    const { requestId, scheduledAt, durationMinutes = 60, meetingLink } = req.body;

    const request = await SkillRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Skill request not found.' });
    }

    if (String(request.mentor) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Only the requested mentor can schedule this session.' });
    }

    request.status = 'scheduled';
    await request.save();

    const session = await SkillSession.create({
      skillRequest: request._id,
      mentor: req.user._id,
      learner: request.requester,
      skill: request.skillWanted,
      scheduledAt: new Date(scheduledAt),
      durationMinutes: Number(durationMinutes),
      meetingLink: meetingLink || '',
      status: 'scheduled',
    });

    // Create / ensure conversation between them
    await Conversation.create({
      type: 'skill_swap',
      participants: [req.user._id, request.requester],
      referenceId: session._id,
      title: `SkillSwap: ${request.skillWanted}`,
    });

    await sendNotificationToUser(request.requester, {
      sender: req.user._id,
      title: 'SkillSwap Session Scheduled! 📅',
      message: `${req.user.name} scheduled your session for "${request.skillWanted}" on ${new Date(scheduledAt).toLocaleString()}.`,
      type: 'skill_session_scheduled',
      link: '/skill-swap',
    });

    res.status(201).json({
      success: true,
      message: 'Session scheduled successfully!',
      session,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Complete and Review Session
// @route   PUT /api/skillswap/sessions/:id/complete
// @access  Private
const completeSession = async (req, res, next) => {
  try {
    const { rating, review, notes } = req.body;
    const session = await SkillSession.findById(req.params.id);

    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found.' });
    }

    const isMentor = String(session.mentor) === String(req.user._id);
    const isLearner = String(session.learner) === String(req.user._id);

    if (!isMentor && !isLearner) {
      return res.status(403).json({ success: false, message: 'Not authorized for this session.' });
    }

    if (isLearner) {
      if (session.learnerRating) {
        return res.status(400).json({ success: false, message: 'You have already rated this session.' });
      }
      session.learnerRating = Number(rating);
      session.learnerReview = review || '';

      // Update mentor's profile stats
      const mentorProfile = await StudentProfile.findOne({ user: session.mentor });
      if (mentorProfile) {
        mentorProfile.ratingsCount = (mentorProfile.ratingsCount || 0) + 1;
        mentorProfile.rating = Number((((mentorProfile.rating || 5.0) * (mentorProfile.ratingsCount - 1) + Number(rating)) / mentorProfile.ratingsCount).toFixed(1));
        mentorProfile.sessionsHelpedCount = (mentorProfile.sessionsHelpedCount || 0) + 1;
        await mentorProfile.save();
      }
    }

    if (isMentor) {
      if (notes) session.mentorNotes = notes;
      if (rating) {
        session.mentorRating = Number(rating);
        session.mentorReview = review || '';
      }
    }

    session.status = 'completed';
    session.completedAt = new Date();
    await session.save();

    res.json({
      success: true,
      message: 'Session completed and feedback recorded!',
      session,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get My Skill Sessions
// @route   GET /api/skillswap/my-sessions
// @access  Private
const getMySessions = async (req, res, next) => {
  try {
    const asLearner = await SkillSession.find({ learner: req.user._id })
      .populate('mentor', 'name email avatar')
      .sort({ scheduledAt: -1 });

    const asMentor = await SkillSession.find({ mentor: req.user._id })
      .populate('learner', 'name email avatar')
      .sort({ scheduledAt: -1 });

    const completedCount = asMentor.filter(s => s.status === 'completed').length;
    const profile = await StudentProfile.findOne({ user: req.user._id });

    res.json({
      success: true,
      asLearner,
      asMentor,
      stats: {
        sessionsCompleted: completedCount,
        studentsHelped: profile ? profile.sessionsHelpedCount : 0,
        averageRating: profile ? profile.rating : 5.0,
      }
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getSkillMatches,
  searchSkills,
  sendSkillRequest,
  getMySkillRequests,
  scheduleSession,
  completeSession,
  getMySessions,
};
