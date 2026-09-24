const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
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

async function seedDemoData() {
  console.log('\n======================================================================');
  console.log('   [ANDHRA PRADESH DEMO DATASET] — CollegeHub Realistic Test Seeder   ');
  console.log('======================================================================\n');

  if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_DEMO_SEED_IN_PROD) {
    console.error('❌ FATAL: Demo seeding is restricted in production environments.');
    process.exit(1);
  }

  console.log(`Connecting to MongoDB host: ${getSafeHost(MONGO_URI)}`);

  try {
    try {
      await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 4000 });
      console.log(' Connected to MongoDB database.\n');
    } catch (liveErr) {
      console.warn(`\n⚠️  [Persistence Notice]: Could not reach persistent MongoDB at ${getSafeHost(MONGO_URI)} (${liveErr.message}).`);
      console.log('💡 Starting embedded MongoDB instance to verify dataset integrity...');
      console.log('💡 For permanent persistence across computer/server restarts, ensure local MongoDB service is running on port 27017 or set MONGODB_URI in server/.env (e.g. MongoDB Atlas).\n');
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create();
      await mongoose.connect(mongod.getUri());
      console.log(' Connected to embedded MongoDB test instance.\n');
    }

    // -------------------------------------------------------------------------
    // 1. INSTITUTION CONFIGURATION
    // -------------------------------------------------------------------------
    console.log(' [1/17] Configuring Demo Institution Profile...');
    let config = await SystemConfig.findOne();
    if (!config) {
      config = new SystemConfig();
    }
    config.collegeName = 'Andhra Institute of Engineering & Technology';
    config.shortName = 'AIET';
    config.collegeCode = 'AIET-AP';
    config.collegeLogo = '';
    config.address = 'Tech Corridor, Enikepadu';
    config.city = 'Vijayawada';
    config.state = 'Andhra Pradesh';
    config.website = 'https://aiet-ap.demo.collegehub.local';
    config.contactEmail = 'contact@aiet-ap.demo.collegehub.local';
    config.phone = '+91 866 2490000';
    config.currentAcademicYear = '2026-2027';
    config.collegeSetupCompleted = true;
    config.allowPublicRegistration = true;
    config.requireStaffApproval = false;
    await config.save();
    console.log('  Institution Profile configured (AIET, Vijayawada).');

    // -------------------------------------------------------------------------
    // 2. DEPARTMENTS (8)
    // -------------------------------------------------------------------------
    console.log(' [2/17] Seeding 8 Engineering Departments...');
    const departmentDefinitions = [
      { name: 'Computer Science & Engineering', code: 'CSE', description: 'Department of Computer Science & Software Engineering' },
      { name: 'CSE - Artificial Intelligence & Machine Learning', code: 'CSE-AIML', description: 'Specialized Department for AI, Neural Networks & Machine Learning' },
      { name: 'CSE - Data Science', code: 'CSE-DS', description: 'Department of Big Data Analytics, Cloud Processing & Data Mining' },
      { name: 'Electronics & Communication Engineering', code: 'ECE', description: 'Department of VLSI, Embedded Systems, Signal Processing & IoT' },
      { name: 'Electrical & Electronics Engineering', code: 'EEE', description: 'Department of Power Systems, Smart Grids & Electric Vehicles' },
      { name: 'Mechanical Engineering', code: 'ME', description: 'Department of Robotics, Automation, CAD/CAM & Thermal Systems' },
      { name: 'Civil Engineering', code: 'CE', description: 'Department of Structural Engineering, Smart Infrastructure & GIS' },
      { name: 'Information Technology', code: 'IT', description: 'Department of Information Systems, Cloud Architecture & Cybersecurity' },
    ];

    const depts = {};
    for (const def of departmentDefinitions) {
      let dept = await Department.findOne({ code: def.code });
      if (!dept) {
        dept = await Department.create({ ...def, isActive: true });
      }
      depts[def.code] = dept;
    }
    console.log(`  Seeded ${Object.keys(depts).length} active academic departments.`);

    // -------------------------------------------------------------------------
    // 3. DEGREE PROGRAMS (COURSES)
    // -------------------------------------------------------------------------
    console.log(' [3/17] Seeding Degree Programs...');
    const programDefinitions = [
      { name: 'B.Tech in Computer Science & Engineering', code: 'BTECH-CSE', deptCode: 'CSE', duration: '4 Years', totalSemesters: 8 },
      { name: 'B.Tech in CSE (Artificial Intelligence & Machine Learning)', code: 'BTECH-AIML', deptCode: 'CSE-AIML', duration: '4 Years', totalSemesters: 8 },
      { name: 'B.Tech in CSE (Data Science)', code: 'BTECH-DS', deptCode: 'CSE-DS', duration: '4 Years', totalSemesters: 8 },
      { name: 'B.Tech in Electronics & Communication Engineering', code: 'BTECH-ECE', deptCode: 'ECE', duration: '4 Years', totalSemesters: 8 },
      { name: 'B.Tech in Electrical & Electronics Engineering', code: 'BTECH-EEE', deptCode: 'EEE', duration: '4 Years', totalSemesters: 8 },
      { name: 'B.Tech in Mechanical Engineering', code: 'BTECH-ME', deptCode: 'ME', duration: '4 Years', totalSemesters: 8 },
      { name: 'B.Tech in Civil Engineering', code: 'BTECH-CE', deptCode: 'CE', duration: '4 Years', totalSemesters: 8 },
      { name: 'B.Tech in Information Technology', code: 'BTECH-IT', deptCode: 'IT', duration: '4 Years', totalSemesters: 8 },
    ];

    const programs = {};
    for (const prog of programDefinitions) {
      let course = await Course.findOne({ code: prog.code });
      if (!course) {
        course = await Course.create({
          name: prog.name,
          code: prog.code,
          department: depts[prog.deptCode]._id,
          departmentCode: prog.deptCode,
          degreeType: 'B.Tech',
          duration: prog.duration,
          totalSemesters: prog.totalSemesters,
          isActive: true,
        });
      }
      programs[prog.code] = course;
    }
    console.log(`  Seeded ${Object.keys(programs).length} B.Tech degree programs.`);

    // -------------------------------------------------------------------------
    // 4. ACADEMIC SECTIONS
    // -------------------------------------------------------------------------
    console.log(' [4/17] Seeding Academic Sections...');
    const sectionNames = ['A', 'B'];
    for (const code of Object.keys(depts)) {
      for (let yr = 1; yr <= 4; yr++) {
        const sem = yr * 2;
        for (const secName of sectionNames) {
          const exists = await Section.findOne({
            department: depts[code]._id,
            semester: sem,
            name: `${code}-${yr}${secName}`
          });
          if (!exists) {
            await Section.create({
              name: `${code}-${yr}${secName}`,
              department: depts[code]._id,
              semester: sem,
              maxStudents: 60,
            });
          }
        }
      }
    }
    console.log('  Academic Sections configured.');

    // -------------------------------------------------------------------------
    // 5. MASTER ADMIN USER
    // -------------------------------------------------------------------------
    console.log(' [5/17] Creating Master Admin Account...');
    const demoPassword = 'password123';
    let admin = await User.findOne({ email: 'admin@demo.collegehub.local' });
    if (!admin) {
      admin = await User.create({
        name: 'Campus Administrator',
        email: 'admin@demo.collegehub.local',
        password: demoPassword,
        role: 'admin',
        phone: '+91 9800000001',
        isApproved: true,
        isActive: true,
      });
    }
    console.log('  Admin: admin@demo.collegehub.local / password123');

    // -------------------------------------------------------------------------
    // 6. FACULTY ACCOUNTS (8)
    // -------------------------------------------------------------------------
    console.log(' [6/17] Seeding 8 Department Faculty Members...');
    const facultyData = [
      { name: 'Dr. K. S. Murthy', email: 'faculty.cse1@demo.collegehub.local', deptCode: 'CSE', empId: 'DEMO-FAC-CSE-001', desig: 'Professor & HOD', spec: ['Distributed Systems', 'Cloud Computing', 'AI'], cabin: 'CSE Block Room 301', bio: 'Senior professor with 18 years of research in distributed computing and web engineering.' },
      { name: 'Dr. P. Radhika', email: 'faculty.aiml1@demo.collegehub.local', deptCode: 'CSE-AIML', empId: 'DEMO-FAC-AIML-001', desig: 'Associate Professor', spec: ['Deep Learning', 'Computer Vision', 'NLP'], cabin: 'AI Block Room 204', bio: 'AI researcher leading projects in computer vision and assistive technologies.' },
      { name: 'Dr. M. Sitarama Raju', email: 'faculty.ds1@demo.collegehub.local', deptCode: 'CSE-DS', empId: 'DEMO-FAC-DS-001', desig: 'Professor', spec: ['Big Data Analytics', 'Data Mining', 'Predictive Modeling'], cabin: 'DS Block Room 202', bio: 'Published author in big data processing and automated predictive analytics.' },
      { name: 'Dr. Ch. Venkat Rao', email: 'faculty.ece1@demo.collegehub.local', deptCode: 'ECE', empId: 'DEMO-FAC-ECE-001', desig: 'Professor & HOD', spec: ['VLSI Design', 'Embedded Systems', 'IoT'], cabin: 'ECE Block Room 105', bio: 'Specialist in semiconductor design, embedded IoT architectures and hardware prototypes.' },
      { name: 'Dr. S. Lakshmi Narayana', email: 'faculty.eee1@demo.collegehub.local', deptCode: 'EEE', empId: 'DEMO-FAC-EEE-001', desig: 'Associate Professor', spec: ['Smart Grids', 'Power Electronics', 'Renewables'], cabin: 'EEE Block Room 102', bio: 'Expertise in micro-grids, renewable integration and electric vehicle charging telemetry.' },
      { name: 'Dr. V. Prasad', email: 'faculty.me1@demo.collegehub.local', deptCode: 'ME', empId: 'DEMO-FAC-ME-001', desig: 'Professor', spec: ['Robotics & Automation', 'Thermodynamics', 'Mechatronics'], cabin: 'Mech Block Room 101', bio: 'Lead mentor for campus robotics club and autonomous mobile robotics initiatives.' },
      { name: 'Dr. T. Srinivas', email: 'faculty.ce1@demo.collegehub.local', deptCode: 'CE', empId: 'DEMO-FAC-CE-001', desig: 'Professor', spec: ['Structural Engineering', 'GIS Mapping', 'Smart Cities'], cabin: 'Civil Block Room 103', bio: 'Consultant on urban resilience, structural analysis and GIS environmental mapping.' },
      { name: 'Dr. G. Bhavani', email: 'faculty.it1@demo.collegehub.local', deptCode: 'IT', empId: 'DEMO-FAC-IT-001', desig: 'Associate Professor', spec: ['Cybersecurity', 'Full Stack Development', 'DevOps'], cabin: 'IT Block Room 201', bio: 'Mentoring students in cloud-native platforms, web security and competitive hackathons.' },
    ];

    const facultyUsers = {};
    for (const f of facultyData) {
      let u = await User.findOne({ email: f.email });
      if (!u) {
        u = await User.create({
          name: f.name,
          email: f.email,
          password: demoPassword,
          role: 'faculty',
          isApproved: true,
          isActive: true,
        });
        await FacultyProfile.create({
          user: u._id,
          employeeId: f.empId,
          department: depts[f.deptCode].name,
          designation: f.desig,
          cabinLocation: f.cabin,
          researchInterests: f.spec,
          bio: f.bio,
        });
      }
      facultyUsers[f.deptCode] = u;
    }
    console.log(`  Seeded ${Object.keys(facultyUsers).length} faculty accounts.`);

    // -------------------------------------------------------------------------
    // 7. STAFF ACCOUNTS (3 Maintenance, 2 Transport, 2 Club Coordinators)
    // -------------------------------------------------------------------------
    console.log(' [7/17] Seeding Operational Staff & Club Coordinators...');
    const staffData = [
      { name: 'Siddharth Varma', email: 'coord.coding@demo.collegehub.local', role: 'club_coordinator', type: 'general', empId: 'EMP-CLB-001', dept: 'Student Activities' },
      { name: 'Lavanya K', email: 'coord.events@demo.collegehub.local', role: 'club_coordinator', type: 'general', empId: 'EMP-CLB-002', dept: 'Cultural Affairs' },
      { name: 'R. Govind (IT & Electrical)', email: 'staff.maint1@demo.collegehub.local', role: 'maintenance_staff', type: 'maintenance', empId: 'EMP-MNT-001', dept: 'Electrical & IT Maintenance' },
      { name: 'M. Satyanarayana (Civil & Campus)', email: 'staff.maint2@demo.collegehub.local', role: 'maintenance_staff', type: 'maintenance', empId: 'EMP-MNT-002', dept: 'Civil & Facilities' },
      { name: 'B. Rambabu (Labs & Plumbing)', email: 'staff.maint3@demo.collegehub.local', role: 'maintenance_staff', type: 'maintenance', empId: 'EMP-MNT-003', dept: 'Labs & Campus Plumbing' },
      { name: 'K. Nageswara Rao', email: 'staff.trans1@demo.collegehub.local', role: 'transport_staff', type: 'transport', empId: 'EMP-TRN-001', dept: 'Fleet Operations' },
      { name: 'Y. Appa Rao', email: 'staff.trans2@demo.collegehub.local', role: 'transport_staff', type: 'transport', empId: 'EMP-TRN-002', dept: 'Transit Supervision' },
    ];

    const staffUsers = [];
    for (const s of staffData) {
      let u = await User.findOne({ email: s.email });
      if (!u) {
        u = await User.create({
          name: s.name,
          email: s.email,
          password: demoPassword,
          role: s.role,
          isApproved: true,
          isActive: true,
        });
        await StaffProfile.create({
          user: u._id,
          employeeId: s.empId,
          staffType: s.type,
          assignedDepartment: s.dept,
          resolvedTicketsCount: 5,
          averageRating: 4.8,
        });
      }
      staffUsers.push(u);
    }
    console.log(`  Seeded ${staffUsers.length} staff & coordinator accounts.`);

    // -------------------------------------------------------------------------
    // 8. 24 SYNTHETIC STUDENTS
    // -------------------------------------------------------------------------
    console.log(' [8/17] Seeding 24 Synthetic Students with Skill-Swap Matching Pairs...');
    const studentDefinitions = [
      { name: 'Aarav Reddy', email: 'student.cse01@demo.collegehub.local', roll: 'DEMO-CSE-001', dept: 'CSE', course: 'BTECH-CSE', yr: 3, sem: 6, sec: 'A', skills: ['React', 'JavaScript', 'Node.js', 'MongoDB'], wants: ['Python', 'Docker'], interests: ['Full Stack', 'Cloud Computing', 'Hackathons'], bio: 'Full-stack enthusiast building high-performance web applications.' },
      { name: 'Sahithi Rao', email: 'student.cse02@demo.collegehub.local', roll: 'DEMO-CSE-002', dept: 'CSE', course: 'BTECH-CSE', yr: 3, sem: 6, sec: 'A', skills: ['Python', 'Data Structures', 'Git'], wants: ['React', 'Node.js'], interests: ['Open Source', 'Competitive Programming', 'Algorithms'], bio: 'Passionate about algorithmic problem solving and backend APIs.' },
      { name: 'Vamsi Krishna', email: 'student.aiml01@demo.collegehub.local', roll: 'DEMO-AIML-001', dept: 'CSE-AIML', course: 'BTECH-AIML', yr: 3, sem: 6, sec: 'A', skills: ['Machine Learning', 'Python', 'SQL'], wants: ['Docker', 'Cloud Computing'], interests: ['AI Research', 'Computer Vision', 'Deep Learning'], bio: 'Working on neural network vision models and automated intelligence.' },
      { name: 'Meghana Reddy', email: 'student.aiml02@demo.collegehub.local', roll: 'DEMO-AIML-002', dept: 'CSE-AIML', course: 'BTECH-AIML', yr: 3, sem: 6, sec: 'A', skills: ['Docker', 'Python', 'Git'], wants: ['Machine Learning', 'SQL'], interests: ['MLOps', 'Cloud AI', 'Containerization'], bio: 'Focused on production deployment pipelines for machine learning.' },
      { name: 'Harsha Vardhan', email: 'student.ds01@demo.collegehub.local', roll: 'DEMO-DS-001', dept: 'CSE-DS', course: 'BTECH-DS', yr: 3, sem: 6, sec: 'A', skills: ['SQL', 'Python', 'Machine Learning'], wants: ['UI/UX', 'React'], interests: ['Data Analytics', 'BI Dashboards', 'Big Data'], bio: 'Data analyst fascinated by large-scale dataset pipelines.' },
      { name: 'Nandini', email: 'student.ds02@demo.collegehub.local', roll: 'DEMO-DS-002', dept: 'CSE-DS', course: 'BTECH-DS', yr: 2, sem: 4, sec: 'B', skills: ['UI/UX', 'JavaScript', 'React'], wants: ['SQL', 'Data Structures'], interests: ['Product Design', 'Web Apps', 'Data Visualization'], bio: 'UI/UX designer bridging user empathy and responsive web engineering.' },
      { name: 'Sai Kiran', email: 'student.ece01@demo.collegehub.local', roll: 'DEMO-ECE-001', dept: 'ECE', course: 'BTECH-ECE', yr: 3, sem: 6, sec: 'A', skills: ['C', 'C++', 'Git'], wants: ['Python', 'Cloud Computing'], interests: ['Embedded Systems', 'IoT', 'Microcontrollers'], bio: 'Hardware developer building smart sensor modules and firmware.' },
      { name: 'Keerthana', email: 'student.ece02@demo.collegehub.local', roll: 'DEMO-ECE-002', dept: 'ECE', course: 'BTECH-ECE', yr: 3, sem: 6, sec: 'A', skills: ['Python', 'Cloud Computing', 'C++'], wants: ['C', 'UI/UX'], interests: ['VLSI', 'Edge AI', 'Signal Processing'], bio: 'Exploring low-power semiconductor VLSI and edge computing.' },
      { name: 'Tejaswini', email: 'student.eee01@demo.collegehub.local', roll: 'DEMO-EEE-001', dept: 'EEE', course: 'BTECH-EEE', yr: 2, sem: 4, sec: 'A', skills: ['C', 'Data Structures', 'SQL'], wants: ['Public Speaking', 'Git'], interests: ['Renewable Energy', 'Automation', 'Power Systems'], bio: 'Interested in smart grid telemetry and microcontroller firmware.' },
      { name: 'Pranav', email: 'student.eee02@demo.collegehub.local', roll: 'DEMO-EEE-002', dept: 'EEE', course: 'BTECH-EEE', yr: 4, sem: 8, sec: 'A', skills: ['Public Speaking', 'Git', 'GitHub'], wants: ['C', 'Data Structures'], interests: ['Project Management', 'Smart Grids', 'EVs'], bio: 'Final year lead active in team presentations and electric vehicle design.' },
      { name: 'Ananya', email: 'student.me01@demo.collegehub.local', roll: 'DEMO-ME-001', dept: 'ME', course: 'BTECH-ME', yr: 3, sem: 6, sec: 'A', skills: ['C++', 'Python', 'GitHub'], wants: ['Java', 'Docker'], interests: ['Robotics', 'CAD/CAM', 'Automation'], bio: 'Robotics team member creating autonomous path-planning scripts.' },
      { name: 'Charan', email: 'student.me02@demo.collegehub.local', roll: 'DEMO-ME-002', dept: 'ME', course: 'BTECH-ME', yr: 2, sem: 4, sec: 'B', skills: ['Java', 'Docker', 'SQL'], wants: ['C++', 'Python'], interests: ['Mechatronics', 'Automotive Systems', '3D Modeling'], bio: 'Mechatronics student combining mechanical design with control software.' },
      { name: 'Deepika', email: 'student.ce01@demo.collegehub.local', roll: 'DEMO-CE-001', dept: 'CE', course: 'BTECH-CE', yr: 3, sem: 6, sec: 'A', skills: ['SQL', 'Git', 'GitHub'], wants: ['JavaScript', 'React'], interests: ['GIS', 'Smart Cities', 'Environmental Modeling'], bio: 'Civil engineer using spatial databases for smart infrastructure mapping.' },
      { name: 'Rohit', email: 'student.ce02@demo.collegehub.local', roll: 'DEMO-CE-002', dept: 'CE', course: 'BTECH-CE', yr: 2, sem: 4, sec: 'A', skills: ['JavaScript', 'React', 'Git'], wants: ['SQL', 'Data Structures'], interests: ['Web Mapping', 'Infrastructure Tech', 'Frontend'], bio: 'Developer building web dashboards for structural health monitoring.' },
      { name: 'Sravani', email: 'student.it01@demo.collegehub.local', roll: 'DEMO-IT-001', dept: 'IT', course: 'BTECH-IT', yr: 3, sem: 6, sec: 'A', skills: ['Java', 'Data Structures', 'SQL'], wants: ['MongoDB', 'Node.js'], interests: ['Backend Architecture', 'Fintech', 'Microservices'], bio: 'Backend developer focused on relational databases and clean code architecture.' },
      { name: 'Nikhil', email: 'student.it02@demo.collegehub.local', roll: 'DEMO-IT-002', dept: 'IT', course: 'BTECH-IT', yr: 3, sem: 6, sec: 'A', skills: ['MongoDB', 'Node.js', 'React'], wants: ['Java', 'Data Structures'], interests: ['Full Stack', 'Cloud Architecture', 'APIs'], bio: 'MERN stack builder passionate about rapid prototyping and real-time sockets.' },
      { name: 'Bhavana', email: 'student.cse03@demo.collegehub.local', roll: 'DEMO-CSE-003', dept: 'CSE', course: 'BTECH-CSE', yr: 2, sem: 4, sec: 'A', skills: ['JavaScript', 'React', 'UI/UX'], wants: ['Python', 'Docker'], interests: ['Frontend', 'Accessibility', 'Web Performance'], bio: 'Frontend designer focused on accessible web UI and animations.' },
      { name: 'Karthik', email: 'student.cse04@demo.collegehub.local', roll: 'DEMO-CSE-004', dept: 'CSE', course: 'BTECH-CSE', yr: 4, sem: 8, sec: 'A', skills: ['Docker', 'Cloud Computing', 'Node.js'], wants: ['JavaScript', 'UI/UX'], interests: ['DevOps', 'Distributed Systems', 'Kubernetes'], bio: 'Senior cloud engineer managing scalable microservice deployments.' },
      { name: 'Lasya', email: 'student.aiml03@demo.collegehub.local', roll: 'DEMO-AIML-003', dept: 'CSE-AIML', course: 'BTECH-AIML', yr: 2, sem: 4, sec: 'A', skills: ['Python', 'Machine Learning', 'Git'], wants: ['Public Speaking', 'Docker'], interests: ['Generative AI', 'NLP', 'Data Science'], bio: 'AI hobbyist exploring transformer models and text processing.' },
      { name: 'Abhinav', email: 'student.ds03@demo.collegehub.local', roll: 'DEMO-DS-003', dept: 'CSE-DS', course: 'BTECH-DS', yr: 3, sem: 6, sec: 'B', skills: ['Public Speaking', 'SQL', 'Python'], wants: ['Machine Learning', 'Git'], interests: ['Data Science', 'Tech Talks', 'Statistical Modeling'], bio: 'Student speaker presenting insights on big data analytics and ethics.' },
      { name: 'Navya', email: 'student.ece03@demo.collegehub.local', roll: 'DEMO-ECE-003', dept: 'ECE', course: 'BTECH-ECE', yr: 2, sem: 4, sec: 'A', skills: ['C', 'C++', 'Data Structures'], wants: ['React', 'Node.js'], interests: ['Firmware', 'IoT Dashboards', 'Robotics'], bio: 'Hardware coder building ESP32 IoT sensors with real-time connectivity.' },
      { name: 'Varun', email: 'student.eee03@demo.collegehub.local', roll: 'DEMO-EEE-003', dept: 'EEE', course: 'BTECH-EEE', yr: 3, sem: 6, sec: 'A', skills: ['React', 'Node.js', 'JavaScript'], wants: ['C', 'C++'], interests: ['Web Interfaces for IoT', 'SCADA', 'Clean Energy'], bio: 'Creating web dashboards for solar farm telemetry and inverter monitoring.' },
      { name: 'Poojitha', email: 'student.me03@demo.collegehub.local', roll: 'DEMO-ME-003', dept: 'ME', course: 'BTECH-ME', yr: 3, sem: 6, sec: 'A', skills: ['Git', 'GitHub', 'Python'], wants: ['Cloud Computing', 'SQL'], interests: ['Robotics Simulation', 'AI Hardware', 'CAD'], bio: 'Simulating multi-axis robotic arms with ROS and Python controllers.' },
      { name: 'Aditya', email: 'student.it03@demo.collegehub.local', roll: 'DEMO-IT-003', dept: 'IT', course: 'BTECH-IT', yr: 4, sem: 8, sec: 'A', skills: ['Cloud Computing', 'SQL', 'Node.js'], wants: ['Git', 'GitHub'], interests: ['Cloud Security', 'API Platforms', 'DevSecOps'], bio: 'Graduating senior passionate about secure cloud architecture and APIs.' },
    ];

    const studentUsers = [];
    for (const st of studentDefinitions) {
      let u = await User.findOne({ email: st.email });
      if (!u) {
        u = await User.create({
          name: st.name,
          email: st.email,
          password: demoPassword,
          role: 'student',
          isApproved: true,
          isActive: true,
        });
        await StudentProfile.create({
          user: u._id,
          collegeId: st.roll,
          department: depts[st.dept].name,
          course: programs[st.course].name,
          year: st.yr,
          semester: st.sem,
          section: st.sec,
          skills: st.skills,
          skillsWanted: st.wants,
          interests: st.interests,
          bio: st.bio,
          rating: 4.9,
          ratingsCount: 6,
          sessionsHelpedCount: 3,
        });
      }
      studentUsers.push(u);
    }
    console.log(`  Seeded ${studentUsers.length} synthetic student accounts.`);

    // -------------------------------------------------------------------------
    // 9. CAMPUS RESOURCES (10)
    // -------------------------------------------------------------------------
    console.log(' [9/17] Seeding 10 Campus Facilities & Bookable Resources...');
    const campusResourceData = [
      { name: 'CSE Computer Lab 1', category: 'Computer Lab', location: 'CSE Block, 3rd Floor', building: 'Tech Block A', block: '3rd Floor', roomNumber: 'CS-301', capacity: 60, approvalRequired: true },
      { name: 'CSE Computer Lab 2', category: 'Computer Lab', location: 'CSE Block, 3rd Floor', building: 'Tech Block A', block: '3rd Floor', roomNumber: 'CS-302', capacity: 60, approvalRequired: true },
      { name: 'AI/ML Research Lab', category: 'AI Lab', location: 'AI & Data Science Block', building: 'Tech Block B', block: '2nd Floor', roomNumber: 'AI-201', capacity: 45, approvalRequired: true },
      { name: 'Central Seminar Hall', category: 'Seminar Hall', location: 'Central Academic Block', building: 'Central Block', block: '1st Floor', roomNumber: 'SH-1', capacity: 150, approvalRequired: true },
      { name: 'Dr. APJ Abdul Kalam Auditorium', category: 'Auditorium', location: 'Administrative Block', building: 'Admin Block', block: 'Ground Floor', roomNumber: 'AUD-MAIN', capacity: 800, approvalRequired: true },
      { name: 'Executive Conference Room', category: 'Conference Room', location: 'Administrative Block', building: 'Admin Block', block: '1st Floor', roomNumber: 'CR-101', capacity: 30, approvalRequired: true },
      { name: 'High-Lumen Projector 01', category: 'Projector', location: 'AV Central Hub', building: 'Central Block', block: 'Ground Floor', roomNumber: 'AV-01', capacity: 1, approvalRequired: false },
      { name: 'High-Lumen Projector 02', category: 'Projector', location: 'AV Central Hub', building: 'Central Block', block: 'Ground Floor', roomNumber: 'AV-02', capacity: 1, approvalRequired: false },
      { name: 'Advanced Robotics Kit 01', category: 'Robotics Kit', location: 'Mechanical Mechatronics Lab', building: 'Mech Block', block: 'Ground Floor', roomNumber: 'ROB-01', capacity: 5, approvalRequired: true },
      { name: 'Main Sports Ground', category: 'Sports Ground', location: 'East Campus Athletic Complex', building: 'Sports Complex', block: 'Outdoor', roomNumber: 'GRD-01', capacity: 300, approvalRequired: true },
    ];

    const resources = [];
    for (const cr of campusResourceData) {
      let r = await CampusResource.findOne({ name: cr.name });
      if (!r) {
        r = await CampusResource.create({ ...cr, isActive: true });
      }
      resources.push(r);
    }
    console.log(`  Seeded ${resources.length} campus resources.`);

    // -------------------------------------------------------------------------
    // 10. REALISTIC NON-OVERLAPPING RESOURCE BOOKINGS
    // -------------------------------------------------------------------------
    console.log(' [10/17] Seeding Realistic Resource Bookings...');
    const now = new Date();
    const bookingSeeds = [
      {
        resource: resources[0]._id, // CSE Lab 1
        user: studentUsers[0]._id, // Aarav
        date: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
        startTime: '10:00',
        endTime: '12:00',
        purpose: 'Coding Club React Practical Workshop',
        status: 'approved',
        ref: 'BKG-DEMO-001',
      },
      {
        resource: resources[2]._id, // AI Lab
        user: studentUsers[2]._id, // Vamsi
        date: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
        startTime: '14:00',
        endTime: '16:00',
        purpose: 'Machine Learning Model Benchmarking',
        status: 'approved',
        ref: 'BKG-DEMO-002',
      },
      {
        resource: resources[3]._id, // Seminar Hall
        user: studentUsers[4]._id, // Harsha
        date: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
        startTime: '09:30',
        endTime: '11:30',
        purpose: 'Data Science Symposium Practice',
        status: 'pending',
        ref: 'BKG-DEMO-003',
      },
      {
        resource: resources[4]._id, // Auditorium
        user: studentUsers[6]._id, // Sai Kiran
        date: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
        startTime: '10:00',
        endTime: '13:00',
        purpose: 'Technical Project Exhibition Kickoff',
        status: 'completed',
        ref: 'BKG-DEMO-004',
      },
      {
        resource: resources[8]._id, // Robotics Kit
        user: studentUsers[10]._id, // Ananya
        date: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000),
        startTime: '15:00',
        endTime: '17:00',
        purpose: 'Autonomous Mobile Robot Calibration',
        status: 'approved',
        ref: 'BKG-DEMO-005',
      },
      {
        resource: resources[1]._id, // CSE Lab 2
        user: studentUsers[14]._id, // Sravani
        date: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000),
        startTime: '11:00',
        endTime: '13:00',
        purpose: 'DBMS Study Circle Hands-on SQL Lab',
        status: 'approved',
        ref: 'BKG-DEMO-006',
      },
    ];

    for (const b of bookingSeeds) {
      const exists = await ResourceBooking.findOne({ bookingReference: b.ref });
      if (!exists) {
        const [sH, sM] = b.startTime.split(':').map(Number);
        const [eH, eM] = b.endTime.split(':').map(Number);
        const startDt = new Date(b.date);
        startDt.setHours(sH, sM, 0, 0);
        const endDt = new Date(b.date);
        endDt.setHours(eH, eM, 0, 0);

        await ResourceBooking.create({
          resource: b.resource,
          user: b.user,
          bookingDate: b.date,
          startTime: b.startTime,
          endTime: b.endTime,
          startDateTime: startDt,
          endDateTime: endDt,
          purpose: b.purpose,
          status: b.status,
          bookingReference: b.ref,
          attendeeCount: 25,
        });
      }
    }
    console.log(`  Seeded ${bookingSeeds.length} resource bookings.`);

    // -------------------------------------------------------------------------
    // 11. PROJECTHUB (8 REALISTIC PROJECTS)
    // -------------------------------------------------------------------------
    console.log(' [11/17] Seeding 8 Realistic Student Projects...');
    const projectDefinitions = [
      {
        title: 'Smart Campus Parking System',
        description: 'Automated campus parking telemetry with QR code slot verification and real-time occupancy sensor maps.',
        problemStatement: 'Students and faculty spend 15+ minutes finding vacant spots in peak morning hours.',
        category: 'Web Development',
        technologies: ['React', 'Node.js', 'MongoDB', 'QR Code', 'Express'],
        requiredSkills: ['React', 'Node.js', 'UI/UX'],
        status: 'Recruiting',
        progress: 35,
        createdBy: studentUsers[0]._id, // Aarav
        mentor: facultyUsers['CSE']._id,
        members: [{ user: studentUsers[0]._id, role: 'Lead Developer' }, { user: studentUsers[1]._id, role: 'Backend Dev' }],
      },
      {
        title: 'Campus Food Waste Donation Platform',
        description: 'Connecting campus canteens, hostels, and local NGOs to distribute surplus edible food safely.',
        problemStatement: 'Unused food in campus mess facilities is discarded without an automated distribution log.',
        category: 'Social Impact',
        technologies: ['React', 'Express', 'MongoDB', 'Node.js'],
        requiredSkills: ['React', 'Node.js', 'MongoDB'],
        status: 'In Development',
        progress: 60,
        createdBy: studentUsers[2]._id, // Vamsi
        mentor: facultyUsers['CSE-AIML']._id,
        members: [{ user: studentUsers[2]._id, role: 'Project Lead' }, { user: studentUsers[3]._id, role: 'Full Stack Dev' }],
      },
      {
        title: 'Smart Classroom Resource Booking',
        description: 'Real-time booking and scheduling platform for campus seminar halls, conference suites, and research labs.',
        problemStatement: 'Clashing offline lab reservations and double-booked projection equipment.',
        category: 'Productivity',
        technologies: ['React', 'Node.js', 'Express', 'MongoDB', 'Socket.IO'],
        requiredSkills: ['React', 'Node.js', 'Socket.IO'],
        status: 'Testing',
        progress: 85,
        createdBy: studentUsers[4]._id, // Harsha
        mentor: facultyUsers['CSE-DS']._id,
        members: [{ user: studentUsers[4]._id, role: 'Full Stack Dev' }, { user: studentUsers[5]._id, role: 'UI/UX Designer' }],
      },
      {
        title: 'College Event Management Platform',
        description: 'End-to-end hackathon registration, QR check-in, team matchmaking, and automated certificate generation.',
        problemStatement: 'Manual paper-based registration during inter-college symposiums leads to registration queues.',
        category: 'Event Tech',
        technologies: ['React', 'Node.js', 'MongoDB', 'PDFKit', 'QRCode'],
        requiredSkills: ['React', 'Node.js'],
        status: 'Completed',
        progress: 100,
        createdBy: studentUsers[6]._id, // Sai Kiran
        mentor: facultyUsers['ECE']._id,
        members: [{ user: studentUsers[6]._id, role: 'Architect' }, { user: studentUsers[7]._id, role: 'Frontend Lead' }],
      },
      {
        title: 'Hostel Maintenance Tracker',
        description: 'Digital maintenance issue ticketing for campus hostels with SLA escalations and staff resolution proof photos.',
        problemStatement: 'Delayed resolution of plumbing, electrical, and Wi-Fi complaints reported in physical registers.',
        category: 'Campus Operations',
        technologies: ['React', 'Express', 'MongoDB', 'Cloudinary'],
        requiredSkills: ['React', 'Express', 'MongoDB'],
        status: 'In Development',
        progress: 50,
        createdBy: studentUsers[8]._id, // Tejaswini
        mentor: facultyUsers['EEE']._id,
        members: [{ user: studentUsers[8]._id, role: 'Project Manager' }, { user: studentUsers[9]._id, role: 'Backend Dev' }],
      },
      {
        title: 'Student Skill Exchange Platform',
        description: 'Peer-to-peer reciprocal skill trading where students swap tech proficiencies through mutual scheduled study sessions.',
        problemStatement: 'Students struggle to find peer mentors for specialized programming tools.',
        category: 'EdTech',
        technologies: ['React', 'Node.js', 'MongoDB', 'WebSockets'],
        requiredSkills: ['React', 'Node.js', 'Algorithms'],
        status: 'Recruiting',
        progress: 25,
        createdBy: studentUsers[10]._id, // Ananya
        mentor: facultyUsers['ME']._id,
        members: [{ user: studentUsers[10]._id, role: 'Founder' }, { user: studentUsers[11]._id, role: 'Full Stack Dev' }],
      },
      {
        title: 'Campus Lost & Found',
        description: 'Smart campus lost and found item board with confidential verification marks and anti-fraud claim workflows.',
        problemStatement: 'Valuable student possessions misplaced across libraries and labs often go unclaimed.',
        category: 'Utility',
        technologies: ['React', 'Node.js', 'MongoDB', 'TailwindCSS'],
        requiredSkills: ['React', 'MongoDB', 'UI/UX'],
        status: 'Completed',
        progress: 100,
        createdBy: studentUsers[12]._id, // Deepika
        mentor: facultyUsers['CE']._id,
        members: [{ user: studentUsers[12]._id, role: 'Lead Dev' }, { user: studentUsers[13]._id, role: 'UI Engineer' }],
      },
      {
        title: 'Bus Schedule & Transport Issue Platform',
        description: 'Live bus route tracking, morning pickup timetable notifications, and passenger feedback for campus transit.',
        problemStatement: 'Unannounced bus timing changes leave day-scholar students stranded at transit stops.',
        category: 'Transportation',
        technologies: ['React', 'Express', 'MongoDB', 'Leaflet Maps'],
        requiredSkills: ['React', 'Express', 'GIS'],
        status: 'Idea',
        progress: 10,
        createdBy: studentUsers[14]._id, // Sravani
        mentor: facultyUsers['IT']._id,
        members: [{ user: studentUsers[14]._id, role: 'Idea Lead' }, { user: studentUsers[15]._id, role: 'Frontend Dev' }],
      },
    ];

    const seededProjects = [];
    for (const proj of projectDefinitions) {
      let p = await Project.findOne({ title: proj.title });
      if (!p) {
        p = await Project.create(proj);
      }
      seededProjects.push(p);
    }
    console.log(`  Seeded ${seededProjects.length} realistic student collaborative projects.`);

    // -------------------------------------------------------------------------
    // 12. SKILLSWAP MATCHES & SESSIONS
    // -------------------------------------------------------------------------
    console.log(' [12/17] Seeding SkillSwap Reciprocal Matches & Sessions...');
    const skillRequestsData = [
      {
        requester: studentUsers[0]._id, // Aarav (Offers React, Wants Python)
        mentor: studentUsers[1]._id, // Sahithi (Offers Python, Wants React)
        skillOffered: 'React',
        skillWanted: 'Python',
        message: 'Hi Sahithi! I can mentor you in React state management if you can teach me Python OOP and script automations.',
        status: 'accepted',
      },
      {
        requester: studentUsers[2]._id, // Vamsi (Offers ML, Wants Docker)
        mentor: studentUsers[3]._id, // Meghana (Offers Docker, Wants ML)
        skillOffered: 'Machine Learning',
        skillWanted: 'Docker',
        message: 'Looking to learn Docker container builds for ML inference servers.',
        status: 'accepted',
      },
      {
        requester: studentUsers[4]._id, // Harsha (Offers SQL, Wants UI/UX)
        mentor: studentUsers[5]._id, // Nandini (Offers UI/UX, Wants SQL)
        skillOffered: 'SQL',
        skillWanted: 'UI/UX',
        message: 'Need help designing modern Figma wireframes for my data visualization dashboard.',
        status: 'requested',
      },
      {
        requester: studentUsers[14]._id, // Sravani (Offers Java, Wants MongoDB)
        mentor: studentUsers[15]._id, // Nikhil (Offers MongoDB, Wants Java)
        skillOffered: 'Java',
        skillWanted: 'MongoDB',
        message: 'Can exchange Java multithreading concepts for MongoDB aggregation pipeline mastery.',
        status: 'accepted',
      },
    ];

    for (const sr of skillRequestsData) {
      const exists = await SkillRequest.findOne({ requester: sr.requester, mentor: sr.mentor, skillWanted: sr.skillWanted });
      let reqDoc = exists;
      if (!reqDoc) {
        reqDoc = await SkillRequest.create(sr);
      }

      // Create scheduled and completed sessions
      if (sr.status === 'accepted') {
        const sessionExists = await SkillSession.findOne({ mentor: sr.mentor, learner: sr.requester, skill: sr.skillWanted });
        if (!sessionExists) {
          await SkillSession.create({
            skillRequest: reqDoc._id,
            mentor: sr.mentor,
            learner: sr.requester,
            skill: sr.skillWanted,
            scheduledAt: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
            durationMinutes: 60,
            meetingLink: 'https://meet.google.com/demo-aiet-skill',
            status: 'scheduled',
          });
        }
      }
    }

    // Add 1 Completed SkillSession with ratings
    const completedSessionExists = await SkillSession.findOne({ status: 'completed' });
    if (!completedSessionExists) {
      await SkillSession.create({
        mentor: studentUsers[0]._id, // Aarav
        learner: studentUsers[1]._id, // Sahithi
        skill: 'React',
        scheduledAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
        durationMinutes: 60,
        status: 'completed',
        completedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
        learnerRating: 5,
        learnerReview: 'Super clear explanation of custom hooks and context API!',
        mentorRating: 5,
        mentorReview: 'Great learner, quickly understood state synchronization.',
      });
    }
    console.log('  Seeded reciprocal SkillSwap requests and live sessions.');

    // -------------------------------------------------------------------------
    // 13. STUDYHUB (5 STUDY GROUPS & 5 RESOURCES)
    // -------------------------------------------------------------------------
    console.log(' [13/17] Seeding 5 StudyHub Circles & Metadata Resources...');
    const studyGroupData = [
      {
        name: 'Data Structures Practice Group',
        subject: 'Data Structures & Algorithms',
        department: 'Computer Science & Engineering',
        semester: 6,
        creator: studentUsers[0]._id, // Aarav
        facultyAdvisor: facultyUsers['CSE']._id,
        members: [studentUsers[0]._id, studentUsers[1]._id, studentUsers[16]._id, studentUsers[17]._id],
        description: 'Weekly LeetCode and competitive programming problem-solving group.',
        scheduleInfo: 'Tuesdays & Thursdays 5:00 PM',
      },
      {
        name: 'DBMS & SQL Study Circle',
        subject: 'Database Management Systems',
        department: 'Information Technology',
        semester: 4,
        creator: studentUsers[14]._id, // Sravani
        facultyAdvisor: facultyUsers['IT']._id,
        members: [studentUsers[14]._id, studentUsers[15]._id, studentUsers[4]._id, studentUsers[5]._id],
        description: 'Mastering SQL queries, indexing, and ACID transaction mechanics.',
        scheduleInfo: 'Wednesdays 4:30 PM',
      },
      {
        name: 'MERN Development Group',
        subject: 'Full Stack Web Development',
        department: 'Computer Science & Engineering',
        semester: 6,
        creator: studentUsers[16]._id, // Bhavana
        facultyAdvisor: facultyUsers['CSE']._id,
        members: [studentUsers[16]._id, studentUsers[17]._id, studentUsers[13]._id, studentUsers[12]._id],
        description: 'Collaborative development of full-stack open source React projects.',
        scheduleInfo: 'Saturdays 10:00 AM',
      },
      {
        name: 'Java Programming Group',
        subject: 'Object Oriented Java',
        department: 'Information Technology',
        semester: 4,
        creator: studentUsers[11]._id, // Charan
        facultyAdvisor: facultyUsers['IT']._id,
        members: [studentUsers[11]._id, studentUsers[10]._id, studentUsers[14]._id, studentUsers[15]._id],
        description: 'Core Java, collections framework, and OOP design patterns.',
        scheduleInfo: 'Mondays 5:00 PM',
      },
      {
        name: 'Placement Preparation Group',
        subject: 'Campus Placement Aptitude & Tech',
        department: 'All',
        semester: 8,
        creator: studentUsers[9]._id, // Pranav
        facultyAdvisor: facultyUsers['EEE']._id,
        members: [studentUsers[9]._id, studentUsers[23]._id, studentUsers[17]._id, studentUsers[7]._id],
        description: 'Mock interviews, coding rounds, and aptitude problem drills.',
        scheduleInfo: 'Daily 6:00 PM',
      },
    ];

    for (const sg of studyGroupData) {
      const exists = await StudyGroup.findOne({ name: sg.name });
      if (!exists) {
        await StudyGroup.create(sg);
      }
    }

    const studyResourceData = [
      {
        title: 'DBMS Normalization Notes (1NF to BCNF)',
        description: 'Comprehensive handwritten step-by-step normalization guide with solved gate exam problems.',
        subject: 'Database Management Systems',
        department: 'Information Technology',
        semester: 4,
        type: 'Notes',
        externalUrl: 'https://aiet.demo/resources/dbms-normalization-guide.pdf',
        uploadedBy: studentUsers[14]._id,
        downloadCount: 42,
        bookmarksCount: 15,
        tags: ['DBMS', 'Normalization', 'SQL', 'Gate'],
      },
      {
        title: 'Java Collections Framework Cheat Sheet',
        description: 'Reference sheet covering ArrayList, LinkedList, HashMap, ConcurrentMap, and time complexities.',
        subject: 'Object Oriented Java',
        department: 'Information Technology',
        semester: 4,
        type: 'Reference Material',
        externalUrl: 'https://aiet.demo/resources/java-collections.pdf',
        uploadedBy: studentUsers[11]._id,
        downloadCount: 58,
        bookmarksCount: 22,
        tags: ['Java', 'Collections', 'OOP'],
      },
      {
        title: 'React Hooks & State Management Guide',
        description: 'In-depth notes on useEffect dependency lifecycle, useMemo, useCallback, and context patterns.',
        subject: 'Full Stack Web Development',
        department: 'Computer Science & Engineering',
        semester: 6,
        type: 'Notes',
        externalUrl: 'https://aiet.demo/resources/react-hooks.pdf',
        uploadedBy: studentUsers[0]._id,
        downloadCount: 77,
        bookmarksCount: 31,
        tags: ['React', 'JavaScript', 'WebDev'],
      },
      {
        title: 'MongoDB Aggregation Pipeline Query Handbook',
        description: 'Practical guide to $lookup, $group, $facet, and performance optimization indexes.',
        subject: 'Full Stack Web Development',
        department: 'Computer Science & Engineering',
        semester: 6,
        type: 'Tutorial',
        externalUrl: 'https://aiet.demo/resources/mongodb-queries.pdf',
        uploadedBy: studentUsers[15]._id,
        downloadCount: 63,
        bookmarksCount: 19,
        tags: ['MongoDB', 'NoSQL', 'Database'],
      },
      {
        title: 'Data Structures Top 50 Interview Questions',
        description: 'Curated list of standard binary tree, graph traversal, and dynamic programming questions with solutions.',
        subject: 'Data Structures & Algorithms',
        department: 'Computer Science & Engineering',
        semester: 6,
        type: 'Question Paper',
        externalUrl: 'https://aiet.demo/resources/dsa-top50.pdf',
        uploadedBy: studentUsers[1]._id,
        downloadCount: 95,
        bookmarksCount: 48,
        tags: ['DSA', 'Placement', 'LeetCode'],
      },
    ];

    for (const res of studyResourceData) {
      const exists = await StudyResource.findOne({ title: res.title });
      if (!exists) {
        await StudyResource.create(res);
      }
    }
    console.log('  Seeded 5 study circles and 5 verified learning resources.');

    // -------------------------------------------------------------------------
    // 14. CAMPUSFIX (10 TICKETS)
    // -------------------------------------------------------------------------
    console.log(' [14/17] Seeding 10 CampusFix Maintenance Tickets with Real SLA Life Cycles...');
    const complaintSeeds = [
      {
        ticketNumber: 'FIX-DEMO-0001',
        title: 'Projector HDMI port not displaying in CSE Room 301',
        description: 'The ceiling-mounted projector flickers and loses HDMI input signal intermittently during classes.',
        category: 'Classroom',
        location: 'CSE Block, Room 301',
        priority: 'High',
        reportedBy: studentUsers[0]._id,
        assignedStaff: staffUsers[2]._id, // Govind (Electrical/IT)
        status: 'In Progress',
        slaHours: 4,
        slaDeadline: new Date(now.getTime() + 2 * 60 * 60 * 1000),
      },
      {
        ticketNumber: 'FIX-DEMO-0002',
        title: 'Wi-Fi connectivity drop in AI Research Lab',
        description: 'Access point AP-AI-02 disconnects when more than 20 laptops connect simultaneously.',
        category: 'Wi-Fi',
        location: 'Tech Block B, AI Lab',
        priority: 'Critical',
        reportedBy: studentUsers[2]._id,
        assignedStaff: staffUsers[2]._id,
        status: 'Assigned',
        slaHours: 1,
        slaDeadline: new Date(now.getTime() + 45 * 60 * 1000),
      },
      {
        ticketNumber: 'FIX-DEMO-0003',
        title: 'Water leakage near 2nd floor restroom',
        description: 'Pipe joint leak creating water puddle near the second-floor staircase.',
        category: 'Water',
        location: 'Central Academic Block, 2nd Floor',
        priority: 'Medium',
        reportedBy: studentUsers[4]._id,
        assignedStaff: staffUsers[4]._id, // Rambabu (Plumbing)
        status: 'Resolved',
        slaHours: 12,
        slaDeadline: new Date(now.getTime() - 2 * 60 * 60 * 1000),
        resolvedAt: new Date(now.getTime() - 3 * 60 * 60 * 1000),
        resolutionNotes: 'Replaced faulty PVC gasket and reinforced pipe seal.',
        userRating: 5,
        userFeedback: 'Fixed promptly within 2 hours.',
      },
      {
        ticketNumber: 'FIX-DEMO-0004',
        title: 'Ceiling fan making squeaking noise in classroom 204',
        description: 'Fan #3 is wobbling and generating loud noise, disturbing lecture audibility.',
        category: 'Electrical',
        location: 'Tech Block A, Room 204',
        priority: 'Low',
        reportedBy: studentUsers[6]._id,
        assignedStaff: staffUsers[2]._id,
        status: 'Open',
        slaHours: 48,
        slaDeadline: new Date(now.getTime() + 24 * 60 * 60 * 1000),
      },
      {
        ticketNumber: 'FIX-DEMO-0005',
        title: 'Broken chair armrests in Central Seminar Hall',
        description: 'Seats in Row F (seats 12-14) have cracked armrests that need replacement.',
        category: 'Infrastructure',
        location: 'Central Seminar Hall, Row F',
        priority: 'Low',
        reportedBy: studentUsers[8]._id,
        assignedStaff: staffUsers[3]._id, // Satyanarayana (Civil/Facilities)
        status: 'Closed',
        slaHours: 48,
        slaDeadline: new Date(now.getTime() - 24 * 60 * 60 * 1000),
        resolvedAt: new Date(now.getTime() - 26 * 60 * 60 * 1000),
        closedAt: new Date(now.getTime() - 25 * 60 * 60 * 1000),
        resolutionNotes: 'Fitted 3 new heavy-duty ergonomic armrests.',
        userRating: 5,
      },
      {
        ticketNumber: 'FIX-DEMO-0006',
        title: 'Computer terminal #18 power supply failure in Lab 2',
        description: 'Terminal fails to boot up. Power LED does not illuminate.',
        category: 'Lab Equipment',
        location: 'Tech Block A, CSE Lab 2',
        priority: 'Medium',
        reportedBy: studentUsers[10]._id,
        assignedStaff: staffUsers[2]._id,
        status: 'Waiting',
        slaHours: 12,
        slaDeadline: new Date(now.getTime() + 6 * 60 * 60 * 1000),
      },
      {
        ticketNumber: 'FIX-DEMO-0007',
        title: 'Auditorium wireless collar microphone audio cracking',
        description: 'Collar mic frequency interference causes audio distortion during stage presentations.',
        category: 'Classroom',
        location: 'Administrative Block, Main Auditorium',
        priority: 'High',
        reportedBy: studentUsers[12]._id,
        assignedStaff: staffUsers[2]._id,
        status: 'Accepted',
        slaHours: 4,
        slaDeadline: new Date(now.getTime() + 3 * 60 * 60 * 1000),
      },
      {
        ticketNumber: 'FIX-DEMO-0008',
        title: 'Water cooler filtration cartridge replacement due',
        description: 'Cooler indicator filter lamp blinking orange on 1st floor corridor.',
        category: 'Water',
        location: 'Tech Block B, 1st Floor Corridor',
        priority: 'Medium',
        reportedBy: studentUsers[14]._id,
        assignedStaff: staffUsers[4]._id,
        status: 'Resolved',
        slaHours: 12,
        slaDeadline: new Date(now.getTime() - 4 * 60 * 60 * 1000),
        resolvedAt: new Date(now.getTime() - 5 * 60 * 60 * 1000),
        resolutionNotes: 'Installed new 5-stage RO sediment and carbon filter cartridge.',
        userRating: 4,
      },
      {
        ticketNumber: 'FIX-DEMO-0009',
        title: 'LED tube light flickering in Mechanical CAD Lab',
        description: 'Light panel flickering causing eye strain during CAD software sessions.',
        category: 'Electrical',
        location: 'Mech Block, CAD Room 102',
        priority: 'Medium',
        reportedBy: studentUsers[16]._id,
        assignedStaff: staffUsers[2]._id,
        status: 'Open',
        slaHours: 12,
        slaDeadline: new Date(now.getTime() + 8 * 60 * 60 * 1000),
      },
      {
        ticketNumber: 'FIX-DEMO-0010',
        title: 'Sports ground floodlight #2 bulb replacement',
        description: 'West corner floodlight not powering on for evening football practice.',
        category: 'Infrastructure',
        location: 'East Campus Sports Ground',
        priority: 'Low',
        reportedBy: studentUsers[18]._id,
        assignedStaff: staffUsers[3]._id,
        status: 'Assigned',
        slaHours: 48,
        slaDeadline: new Date(now.getTime() + 36 * 60 * 60 * 1000),
      },
    ];

    for (const c of complaintSeeds) {
      const exists = await Complaint.findOne({ ticketNumber: c.ticketNumber });
      if (!exists) {
        await Complaint.create(c);
      }
    }
    console.log(`  Seeded ${complaintSeeds.length} CampusFix tickets.`);

    // -------------------------------------------------------------------------
    // 15. LOST & FOUND (8 ITEMS WITH POTENTIAL MATCHES)
    // -------------------------------------------------------------------------
    console.log(' [15/17] Seeding 8 Lost & Found Records with Verification Markups...');
    const lostFoundSeeds = [
      {
        type: 'lost',
        title: 'Lost black wireless earbuds in charging case',
        description: 'Black boat Airdopes in a matte black case misplaced near the library study desks.',
        category: 'Electronics',
        brand: 'boAt',
        color: 'Black',
        location: 'Central Library, 2nd Floor',
        date: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
        status: 'Possible Match',
        createdBy: studentUsers[0]._id,
      },
      {
        type: 'found',
        title: 'Found black wireless earbuds case',
        description: 'Discovered near reading table #14 in Central Library. Handed to librarian desk.',
        category: 'Electronics',
        brand: 'boAt',
        color: 'Black',
        location: 'Central Library',
        date: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
        status: 'Possible Match',
        createdBy: studentUsers[1]._id,
      },
      {
        type: 'lost',
        title: 'Lost scientific calculator fx-991EX',
        description: 'Casio ClassWiz calculator with small silver sticker on the back battery cover.',
        category: 'Electronics',
        brand: 'Casio',
        color: 'Black/White',
        location: 'CSE Block, Room 301',
        date: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000),
        status: 'Open',
        createdBy: studentUsers[6]._id,
      },
      {
        type: 'found',
        title: 'Found student college ID card',
        description: 'Found plastic ID card badge on the pathway near Cafeteria.',
        category: 'ID Cards & Wallets',
        brand: 'CollegeHub',
        color: 'Blue/White',
        location: 'Campus Cafeteria Entrance',
        date: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
        status: 'Open',
        createdBy: studentUsers[8]._id,
      },
      {
        type: 'found',
        title: 'Found stainless steel water bottle',
        description: 'Silver Milton insulated water bottle left on the bench near football field.',
        category: 'Bottles',
        brand: 'Milton',
        color: 'Silver',
        location: 'East Campus Sports Ground',
        date: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
        status: 'Open',
        createdBy: studentUsers[10]._id,
      },
      {
        type: 'lost',
        title: 'Lost hardcover Engineering Mathematics notebook',
        description: 'Blue classmate notebook containing unit 3 and unit 4 differential equations notes.',
        category: 'Books & Stationery',
        brand: 'Classmate',
        color: 'Blue',
        location: 'Tech Block A, 1st Floor',
        date: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
        status: 'Open',
        createdBy: studentUsers[12]._id,
      },
      {
        type: 'found',
        title: 'Found 64GB SanDisk USB flash drive',
        description: 'Metal USB drive attached to a blue lanyard found in CSE Computer Lab 1.',
        category: 'Electronics',
        brand: 'SanDisk',
        color: 'Metallic Silver',
        location: 'Tech Block A, CSE Lab 1',
        date: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
        status: 'Open',
        createdBy: studentUsers[14]._id,
      },
      {
        type: 'lost',
        title: 'Lost black matte motorcycle helmet',
        description: 'Studds full-face helmet left on bike handle in student parking bay 4.',
        category: 'Clothing & Accessories',
        brand: 'Studds',
        color: 'Matte Black',
        location: 'Two-Wheeler Parking Area',
        date: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
        status: 'Open',
        createdBy: studentUsers[16]._id,
      },
    ];

    for (const lf of lostFoundSeeds) {
      const exists = await LostFoundItem.findOne({ title: lf.title });
      if (!exists) {
        await LostFoundItem.create(lf);
      }
    }
    console.log(`  Seeded ${lostFoundSeeds.length} Lost & Found records.`);

    // -------------------------------------------------------------------------
    // 16. EVENTHUB, CLUBS, TRANSPORT & CAMPUSVOICE
    // -------------------------------------------------------------------------
    console.log(' [16/17] Seeding Clubs, Campus Events, Transit Routes & Suggestions...');
    // CLUBS
    const clubData = [
      { name: 'AIET Coding Club', code: 'CLUB-CODE', category: 'Technical', description: 'Student developer community organizing weekly algorithmic contests, web sprints, and hackathons.', coordinator: staffUsers[0]._id, facultyAdvisor: facultyUsers['CSE']._id },
      { name: 'AI & Robotics Society', code: 'CLUB-ROBOT', category: 'Technical', description: 'Autonomous systems, IoT sensor prototyping, drone building, and national robotics challenges.', coordinator: staffUsers[0]._id, facultyAdvisor: facultyUsers['ME']._id },
      { name: 'Cultural & Arts Club', code: 'CLUB-CULT', category: 'Cultural', description: 'Vibrant student collective for classical music, contemporary dance, theater, and arts.', coordinator: staffUsers[1]._id, facultyAdvisor: facultyUsers['ECE']._id },
      { name: 'AIET Sports & Athletics Club', code: 'CLUB-SPORT', category: 'Sports', description: 'Organizing inter-departmental cricket, volleyball, badminton, and annual sports meets.', coordinator: staffUsers[1]._id, facultyAdvisor: facultyUsers['EEE']._id },
      { name: 'Innovation & Startup Cell', code: 'CLUB-INNOV', category: 'Entrepreneurship', description: 'Incubating student tech ventures, patent filings, and venture mentoring workshops.', coordinator: staffUsers[0]._id, facultyAdvisor: facultyUsers['IT']._id },
    ];

    const seededClubs = [];
    for (const cl of clubData) {
      let c = await Club.findOne({ code: cl.code });
      if (!c) {
        c = await Club.create(cl);
      }
      seededClubs.push(c);
      // Ensure coordinator is member
      const memberExists = await ClubMember.findOne({ club: c._id, user: cl.coordinator });
      if (!memberExists) {
        await ClubMember.create({ club: c._id, user: cl.coordinator, role: 'lead', status: 'active' });
      }
      // Add first 4 students as members
      for (let i = 0; i < 4; i++) {
        const studentMemberExists = await ClubMember.findOne({ club: c._id, user: studentUsers[i]._id });
        if (!studentMemberExists) {
          await ClubMember.create({ club: c._id, user: studentUsers[i]._id, role: 'member', status: 'active' });
        }
      }
    }

    // CAMPUS EVENTS (6)
    const eventSeeds = [
      {
        title: 'AIET HackSprint 2026',
        description: '36-hour flagship annual college hackathon solving real-world challenges in smart campus, healthcare, and education.',
        category: 'Hackathon',
        organizer: admin._id,
        club: seededClubs[0]._id,
        venue: 'Dr. APJ Abdul Kalam Auditorium',
        startDate: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000),
        endDate: new Date(now.getTime() + 12 * 24 * 60 * 60 * 1000),
        registrationDeadline: new Date(now.getTime() + 8 * 24 * 60 * 60 * 1000),
        maxParticipants: 300,
        isPublished: true,
      },
      {
        title: 'Modern Web Development Workshop',
        description: 'Hands-on training session on Next.js, Tailwind CSS, TypeScript, and serverless edge functions.',
        category: 'Workshop',
        organizer: staffUsers[0]._id,
        club: seededClubs[0]._id,
        venue: 'Tech Block A, CSE Computer Lab 1',
        startDate: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000),
        endDate: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000),
        registrationDeadline: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
        maxParticipants: 60,
        isPublished: true,
      },
      {
        title: 'CodeMaster Algorithm Challenge',
        description: '3-hour speed competitive programming sprint testing graph algorithms, dynamic programming, and binary search.',
        category: 'Coding Contest',
        organizer: facultyUsers['CSE']._id,
        club: seededClubs[0]._id,
        venue: 'Tech Block B, AI Lab',
        startDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
        endDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000),
        registrationDeadline: new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000),
        maxParticipants: 100,
        isPublished: true,
      },
      {
        title: 'Annual Technical Project Expo',
        description: 'Exhibition of hardware prototypes, robotics demos, and software platforms created by graduating seniors.',
        category: 'Technical Fest',
        organizer: admin._id,
        club: seededClubs[4]._id,
        venue: 'Central Academic Block Seminar Hall',
        startDate: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000),
        endDate: new Date(now.getTime() + 16 * 24 * 60 * 60 * 1000),
        registrationDeadline: new Date(now.getTime() + 12 * 24 * 60 * 60 * 1000),
        maxParticipants: 200,
        isPublished: true,
      },
      {
        title: 'Inter-Departmental Sports Meet',
        description: 'Annual track & field, cricket tournaments, volleyball championships, and tug-of-war contests.',
        category: 'Sports',
        organizer: staffUsers[1]._id,
        club: seededClubs[3]._id,
        venue: 'East Campus Sports Ground',
        startDate: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
        endDate: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000),
        registrationDeadline: new Date(now.getTime() - 12 * 24 * 60 * 60 * 1000),
        maxParticipants: 400,
        isPublished: true,
      },
      {
        title: 'Tarangini Cultural Fest',
        description: 'Inter-college celebration featuring musical bands, drama performances, fashion runway, and dance battles.',
        category: 'Cultural Event',
        organizer: staffUsers[1]._id,
        club: seededClubs[2]._id,
        venue: 'Dr. APJ Abdul Kalam Auditorium',
        startDate: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000),
        endDate: new Date(now.getTime() - 18 * 24 * 60 * 60 * 1000),
        registrationDeadline: new Date(now.getTime() - 22 * 24 * 60 * 60 * 1000),
        maxParticipants: 800,
        isPublished: true,
      },
    ];

    const seededEvents = [];
    for (const ev of eventSeeds) {
      let e = await CampusEvent.findOne({ title: ev.title });
      if (!e) {
        e = await CampusEvent.create(ev);
      }
      seededEvents.push(e);

      // Register first 6 students for upcoming hackathon and workshop
      for (let i = 0; i < 6; i++) {
        const regExists = await EventRegistration.findOne({ event: e._id, user: studentUsers[i]._id });
        if (!regExists) {
          await EventRegistration.create({
            event: e._id,
            user: studentUsers[i]._id,
            ticketCode: `TKT-${e.title.slice(0, 3).toUpperCase()}-${studentUsers[i].email.slice(0, 4).toUpperCase()}-${i + 101}`,
            status: ev.startDate < now ? 'attended' : 'registered',
          });
        }
      }
    }

    // BUSES & ROUTES
    const busSeeds = [
      { busNumber: 'BUS-01', vehicleNumber: 'AP-16-TX-1001', driverName: 'D. Venkanna', driverPhone: '+91 9440112233', capacity: 55, status: 'Active' },
      { busNumber: 'BUS-02', vehicleNumber: 'AP-16-TX-1002', driverName: 'K. Subba Rao', driverPhone: '+91 9440112234', capacity: 55, status: 'Active' },
      { busNumber: 'BUS-03', vehicleNumber: 'AP-16-TX-1003', driverName: 'P. Rambabu', driverPhone: '+91 9440112235', capacity: 55, status: 'Active' },
      { busNumber: 'BUS-04', vehicleNumber: 'AP-16-TX-1004', driverName: 'T. Srinivasa Rao', driverPhone: '+91 9440112236', capacity: 50, status: 'Active' },
    ];

    const seededBuses = [];
    for (const b of busSeeds) {
      let doc = await Bus.findOne({ busNumber: b.busNumber });
      if (!doc) {
        doc = await Bus.create(b);
      }
      seededBuses.push(doc);
    }

    const routeSeeds = [
      {
        routeName: 'Vijayawada City → College Campus',
        routeNumber: 'R-101',
        startLocation: 'PNBS Bus Station, Vijayawada',
        destination: 'AIET Campus Main Gate',
        assignedBus: seededBuses[0]._id,
        stops: [
          { stopName: 'PNBS Central Station', timeMorning: '07:15 AM', timeEvening: '05:45 PM', sequence: 1 },
          { stopName: 'Benz Circle', timeMorning: '07:30 AM', timeEvening: '05:30 PM', sequence: 2 },
          { stopName: 'Ramavarappadu Ring', timeMorning: '07:45 AM', timeEvening: '05:15 PM', sequence: 3 },
          { stopName: 'AIET Campus', timeMorning: '08:10 AM', timeEvening: '04:50 PM', sequence: 4 },
        ],
        isActive: true,
      },
      {
        routeName: 'Gannavaram → College Campus',
        routeNumber: 'R-102',
        startLocation: 'Gannavaram Bus Stand',
        destination: 'AIET Campus Main Gate',
        assignedBus: seededBuses[1]._id,
        stops: [
          { stopName: 'Gannavaram Bus Stand', timeMorning: '07:20 AM', timeEvening: '05:40 PM', sequence: 1 },
          { stopName: 'Airport Junction', timeMorning: '07:35 AM', timeEvening: '05:25 PM', sequence: 2 },
          { stopName: 'Kesarapalli', timeMorning: '07:48 AM', timeEvening: '05:12 PM', sequence: 3 },
          { stopName: 'AIET Campus', timeMorning: '08:05 AM', timeEvening: '04:50 PM', sequence: 4 },
        ],
        isActive: true,
      },
      {
        routeName: 'Mangalagiri → College Campus',
        routeNumber: 'R-103',
        startLocation: 'Mangalagiri Old Bus Stand',
        destination: 'AIET Campus Main Gate',
        assignedBus: seededBuses[2]._id,
        stops: [
          { stopName: 'Mangalagiri Bypass', timeMorning: '07:10 AM', timeEvening: '05:50 PM', sequence: 1 },
          { stopName: 'Tadepalli', timeMorning: '07:25 AM', timeEvening: '05:35 PM', sequence: 2 },
          { stopName: 'Prakasam Barrage Junction', timeMorning: '07:40 AM', timeEvening: '05:20 PM', sequence: 3 },
          { stopName: 'AIET Campus', timeMorning: '08:15 AM', timeEvening: '04:45 PM', sequence: 4 },
        ],
        isActive: true,
      },
      {
        routeName: 'Ibrahimpatnam → College Campus',
        routeNumber: 'R-104',
        startLocation: 'Ibrahimpatnam Ring',
        destination: 'AIET Campus Main Gate',
        assignedBus: seededBuses[3]._id,
        stops: [
          { stopName: 'Ibrahimpatnam Ring', timeMorning: '07:15 AM', timeEvening: '05:45 PM', sequence: 1 },
          { stopName: 'Gollapudi Center', timeMorning: '07:35 AM', timeEvening: '05:25 PM', sequence: 2 },
          { stopName: 'Bhavanipuram', timeMorning: '07:45 AM', timeEvening: '05:15 PM', sequence: 3 },
          { stopName: 'AIET Campus', timeMorning: '08:15 AM', timeEvening: '04:50 PM', sequence: 4 },
        ],
        isActive: true,
      },
    ];

    for (const r of routeSeeds) {
      const exists = await BusRoute.findOne({ routeNumber: r.routeNumber });
      if (!exists) {
        await BusRoute.create(r);
      }
    }

    // CAMPUSVOICE (8 SUGGESTIONS WITH VOTES)
    const suggestionSeeds = [
      {
        title: 'Extend Central Library opening hours till 10:00 PM during semester examinations',
        description: 'Students preparing for mid-term and end-semester examinations need a quiet, air-conditioned space with digital library terminals after 6:00 PM.',
        category: 'Library',
        createdBy: studentUsers[0]._id,
        status: 'Planned',
        upvotes: [studentUsers[0]._id, studentUsers[1]._id, studentUsers[2]._id, studentUsers[3]._id, studentUsers[4]._id, studentUsers[5]._id],
        upvotesCount: 6,
        adminResponse: 'Approved by the Academic Council. Library will remain open until 10:00 PM starting next week.',
        respondedBy: admin._id,
        respondedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        title: 'Add more power outlet charging stations in classroom desks',
        description: 'With increasing use of laptops for coding lab sessions, desks in 3rd-floor classrooms require dual socket power strips.',
        category: 'Campus Facilities',
        createdBy: studentUsers[2]._id,
        status: 'Under Review',
        upvotes: [studentUsers[2]._id, studentUsers[3]._id, studentUsers[6]._id, studentUsers[7]._id],
        upvotesCount: 4,
      },
      {
        title: 'Upgrade Wi-Fi bandwidth in Tech Block B labs',
        description: 'AI model downloads and Docker image pulls require upgraded gigabit connection in AI and Data Science blocks.',
        category: 'Campus Facilities',
        createdBy: studentUsers[4]._id,
        status: 'Implemented',
        upvotes: [studentUsers[4]._id, studentUsers[5]._id, studentUsers[0]._id, studentUsers[1]._id, studentUsers[2]._id],
        upvotesCount: 5,
        adminResponse: 'Dedicated 1 Gbps fiber uplink activated in Tech Block B.',
        respondedBy: admin._id,
        respondedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      },
      {
        title: 'Install chilled RO drinking water dispensers near sports complex',
        description: 'Athletes and evening sports participants need accessible clean water dispensers near the pavilion.',
        category: 'Campus Facilities',
        createdBy: studentUsers[6]._id,
        status: 'Submitted',
        upvotes: [studentUsers[6]._id, studentUsers[7]._id, studentUsers[8]._id],
        upvotesCount: 3,
      },
      {
        title: 'Conduct regular hands-on Cloud Computing & Kubernetes workshops',
        description: 'Industry guest speaker workshops focused on AWS, GCP, and cloud-native certifications.',
        category: 'Academic',
        createdBy: studentUsers[16]._id,
        status: 'Planned',
        upvotes: [studentUsers[16]._id, studentUsers[17]._id, studentUsers[0]._id, studentUsers[1]._id],
        upvotesCount: 4,
        adminResponse: 'Scheduled with Coding Club for next month.',
        respondedBy: admin._id,
        respondedAt: new Date(),
      },
      {
        title: 'Increase evening sports ground lighting and equipment availability',
        description: 'Volleyball and badminton courts need enhanced floodlighting to support matches after 5:30 PM.',
        category: 'Extracurricular',
        createdBy: studentUsers[18]._id,
        status: 'Under Review',
        upvotes: [studentUsers[18]._id, studentUsers[19]._id, studentUsers[20]._id],
        upvotesCount: 3,
      },
      {
        title: 'Create dedicated collaborative student startup workspace',
        description: 'Designate quiet meeting pods in the central block for hackathon teams and project collaboration.',
        category: 'Campus Facilities',
        createdBy: studentUsers[10]._id,
        status: 'Submitted',
        upvotes: [studentUsers[10]._id, studentUsers[11]._id, studentUsers[12]._id, studentUsers[13]._id],
        upvotesCount: 4,
      },
      {
        title: 'Provide specialized company-specific placement training series',
        description: 'Weekend sessions focusing on product company coding interviews and system design questions.',
        category: 'Academic',
        createdBy: studentUsers[22]._id,
        status: 'Implemented',
        upvotes: [studentUsers[22]._id, studentUsers[23]._id, studentUsers[9]._id, studentUsers[17]._id, studentUsers[7]._id],
        upvotesCount: 5,
        adminResponse: 'Career Development Center has scheduled weekly placement tracks.',
        respondedBy: admin._id,
        respondedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      },
    ];

    for (const sug of suggestionSeeds) {
      const exists = await Suggestion.findOne({ title: sug.title });
      if (!exists) {
        await Suggestion.create(sug);
      }
    }
    console.log('  Seeded Clubs, Events, Transit Routes, and CampusVoice Suggestions.');

    // -------------------------------------------------------------------------
    // 17. NOTIFICATIONS TIED TO SEEDED RECORDS
    // -------------------------------------------------------------------------
    console.log(' [17/17] Generating Contextual Notifications...');
    const notificationSeeds = [
      {
        recipient: studentUsers[0]._id, // Aarav
        sender: studentUsers[1]._id, // Sahithi
        title: 'SkillSwap Request Accepted',
        message: 'Sahithi Rao accepted your request to swap Python for React.',
        type: 'skill_request',
        link: '/skills',
        isRead: false,
      },
      {
        recipient: studentUsers[0]._id, // Aarav
        sender: admin._id,
        title: 'Resource Booking Confirmed',
        message: 'Your booking for CSE Computer Lab 1 (Ref: BKG-DEMO-001) is approved.',
        type: 'booking_status',
        link: '/slots',
        isRead: false,
      },
      {
        recipient: studentUsers[2]._id, // Vamsi
        sender: staffUsers[2]._id, // Govind
        title: 'CampusFix Ticket Update',
        message: 'Ticket #FIX-DEMO-0002 for Wi-Fi in AI Lab has been assigned to technical staff.',
        type: 'complaint_updated',
        link: '/campus-fix',
        isRead: false,
      },
      {
        recipient: studentUsers[0]._id, // Aarav
        sender: admin._id,
        title: 'Hackathon Registration Confirmed',
        message: 'You are registered for AIET HackSprint 2026. Ticket code: TKT-AIE-STU-101.',
        type: 'event_registration',
        link: '/events',
        isRead: true,
      },
      {
        recipient: studentUsers[6]._id, // Sai Kiran
        sender: studentUsers[0]._id,
        title: 'Project Collaboration Invitation',
        message: 'Aarav Reddy invited you to collaborate on Smart Campus Parking System.',
        type: 'project_invite',
        link: '/projects',
        isRead: false,
      },
    ];

    for (const n of notificationSeeds) {
      const exists = await Notification.findOne({ recipient: n.recipient, title: n.title });
      if (!exists) {
        await Notification.create(n);
      }
    }

    // Connections between peer students
    const connectionsSeeds = [
      { requester: studentUsers[0]._id, recipient: studentUsers[1]._id, status: 'accepted' },
      { requester: studentUsers[0]._id, recipient: studentUsers[2]._id, status: 'accepted' },
      { requester: studentUsers[2]._id, recipient: studentUsers[3]._id, status: 'accepted' },
      { requester: studentUsers[4]._id, recipient: studentUsers[5]._id, status: 'accepted' },
    ];
    for (const c of connectionsSeeds) {
      const exists = await Connection.findOne({
        $or: [
          { requester: c.requester, recipient: c.recipient },
          { requester: c.recipient, recipient: c.requester },
        ]
      });
      if (!exists) {
        await Connection.create(c);
      }
    }

    console.log('\n======================================================================');
    console.log('   🎉 [ANDHRA PRADESH DEMO DATASET] SEEDED SUCCESSFULLY!              ');
    console.log('======================================================================');
    console.log('  Institution: Andhra Institute of Engineering & Technology (AIET)');
    console.log('  Location:    Vijayawada, Andhra Pradesh');
    console.log('  Password:    password123 (for all demo accounts)\n');
    console.log('  🔑 Demo Accounts:');
    console.log('    • Admin:               admin@demo.collegehub.local');
    console.log('    • CSE Faculty HOD:     faculty.cse1@demo.collegehub.local');
    console.log('    • ECE Faculty HOD:     faculty.ece1@demo.collegehub.local');
    console.log('    • Student (Aarav):     student.cse01@demo.collegehub.local');
    console.log('    • Student (Sahithi):   student.cse02@demo.collegehub.local');
    console.log('    • Student (Vamsi):     student.aiml01@demo.collegehub.local');
    console.log('    • Maintenance Staff:   staff.maint1@demo.collegehub.local');
    console.log('    • Transit Staff:       staff.trans1@demo.collegehub.local');
    console.log('    • Club Lead:           coord.coding@demo.collegehub.local');
    console.log('======================================================================\n');

  } catch (err) {
    console.error('❌ Error during demo dataset seeding:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

seedDemoData();
