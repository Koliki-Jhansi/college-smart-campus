const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');
const FacultyProfile = require('../models/FacultyProfile');
const Project = require('../models/Project');
const ProjectJoinRequest = require('../models/ProjectJoinRequest');
const SkillSession = require('../models/SkillSession');
const SkillRequest = require('../models/SkillRequest');
const StudyGroup = require('../models/StudyGroup');
const StudyResource = require('../models/StudyResource');
const ResourceBooking = require('../models/ResourceBooking');
const Complaint = require('../models/Complaint');
const LostFoundItem = require('../models/LostFoundItem');
const CampusEvent = require('../models/CampusEvent');
const EventRegistration = require('../models/EventRegistration');
const Club = require('../models/Club');
const ClubMember = require('../models/ClubMember');
const BusRoute = require('../models/BusRoute');
const Bus = require('../models/Bus');
const TransportIssue = require('../models/TransportIssue');
const Suggestion = require('../models/Suggestion');
const Connection = require('../models/Connection');
const Notification = require('../models/Notification');
const SystemConfig = require('../models/SystemConfig');
const { convertToCSV } = require('../utils/exportHelper');

// @desc    Get Real Role-Specific Dashboard Metrics
// @route   GET /api/analytics/dashboard
// @access  Private
const getDashboardData = async (req, res, next) => {
  try {
    const user = req.user;
    const userId = user._id;

    if (user.role === 'student') {
      const studentProfile = await StudentProfile.findOne({ user: userId });

      // 1. Profile Completion Percentage calculation
      let profileScore = 40; // Base: Registered with account & academic details
      if (studentProfile) {
        if (studentProfile.bio && studentProfile.bio.length > 10) profileScore += 10;
        if (studentProfile.skills && studentProfile.skills.length > 0) profileScore += 15;
        if (studentProfile.skillsWanted && studentProfile.skillsWanted.length > 0) profileScore += 10;
        if (studentProfile.github || studentProfile.linkedin || studentProfile.portfolio) profileScore += 15;
        if (user.avatar) profileScore += 10;
      }
      profileScore = Math.min(100, profileScore);

      // 2. Real MongoDB counts for Student
      const myProjectsCount = await Project.countDocuments({
        $or: [{ createdBy: userId }, { 'members.user': userId }]
      });

      const projectInvitationsCount = await ProjectJoinRequest.countDocuments({
        project: { $in: await Project.find({ createdBy: userId }).distinct('_id') },
        status: 'pending'
      });

      const upcomingSessionsCount = await SkillSession.countDocuments({
        $or: [{ mentor: userId }, { learner: userId }],
        status: 'scheduled',
        scheduledAt: { $gte: new Date() }
      });

      const myStudyGroupsCount = await StudyGroup.countDocuments({
        $or: [{ creator: userId }, { members: userId }]
      });

      const myEventsCount = await EventRegistration.countDocuments({
        user: userId,
        status: { $in: ['registered', 'attended'] }
      });

      const activeBookingsCount = await ResourceBooking.countDocuments({
        user: userId,
        status: { $in: ['approved', 'pending'] },
        endDateTime: { $gte: new Date() }
      });

      const myComplaintsCount = await Complaint.countDocuments({
        reportedBy: userId,
        status: { $nin: ['Closed', 'Rejected'] }
      });

      const lostFoundMatchesCount = await LostFoundItem.countDocuments({
        createdBy: userId,
        status: 'Possible Match'
      });

      const connectionsCount = await Connection.countDocuments({
        $or: [{ requester: userId }, { recipient: userId }],
        status: 'accepted'
      });

      // Recent Activity & Notifications
      const recentNotifications = await Notification.find({ recipient: userId })
        .sort({ createdAt: -1 })
        .limit(5);

      const recentBookings = await ResourceBooking.find({ user: userId })
        .populate('resource')
        .sort({ createdAt: -1 })
        .limit(3);

      const recentProjects = await Project.find({
        $or: [{ createdBy: userId }, { 'members.user': userId }]
      }).sort({ updatedAt: -1 }).limit(3);

      const upcomingEvents = await CampusEvent.find({ startDate: { $gte: new Date() } })
        .sort({ startDate: 1 })
        .limit(3);

      return res.json({
        success: true,
        role: 'student',
        metrics: {
          profileCompletion: profileScore,
          myProjects: myProjectsCount,
          projectInvitations: projectInvitationsCount,
          upcomingSessions: upcomingSessionsCount,
          myStudyGroups: myStudyGroupsCount,
          myEvents: myEventsCount,
          activeBookings: activeBookingsCount,
          myComplaints: myComplaintsCount,
          lostFoundMatches: lostFoundMatchesCount,
          connections: connectionsCount,
        },
        data: {
          recentNotifications,
          recentBookings,
          recentProjects,
          upcomingEvents,
          profile: studentProfile,
        }
      });
    }

    if (user.role === 'faculty') {
      const facultyProfile = await FacultyProfile.findOne({ user: userId });

      const mentoredProjectsCount = await Project.countDocuments({ mentor: userId });
      const pendingProjectMentorRequests = await Project.countDocuments({ mentor: userId, status: 'Recruiting' });
      const sharedResourcesCount = await StudyResource.countDocuments({ uploadedBy: userId });
      const myStudyGroupsCount = await StudyGroup.countDocuments({
        $or: [{ creator: userId }, { facultyAdvisor: userId }]
      });
      const myBookingsCount = await ResourceBooking.countDocuments({
        user: userId,
        status: { $in: ['approved', 'pending'] }
      });
      const myComplaintsCount = await Complaint.countDocuments({ reportedBy: userId });

      return res.json({
        success: true,
        role: 'faculty',
        metrics: {
          mentoredProjects: mentoredProjectsCount,
          pendingRequests: pendingProjectMentorRequests,
          sharedResources: sharedResourcesCount,
          studyGroups: myStudyGroupsCount,
          resourceBookings: myBookingsCount,
          complaints: myComplaintsCount,
        },
        data: {
          profile: facultyProfile,
        }
      });
    }

    if (user.role === 'maintenance_staff') {
      const assignedTicketsCount = await Complaint.countDocuments({
        assignedStaff: userId,
        status: { $nin: ['Resolved', 'Closed', 'Rejected'] }
      });

      const newUnassignedCount = await Complaint.countDocuments({
        status: 'Open',
        assignedStaff: null
      });

      const highPriorityCount = await Complaint.countDocuments({
        priority: { $in: ['High', 'Critical'] },
        status: { $nin: ['Resolved', 'Closed', 'Rejected'] }
      });

      const inProgressCount = await Complaint.countDocuments({
        assignedStaff: userId,
        status: 'In Progress'
      });

      const startOfToday = new Date();
      startOfToday.setHours(0,0,0,0);
      const resolvedTodayCount = await Complaint.countDocuments({
        assignedStaff: userId,
        status: { $in: ['Resolved', 'Closed'] },
        resolvedAt: { $gte: startOfToday }
      });

      const slaBreachedCount = await Complaint.countDocuments({
        assignedStaff: userId,
        slaBreached: true,
        status: { $nin: ['Resolved', 'Closed'] }
      });

      const recentAssigned = await Complaint.find({ assignedStaff: userId })
        .populate('reportedBy', 'name phone')
        .sort({ priority: -1, createdAt: -1 })
        .limit(5);

      return res.json({
        success: true,
        role: 'maintenance_staff',
        metrics: {
          assignedTickets: assignedTicketsCount,
          newTickets: newUnassignedCount,
          highPriority: highPriorityCount,
          inProgress: inProgressCount,
          resolvedToday: resolvedTodayCount,
          slaBreached: slaBreachedCount,
        },
        data: {
          recentAssigned,
        }
      });
    }

    if (user.role === 'club_coordinator') {
      const myClubs = await Club.find({ coordinator: userId });
      const clubIds = myClubs.map(c => c._id);

      const totalMembers = await ClubMember.countDocuments({ club: { $in: clubIds }, status: 'active' });
      const pendingJoinRequests = await ClubMember.countDocuments({ club: { $in: clubIds }, status: 'pending' });
      const myEventsCount = await CampusEvent.countDocuments({ club: { $in: clubIds } });
      const eventRegistrationsCount = await EventRegistration.countDocuments({
        event: { $in: await CampusEvent.find({ club: { $in: clubIds } }).distinct('_id') }
      });

      return res.json({
        success: true,
        role: 'club_coordinator',
        metrics: {
          clubsCount: myClubs.length,
          totalMembers,
          pendingRequests: pendingJoinRequests,
          eventsOrganized: myEventsCount,
          totalRegistrations: eventRegistrationsCount,
        },
        data: {
          myClubs,
        }
      });
    }

    if (user.role === 'transport_staff') {
      const totalBuses = await Bus.countDocuments();
      const activeBuses = await Bus.countDocuments({ status: 'Active' });
      const totalRoutes = await BusRoute.countDocuments({ isActive: true });
      const reportedIssues = await TransportIssue.countDocuments({ status: { $ne: 'Resolved' } });

      return res.json({
        success: true,
        role: 'transport_staff',
        metrics: {
          totalBuses,
          activeBuses,
          totalRoutes,
          reportedIssues,
        }
      });
    }

    if (user.role === 'admin') {
      // Real MongoDB aggregation for Admin Dashboard
      const totalUsers = await User.countDocuments();
      const studentsCount = await User.countDocuments({ role: 'student' });
      const facultyCount = await User.countDocuments({ role: 'faculty' });
      const staffCount = await User.countDocuments({ role: { $in: ['maintenance_staff', 'transport_staff', 'club_coordinator'] } });
      const activeProjects = await Project.countDocuments({ status: { $in: ['Recruiting', 'In Development', 'Testing'] } });
      const totalEvents = await CampusEvent.countDocuments();
      const openComplaints = await Complaint.countDocuments({ status: { $nin: ['Closed', 'Rejected'] } });
      const totalBookings = await ResourceBooking.countDocuments();
      const lostFoundItems = await LostFoundItem.countDocuments();
      const totalClubs = await Club.countDocuments();
      const totalStudyGroups = await StudyGroup.countDocuments();
      const totalResources = await StudyResource.countDocuments();

      // Complaints by Category Aggregation
      const complaintsByCategory = await Complaint.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $project: { category: '$_id', count: 1, _id: 0 } },
        { $sort: { count: -1 } }
      ]);

      // Complaints by Status Aggregation
      const complaintsByStatus = await Complaint.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $project: { status: '$_id', count: 1, _id: 0 } }
      ]);

      // Projects by Category Aggregation
      const projectsByCategory = await Project.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $project: { category: '$_id', count: 1, _id: 0 } }
      ]);

      // Students by Department Aggregation
      const studentsByDepartment = await StudentProfile.aggregate([
        { $group: { _id: '$department', count: { $sum: 1 } } },
        { $project: { department: '$_id', count: 1, _id: 0 } },
        { $sort: { count: -1 } }
      ]);

      const config = await SystemConfig.findOne();

      return res.json({
        success: true,
        role: 'admin',
        collegeSetupCompleted: config ? !!config.collegeSetupCompleted : false,
        config: config || { collegeSetupCompleted: false },
        metrics: {
          totalUsers,
          studentsCount,
          facultyCount,
          staffCount,
          activeProjects,
          totalEvents,
          openComplaints,
          totalBookings,
          lostFoundItems,
          totalClubs,
          totalStudyGroups,
          totalResources,
        },
        charts: {
          complaintsByCategory,
          complaintsByStatus,
          projectsByCategory,
          studentsByDepartment,
        }
      });
    }

    res.json({ success: true, message: 'Dashboard loaded.', metrics: {} });
  } catch (err) {
    next(err);
  }
};

