const StudyGroup = require('../models/StudyGroup');
const Conversation = require('../models/Conversation');
const { sendNotificationToUser } = require('../sockets/socketHandler');

// @desc    Get all study groups
// @route   GET /api/study-groups
// @access  Private
const getStudyGroups = async (req, res, next) => {
  try {
    const { department, semester, search } = req.query;
    const query = {};

    if (department && department !== 'All') {
      query.department = department;
    }
    if (semester && semester !== 'All') {
      query.semester = Number(semester);
    }
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [{ name: searchRegex }, { subject: searchRegex }, { description: searchRegex }];
    }

    const groups = await StudyGroup.find(query)
      .populate('creator', 'name email avatar')
      .populate('facultyAdvisor', 'name designation')
      .populate('members', 'name avatar')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: groups.length, groups });
  } catch (err) {
    next(err);
  }
};

// @desc    Get My Study Groups
// @route   GET /api/study-groups/my
// @access  Private
const getMyStudyGroups = async (req, res, next) => {
  try {
    const groups = await StudyGroup.find({
      $or: [
        { creator: req.user._id },
        { members: req.user._id },
        { facultyAdvisor: req.user._id }
      ]
    })
      .populate('creator', 'name avatar')
      .populate('members', 'name avatar')
      .sort({ updatedAt: -1 });

    res.json({ success: true, count: groups.length, groups });
  } catch (err) {
    next(err);
  }
};

// @desc    Create Study Group
// @route   POST /api/study-groups
// @access  Private
const createStudyGroup = async (req, res, next) => {
  try {
    const {
      name,
      subject,
      description,
      department = 'All',
      semester = 1,
      maxMembers = 10,
      isPrivate = false,
      scheduleInfo,
      meetingLink,
    } = req.body;

    if (!name || !subject) {
      return res.status(400).json({ success: false, message: 'Group name and subject are required.' });
    }

    const group = await StudyGroup.create({
      name: name.trim(),
      subject: subject.trim(),
      description: description || '',
      department,
      semester: Number(semester),
      maxMembers: Number(maxMembers),
      isPrivate: Boolean(isPrivate),
      scheduleInfo: scheduleInfo || '',
      meetingLink: meetingLink || '',
      creator: req.user._id,
      members: [req.user._id],
    });

    // Create chat room for study group
    await Conversation.create({
      type: 'study_group',
      participants: [req.user._id],
      referenceId: group._id,
      title: `${group.name} Discussion`,
    });

    res.status(201).json({
      success: true,
      message: 'Study group created successfully!',
      group,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Join Study Group
// @route   POST /api/study-groups/:id/join
// @access  Private
const joinStudyGroup = async (req, res, next) => {
  try {
    const group = await StudyGroup.findById(req.params.id);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Study group not found.' });
    }

    if (group.members.includes(req.user._id)) {
      return res.status(400).json({ success: false, message: 'You are already a member of this group.' });
    }

    if (group.members.length >= group.maxMembers) {
      return res.status(400).json({ success: false, message: 'This study group is already at full capacity.' });
    }

    group.members.push(req.user._id);
    await group.save();

    // Add to conversation room
    await Conversation.findOneAndUpdate(
      { type: 'study_group', referenceId: group._id },
      { $addToSet: { participants: req.user._id } }
    );

    // Notify Group Creator
    await sendNotificationToUser(group.creator, {
      sender: req.user._id,
      title: 'New Study Group Member',
      message: `${req.user.name} joined your study group "${group.name}".`,
      type: 'general',
      link: `/study-hub`,
    });

    res.json({ success: true, message: 'Joined study group successfully!', group });
  } catch (err) {
    next(err);
  }
};

// @desc    Leave Study Group
// @route   POST /api/study-groups/:id/leave
// @access  Private
const leaveStudyGroup = async (req, res, next) => {
  try {
    const group = await StudyGroup.findById(req.params.id);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Study group not found.' });
    }

    if (String(group.creator) === String(req.user._id)) {
      return res.status(400).json({ success: false, message: 'Creator cannot leave group. Transfer or delete instead.' });
    }

    group.members = group.members.filter(m => String(m) !== String(req.user._id));
    await group.save();

    await Conversation.findOneAndUpdate(
      { type: 'study_group', referenceId: group._id },
      { $pull: { participants: req.user._id } }
    );

    res.json({ success: true, message: 'Left study group.' });
  } catch (err) {
    next(err);
  }
};

// @desc    Add Shared Resource / Link to Study Group
// @route   POST /api/study-groups/:id/resources
// @access  Private
const addGroupResource = async (req, res, next) => {
  try {
    const { title, url } = req.body;
    if (!title || !url) {
      return res.status(400).json({ success: false, message: 'Title and URL are required.' });
    }

    const group = await StudyGroup.findById(req.params.id);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Study group not found.' });
    }

    group.resources.push({
      title,
      url,
      addedBy: req.user._id,
      addedAt: new Date(),
    });

    await group.save();

    res.status(201).json({ success: true, message: 'Resource added to study group.', group });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getStudyGroups,
  getMyStudyGroups,
  createStudyGroup,
  joinStudyGroup,
  leaveStudyGroup,
  addGroupResource,
};
