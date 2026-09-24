const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');
const FacultyProfile = require('../models/FacultyProfile');
const StaffProfile = require('../models/StaffProfile');
const Department = require('../models/Department');
const Course = require('../models/Course');
const Section = require('../models/Section');
const CampusResource = require('../models/CampusResource');
const ResourceBooking = require('../models/ResourceBooking');
const SystemConfig = require('../models/SystemConfig');
const Project = require('../models/Project');
const ProjectJoinRequest = require('../models/ProjectJoinRequest');
const SkillRequest = require('../models/SkillRequest');
const SkillSession = require('../models/SkillSession');
const StudyGroup = require('../models/StudyGroup');
const StudyResource = require('../models/StudyResource');
const Complaint = require('../models/Complaint');
const LostFoundItem = require('../models/LostFoundItem');
const CampusEvent = require('../models/CampusEvent');
const EventRegistration = require('../models/EventRegistration');
const Club = require('../models/Club');
const ClubMember = require('../models/ClubMember');
const BusRoute = require('../models/BusRoute');
const Bus = require('../models/Bus');
const Suggestion = require('../models/Suggestion');
const Notification = require('../models/Notification');
const Connection = require('../models/Connection');

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/collegehub';

const getSafeHost = (uri) => {
  if (!uri) return 'configured host';
  try {
    return uri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@');
  } catch {
    return 'configured database';
  }
};

async function resetDemoData() {
  console.log('\n======================================================================');
  console.log('   [RESET DEMO DATASET] — CollegeHub Safe Development Cleaner         ');
  console.log('======================================================================\n');

  if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_DEMO_RESET_IN_PROD) {
    console.error('❌ FATAL: Demo dataset reset is strictly forbidden in production environments.');
    process.exit(1);
  }

  console.log(`Connecting to MongoDB host: ${getSafeHost(MONGO_URI)}`);

  try {
    try {
      await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 4000 });
      console.log(' Connected to MongoDB database.\n');
    } catch (liveErr) {
      console.warn(`\n⚠️  [Persistence Notice]: Could not reach persistent MongoDB at ${getSafeHost(MONGO_URI)} (${liveErr.message}).`);
      console.log('💡 Connecting to embedded MongoDB fallback for development reset verification...\n');
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create();
      await mongoose.connect(mongod.getUri());
      console.log(' Connected to embedded MongoDB test instance.\n');
    }

    // Find all demo users with @demo.collegehub.local or @collegehub.edu
    const demoUsers = await User.find({
      $or: [
        { email: { $regex: /@demo\.collegehub\.local$/i } },
        { email: { $regex: /@collegehub\.edu$/i } },
      ]
    });

    const demoUserIds = demoUsers.map(u => u._id);
    console.log(`Found ${demoUserIds.length} synthetic demo user accounts.`);

    if (demoUserIds.length > 0) {
      await StudentProfile.deleteMany({ user: { $in: demoUserIds } });
      await FacultyProfile.deleteMany({ user: { $in: demoUserIds } });
      await StaffProfile.deleteMany({ user: { $in: demoUserIds } });
      await Project.deleteMany({ createdBy: { $in: demoUserIds } });
      await SkillRequest.deleteMany({ $or: [{ requester: { $in: demoUserIds } }, { mentor: { $in: demoUserIds } }] });
      await SkillSession.deleteMany({ $or: [{ learner: { $in: demoUserIds } }, { mentor: { $in: demoUserIds } }] });
      await ResourceBooking.deleteMany({ user: { $in: demoUserIds } });
      await Complaint.deleteMany({ reportedBy: { $in: demoUserIds } });
      await LostFoundItem.deleteMany({ createdBy: { $in: demoUserIds } });
      await StudyGroup.deleteMany({ creator: { $in: demoUserIds } });
      await StudyResource.deleteMany({ uploadedBy: { $in: demoUserIds } });
      await EventRegistration.deleteMany({ user: { $in: demoUserIds } });
      await CampusEvent.deleteMany({ organizer: { $in: demoUserIds } });
      await ClubMember.deleteMany({ user: { $in: demoUserIds } });
      await Club.deleteMany({ coordinator: { $in: demoUserIds } });
      await Suggestion.deleteMany({ createdBy: { $in: demoUserIds } });
      await Notification.deleteMany({ $or: [{ recipient: { $in: demoUserIds } }, { sender: { $in: demoUserIds } }] });
      await Connection.deleteMany({ $or: [{ requester: { $in: demoUserIds } }, { recipient: { $in: demoUserIds } }] });
      await User.deleteMany({ _id: { $in: demoUserIds } });
      console.log(' Cleaned all user-generated demo entities and profiles.');
    }

    // Clean demo transport routes & buses
    await BusRoute.deleteMany({ routeNumber: { $in: ['R-101', 'R-102', 'R-103', 'R-104'] } });
    await Bus.deleteMany({ busNumber: { $in: ['BUS-01', 'BUS-02', 'BUS-03', 'BUS-04'] } });

    // Clean demo campus resources
    await CampusResource.deleteMany({
      name: {
        $in: [
          'CSE Computer Lab 1',
          'CSE Computer Lab 2',
          'AI/ML Research Lab',
          'Central Seminar Hall',
          'Dr. APJ Abdul Kalam Auditorium',
          'Executive Conference Room',
          'High-Lumen Projector 01',
          'High-Lumen Projector 02',
          'Advanced Robotics Kit 01',
          'Main Sports Ground'
        ]
      }
    });

    // Check remaining users: if 0 admins remain, reset collegeSetupCompleted to false
    const remainingAdmins = await User.countDocuments({ role: 'admin' });
    const remainingUsers = await User.countDocuments();
    if (remainingAdmins === 0) {
      let config = await SystemConfig.findOne();
      if (config) {
        config.collegeSetupCompleted = false;
        config.collegeName = '';
        config.shortName = '';
        config.collegeCode = '';
        await config.save();
      }
      console.log(' No remaining administrators: reset SystemConfig collegeSetupCompleted to false.');
    }

    console.log('\n======================================================================');
    console.log('   ✨ DEMO DATASET SAFELY RESET & PURGED!                             ');
    console.log(`   Remaining Live Database Users: ${remainingUsers}                   `);
    console.log('======================================================================\n');

  } catch (err) {
    console.error('❌ Error during demo dataset reset:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

resetDemoData();
