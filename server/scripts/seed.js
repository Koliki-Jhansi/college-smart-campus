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
const SystemConfig = require('../models/SystemConfig');
const Project = require('../models/Project');
const CampusEvent = require('../models/CampusEvent');
const StudyGroup = require('../models/StudyGroup');
const Complaint = require('../models/Complaint');
const Club = require('../models/Club');
const BusRoute = require('../models/BusRoute');
const Bus = require('../models/Bus');

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/collegehub';

const getSafeHost = (uri) => {
  if (!uri) return 'configured host';
  try {
    return uri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@');
  } catch {
    return 'configured database';
  }
};

async function seedDemoData() {
  console.log('\n======================================================');
  console.log('   [DEVELOPMENT DEMO DATA] — Optional Test Seeder   ');
  console.log('======================================================\n');
  console.log('Connecting to MongoDB host:', getSafeHost(MONGO_URI));

  try {
    await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 4000 });
    console.log(' Connected to MongoDB database.\n');

    // 1. College Configuration
    let config = await SystemConfig.findOne();
    if (!config) {
      config = new SystemConfig();
    }
    config.collegeName = 'Apex Institute of Technology & Science';
    config.shortName = 'AITS';
    config.collegeCode = 'AITS-TECH';
    config.address = 'Knowledge Boulevard, Tech Corridor';
    config.city = 'Silicon City';
    config.state = 'Karnataka';
    config.website = 'https://aits.edu.in';
    config.contactEmail = 'admin@aits.edu.in';
    config.phone = '+91 9876543210';
    config.currentAcademicYear = '2026-2027';
    config.collegeSetupCompleted = true;
    await config.save();
    console.log('[DEVELOPMENT DEMO DATA] Created/Updated College Configuration.');

    // 2. Departments
    const deptData = [
      { name: 'Computer Science & Engineering', code: 'CSE', description: 'Department of Computer Science and Software Engineering' },
      { name: 'Electronics & Communication Engineering', code: 'ECE', description: 'Department of Electronics and VLSI Design' },
    ];

    const depts = [];
    for (const d of deptData) {
      let dept = await Department.findOne({ code: d.code });
      if (!dept) {
        dept = await Department.create({ ...d, isActive: true });
      }
      depts.push(dept);
    }
    console.log(`[DEVELOPMENT DEMO DATA] Seeded ${depts.length} Departments.`);

    // 3. Programs / Courses
    const courseData = [
      { name: 'B.Tech in Computer Science', code: 'BTECH-CSE', department: depts[0]._id, degreeType: 'B.Tech', duration: '4 Years', totalSemesters: 8, isActive: true },
      { name: 'B.Tech in Electronics & Communication', code: 'BTECH-ECE', department: depts[1]._id, degreeType: 'B.Tech', duration: '4 Years', totalSemesters: 8, isActive: true },
    ];

    const courses = [];
    for (const c of courseData) {
      let course = await Course.findOne({ code: c.code });
      if (!course) {
        course = await Course.create(c);
      }
      courses.push(course);
    }
    console.log(`[DEVELOPMENT DEMO DATA] Seeded ${courses.length} Degree Programs.`);

    // 4. Sections
    const sectionData = [
      { department: depts[0]._id, course: courses[0]._id, year: 3, semester: 6, sectionName: 'A', roomNumber: 'CS-Lab-301' },
      { department: depts[0]._id, course: courses[0]._id, year: 3, semester: 6, sectionName: 'B', roomNumber: 'CS-Lab-302' },
    ];
    for (const s of sectionData) {
      const exists = await Section.findOne({ department: s.department, course: s.course, year: s.year, semester: s.semester, sectionName: s.sectionName });
      if (!exists) {
        await Section.create(s);
      }
    }
    console.log('[DEVELOPMENT DEMO DATA] Seeded Academic Sections.');

    // 5. Campus Resources / Facilities
    const resources = [
      { name: 'AI & Robotics Research Lab', code: 'LAB-AI-01', category: 'Lab', building: 'Tech Block A', block: 'Floor 3', roomNumber: '304', capacity: 45, isAvailable: true },
      { name: 'Dr. APJ Abdul Kalam Auditorium', code: 'AUD-MAIN', category: 'Auditorium', building: 'Main Administrative Block', block: 'Ground Floor', roomNumber: 'AUD-1', capacity: 500, isAvailable: true },
    ];
    for (const r of resources) {
      const exists = await CampusResource.findOne({ code: r.code });
      if (!exists) {
        await CampusResource.create(r);
      }
    }
    console.log('[DEVELOPMENT DEMO DATA] Seeded Campus Resources.');

    // 6. Master Admin
    let admin = await User.findOne({ email: 'admin@collegehub.edu' });
    if (!admin) {
      admin = await User.create({
        name: 'Master Campus Admin',
        email: 'admin@collegehub.edu',
        password: 'Password@123',
        role: 'admin',
        isVerified: true,
      });
      console.log('[DEVELOPMENT DEMO DATA] Created Admin: admin@collegehub.edu / Password@123');
    }

    // 7. Faculty Members (2)
    const facultyList = [
      { name: 'Dr. Ramesh Kumar', email: 'ramesh.cse@collegehub.edu', dept: depts[0]._id, desig: 'Professor & HOD', empId: 'EMP-FAC-01', spec: ['AI', 'Cloud Computing'] },
      { name: 'Prof. Ananya Sen', email: 'ananya.ece@collegehub.edu', dept: depts[1]._id, desig: 'Associate Professor', empId: 'EMP-FAC-02', spec: ['VLSI', 'Embedded Systems'] },
    ];

    for (const f of facultyList) {
      let u = await User.findOne({ email: f.email });
      if (!u) {
        u = await User.create({ name: f.name, email: f.email, password: 'Password@123', role: 'faculty', isVerified: true });
        await FacultyProfile.create({
          user: u._id,
          employeeId: f.empId,
          department: f.dept,
          designation: f.desig,
          specialization: f.spec,
          cabinNumber: 'Faculty Block Room 204',
          officeHours: 'Mon-Thu 2PM-4PM'
        });
      }
    }
    console.log('[DEVELOPMENT DEMO DATA] Seeded 2 Faculty Accounts.');

    // 8. Staff Accounts (Maintenance, Club Coordinator, Transport)
    const staffList = [
      { name: 'Suresh Verma (Campus Ops)', email: 'suresh.maint@collegehub.edu', role: 'maintenance_staff', type: 'maintenance', empId: 'EMP-MNT-01' },
      { name: 'Priya Nair (Club Lead)', email: 'priya.clubs@collegehub.edu', role: 'club_coordinator', type: 'general', empId: 'EMP-CLB-01' },
      { name: 'Rajesh Transport (Fleet)', email: 'rajesh.transit@collegehub.edu', role: 'transport_staff', type: 'transport', empId: 'EMP-TRN-01' },
    ];

    const createdStaff = [];
    for (const s of staffList) {
      let u = await User.findOne({ email: s.email });
      if (!u) {
        u = await User.create({ name: s.name, email: s.email, password: 'Password@123', role: s.role, isVerified: true });
        await StaffProfile.create({ user: u._id, employeeId: s.empId, staffType: s.type, shift: 'General (8:30 AM - 5:00 PM)' });
      }
      createdStaff.push(u);
    }
    console.log('[DEVELOPMENT DEMO DATA] Seeded Maintenance, Club Coordinator, and Transport Staff.');

    // 9. Students (5)
    const studentList = [
      { name: 'Aarav Sharma', email: 'aarav.student@collegehub.edu', roll: '23CS001', dept: depts[0]._id, course: courses[0]._id, year: 3, sem: 6, sec: 'A', skills: ['React', 'Node.js', 'Python'] },
      { name: 'Sneha Patel', email: 'sneha.student@collegehub.edu', roll: '23CS002', dept: depts[0]._id, course: courses[0]._id, year: 3, sem: 6, sec: 'A', skills: ['UI/UX Design', 'Figma', 'Tailwind'] },
      { name: 'Rohan Gupta', email: 'rohan.student@collegehub.edu', roll: '23CS003', dept: depts[0]._id, course: courses[0]._id, year: 3, sem: 6, sec: 'B', skills: ['Machine Learning', 'TensorFlow', 'Python'] },
      { name: 'Diya Krishnan', email: 'diya.student@collegehub.edu', roll: '23EC001', dept: depts[1]._id, course: courses[1]._id, year: 3, sem: 6, sec: 'A', skills: ['Verilog', 'IoT', 'C++'] },
      { name: 'Vikram Singh', email: 'vikram.student@collegehub.edu', roll: '23EC002', dept: depts[1]._id, course: courses[1]._id, year: 3, sem: 6, sec: 'A', skills: ['Arduino', 'Robotics', 'Python'] },
    ];

    const students = [];
    for (const st of studentList) {
      let u = await User.findOne({ email: st.email });
      if (!u) {
        u = await User.create({ name: st.name, email: st.email, password: 'Password@123', role: 'student', isVerified: true });
        await StudentProfile.create({
          user: u._id,
          collegeId: st.roll,
          department: st.dept,
          course: st.course,
          year: st.year,
          semester: st.sem,
          section: st.sec,
          skills: st.skills,
          bio: `Passionate student enthusiastic about ${st.skills[0]} and campus collaborations.`,
        });
      }
      students.push(u);
    }
    console.log('[DEVELOPMENT DEMO DATA] Seeded 5 Student Accounts.');

    // 10. Sample Student-Generated Data: 1 Project, 1 Event, 1 Complaint, 1 Study Group
    if (students.length > 0) {
      const sampleProj = await Project.findOne({ title: 'Campus IoT Energy Monitor' });
      if (!sampleProj) {
        await Project.create({
          title: 'Campus IoT Energy Monitor',
          description: 'Smart sensor platform to track real-time power and electricity utilization across campus labs.',
          category: 'IoT & Hardware',
          tags: ['IoT', 'Node.js', 'Arduino'],
          rolesNeeded: [{ roleName: 'Frontend Dev', skillsRequired: ['React'], spots: 2, spotsFilled: 1 }],
          createdBy: students[0]._id,
          members: [{ user: students[0]._id, role: 'Lead Developer', joinedAt: new Date() }],
          status: 'Recruiting',
        });
        console.log('[DEVELOPMENT DEMO DATA] Seeded sample collaborative project.');
      }

      const sampleEvent = await CampusEvent.findOne({ title: 'Annual HackSprint 2026' });
      if (!sampleEvent) {
        await CampusEvent.create({
          title: 'Annual HackSprint 2026',
          description: '36-hour flagship hackathon bringing together students to solve campus and societal challenges.',
          category: 'Hackathon',
          organizer: admin._id,
          venue: 'Dr. APJ Abdul Kalam Auditorium',
          startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          endDate: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000),
          registrationDeadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
          maxParticipants: 200,
          status: 'Published',
        });
        console.log('[DEVELOPMENT DEMO DATA] Seeded sample campus event.');
      }

      const sampleComplaint = await Complaint.findOne({ title: 'Wi-Fi Signal Drop in CS Lab 3' });
      if (!sampleComplaint) {
        await Complaint.create({
          ticketNumber: 'CFX-DEMO-001',
          title: 'Wi-Fi Signal Drop in CS Lab 3',
          description: 'Frequent packet loss and connection drops during lab practicals.',
          category: 'Wi-Fi',
          location: 'CS Lab 3, Tech Block A',
          priority: 'High',
          reportedBy: students[0]._id,
          status: 'Open',
        });
        console.log('[DEVELOPMENT DEMO DATA] Seeded sample maintenance ticket.');
      }

      const sampleGroup = await StudyGroup.findOne({ name: 'Algorithms & LeetCode Study Circle' });
      if (!sampleGroup) {
        await StudyGroup.create({
          name: 'Algorithms & LeetCode Study Circle',
          subject: 'Design & Analysis of Algorithms',
          department: 'Computer Science & Engineering',
          semester: 6,
          description: 'Weekly problem solving group for dynamic programming, graph algorithms, and interview prep.',
          createdBy: students[0]._id,
          members: [students[0]._id, students[1]._id],
          maxMembers: 10,
        });
        console.log('[DEVELOPMENT DEMO DATA] Seeded sample study circle.');
      }
    }

    console.log('\n======================================================');
    console.log(' [DEVELOPMENT DEMO DATA] SEED COMPLETED SUCCESSFULLY!');
    console.log(' Default Password for all demo accounts: Password@123');
    console.log('======================================================\n');
  } catch (err) {
    console.error('[DEVELOPMENT DEMO DATA] Error during seeding:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

seedDemoData();