// @desc    Export Data to CSV (Admin)
// @route   GET /api/analytics/export/:type
// @access  Private (Admin)
const exportDataCSV = async (req, res, next) => {
  try {
    const { type } = req.params;
    let data = [];
    let fields = [];

    if (type === 'complaints') {
      const complaints = await Complaint.find().populate('reportedBy', 'name email').populate('assignedStaff', 'name');
      data = complaints.map(c => ({
        TicketNumber: c.ticketNumber,
        Title: c.title,
        Category: c.category,
        Priority: c.priority,
        Status: c.status,
        Location: c.location,
        ReportedBy: c.reportedBy ? c.reportedBy.name : 'Unknown',
        AssignedStaff: c.assignedStaff ? c.assignedStaff.name : 'Unassigned',
        SLABreached: c.slaBreached ? 'Yes' : 'No',
        Rating: c.userRating || 'N/A',
        CreatedAt: c.createdAt.toISOString(),
      }));
      fields = ['TicketNumber', 'Title', 'Category', 'Priority', 'Status', 'Location', 'ReportedBy', 'AssignedStaff', 'SLABreached', 'Rating', 'CreatedAt'];
    } else if (type === 'users') {
      const users = await User.find().select('-password');
      data = users.map(u => ({
        Name: u.name,
        Email: u.email,
        Role: u.role,
        IsApproved: u.isApproved ? 'Yes' : 'No',
        IsActive: u.isActive ? 'Yes' : 'No',
        CreatedAt: u.createdAt.toISOString(),
      }));
      fields = ['Name', 'Email', 'Role', 'IsApproved', 'IsActive', 'CreatedAt'];
    } else if (type === 'events') {
      const events = await CampusEvent.find().populate('organizer', 'name');
      data = events.map(e => ({
        Title: e.title,
        Category: e.category,
        Venue: e.venue,
        StartDate: e.startDate.toISOString(),
        MaxParticipants: e.maxParticipants,
        Organizer: e.organizer ? e.organizer.name : 'Unknown',
      }));
      fields = ['Title', 'Category', 'Venue', 'StartDate', 'MaxParticipants', 'Organizer'];
    } else if (type === 'bookings') {
      const bookings = await ResourceBooking.find().populate('resource', 'name category').populate('user', 'name');
      data = bookings.map(b => ({
        Reference: b.bookingReference,
        Resource: b.resource ? b.resource.name : 'Unknown',
        Category: b.resource ? b.resource.category : 'N/A',
        User: b.user ? b.user.name : 'Unknown',
        Date: b.bookingDate.toISOString().slice(0, 10),
        Time: `${b.startTime} - ${b.endTime}`,
        Status: b.status,
        Purpose: b.purpose,
      }));
      fields = ['Reference', 'Resource', 'Category', 'User', 'Date', 'Time', 'Status', 'Purpose'];
    } else {
      return res.status(400).json({ success: false, message: 'Invalid export type.' });
    }

    const csv = convertToCSV(data, fields);
    res.header('Content-Type', 'text/csv');
    res.attachment(`CollegeHub_${type}_export_${Date.now()}.csv`);
    return res.send(csv);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getDashboardData,
  exportDataCSV,
};
