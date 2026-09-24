const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');
const Project = require('../models/Project');
const StudyGroup = require('../models/StudyGroup');
const StudyResource = require('../models/StudyResource');
const CampusEvent = require('../models/CampusEvent');
const Club = require('../models/Club');
const LostFoundItem = require('../models/LostFoundItem');

// @desc    Global unified search
// @route   GET /api/search
// @access  Private
const globalSearch = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 2) {
      return res.json({
        success: true,
        results: {
          students: [],
          projects: [],
          resources: [],
          events: [],
          clubs: [],
          studyGroups: [],
          lostItems: [],
        },
      });
    }

    const query = q.trim();
    const regex = new RegExp(query, 'i');

    // 1. Search Students
    const studentProfiles = await StudentProfile.find({
      isPublic: true,
      $or: [
        { skills: regex },
        { skillsWanted: regex },
        { interests: regex },
        { collegeId: regex },
        { department: regex },
      ]
    }).populate('user', 'name email avatar').limit(6);

    const matchedUsers = await User.find({
      role: 'student',
      name: regex,
      _id: { $nin: studentProfiles.map(sp => sp.user ? sp.user._id : null) }
    }).limit(4);

    const userStudentProfiles = await StudentProfile.find({
      user: { $in: matchedUsers.map(u => u._id) },
      isPublic: true
    }).populate('user', 'name email avatar');

    const allStudents = [...studentProfiles, ...userStudentProfiles];

    // 2. Search Projects
    const projects = await Project.find({
      $or: [
        { title: regex },
        { description: regex },
        { technologies: regex },
        { requiredSkills: regex },
        { category: regex }
      ]
    }).populate('createdBy', 'name avatar').limit(6);

    // 3. Search Resources
    const resources = await StudyResource.find({
      isReported: false,
      $or: [
        { title: regex },
        { subject: regex },
        { department: regex },
        { tags: regex }
      ]
    }).populate('uploadedBy', 'name avatar').limit(6);

    // 4. Search Events
    const events = await CampusEvent.find({
      isPublished: true,
      $or: [
        { title: regex },
        { description: regex },
        { category: regex },
        { venue: regex }
      ]
    }).limit(6);

    // 5. Search Clubs
    const clubs = await Club.find({
      isActive: true,
      $or: [
        { name: regex },
        { code: regex },
        { description: regex },
        { category: regex }
      ]
    }).limit(6);

    // 6. Search Study Groups
    const studyGroups = await StudyGroup.find({
      isPrivate: false,
      $or: [
        { name: regex },
        { subject: regex },
        { department: regex }
      ]
    }).populate('creator', 'name avatar').limit(6);

    // 7. Search Lost & Found Items
    const lostItems = await LostFoundItem.find({
      status: { $ne: 'Closed' },
      $or: [
        { title: regex },
        { description: regex },
        { location: regex },
        { category: regex },
        { brand: regex }
      ]
    }).limit(6);

    res.json({
      success: true,
      query,
      results: {
        students: allStudents,
        projects,
        resources,
        events,
        clubs,
        studyGroups,
        lostItems,
      },
      totalMatches: allStudents.length + projects.length + resources.length + events.length + clubs.length + studyGroups.length + lostItems.length,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  globalSearch,
};
