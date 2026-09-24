const Department = require('../models/Department');
const Course = require('../models/Course');
const AcademicYear = require('../models/AcademicYear');
const Semester = require('../models/Semester');
const Section = require('../models/Section');
const CampusResource = require('../models/CampusResource');
const SystemConfig = require('../models/SystemConfig');
const StudentProfile = require('../models/StudentProfile');
const { logAuditAction } = require('../middleware/auditMiddleware');

// @desc    Get Public College Structure (For registration and public dropdowns)
// @route   GET /api/college/public-structure
// @access  Public
const getPublicStructure = async (req, res, next) => {
  try {
    const config = await SystemConfig.findOne().catch(() => null);

    // If config does not exist or college setup is not completed
    if (!config || !config.collegeSetupCompleted || !config.collegeName) {
      return res.status(200).json({
        success: true,
        configured: false,
        message: 'College setup has not been completed yet. Please contact the administrator.',
        college: null,
        departments: [],
        programs: [],
      });
    }

    const departments = await Department.find({ isActive: true })
      .select('_id name code description')
      .sort({ name: 1 })
      .catch(() => []);

    const programs = await Course.find({ isActive: true })
      .populate('department', '_id name code')
      .select('_id name code department departmentCode degreeType duration totalSemesters')
      .sort({ name: 1 })
      .catch(() => []);

    const currentAcademicYear = await AcademicYear.findOne({ isCurrent: true }).catch(() => null);
    const sections = await Section.find().sort({ name: 1 }).catch(() => []);

    return res.status(200).json({
      success: true,
      configured: true,
      college: {
        collegeName: config.collegeName,
        shortName: config.shortName || '',
        collegeCode: config.collegeCode || '',
        collegeLogo: config.collegeLogo || '',
        address: config.address || '',
        city: config.city || '',
        state: config.state || '',
        website: config.website || '',
        contactEmail: config.contactEmail || '',
        phone: config.phone || '',
        currentAcademicYear: currentAcademicYear ? currentAcademicYear.year : (config.currentAcademicYear || '2026-2027'),
      },
      departments: departments || [],
      programs: programs || [],
      courses: programs || [], // backwards compatibility alias
      sections: sections || [],
      academicYear: currentAcademicYear ? currentAcademicYear.year : (config.currentAcademicYear || '2026-2027'),
    });
  } catch (err) {
    // Graceful fallback for completely empty database
    return res.status(200).json({
      success: true,
      configured: false,
      message: 'College setup has not been completed yet.',
      college: null,
      departments: [],
      programs: [],
    });
  }
};

// @desc    Get College Config (Admin)
// @route   GET /api/college/config
// @access  Private (Admin)
const getCollegeConfig = async (req, res, next) => {
  try {
    let config = await SystemConfig.findOne();
    if (!config) {
      config = await SystemConfig.create({
        collegeSetupCompleted: false,
      });
    }
    res.status(200).json({ success: true, config });
  } catch (err) {
    next(err);
  }
};

// @desc    Update College Config (Admin)
// @route   PUT /api/college/config
// @access  Private (Admin)
const updateCollegeConfig = async (req, res, next) => {
  try {
    let config = await SystemConfig.findOne();
    if (!config) {
      config = new SystemConfig();
    }

    const {
      collegeName,
      shortName,
      collegeCode,
      collegeLogo,
      address,
      city,
      state,
      website,
      contactEmail,
      phone,
      currentAcademicYear,
      collegeSetupCompleted,
      slaSettings,
      allowPublicRegistration,
      requireStaffApproval,
    } = req.body;

    if (collegeName !== undefined) config.collegeName = collegeName.trim();
    if (shortName !== undefined) config.shortName = shortName.trim();
    if (collegeCode !== undefined) config.collegeCode = collegeCode.trim().toUpperCase();
    if (collegeLogo !== undefined) config.collegeLogo = collegeLogo;
    if (address !== undefined) config.address = address;
    if (city !== undefined) config.city = city;
    if (state !== undefined) config.state = state;
    if (website !== undefined) config.website = website;
    if (contactEmail !== undefined) config.contactEmail = contactEmail;
    if (phone !== undefined) config.phone = phone;
    if (currentAcademicYear !== undefined) config.currentAcademicYear = currentAcademicYear;
    if (collegeSetupCompleted !== undefined) config.collegeSetupCompleted = Boolean(collegeSetupCompleted);
    if (slaSettings) config.slaSettings = { ...config.slaSettings, ...slaSettings };
    if (allowPublicRegistration !== undefined) config.allowPublicRegistration = allowPublicRegistration;
    if (requireStaffApproval !== undefined) config.requireStaffApproval = requireStaffApproval;

    await config.save();
    await logAuditAction(req, 'UPDATE_CONFIG', 'College', config._id, { collegeName: config.collegeName });

    res.status(200).json({ success: true, message: 'College settings updated successfully.', config });
  } catch (err) {
    next(err);
  }
};

// @desc    Complete Initial College Setup Wizard
// @route   POST /api/college/complete-setup
// @access  Private (Admin)
const completeCollegeSetup = async (req, res, next) => {
  try {
    let config = await SystemConfig.findOne();
    if (!config) {
      config = new SystemConfig();
    }

    const payload = req.body || {};
    const collegeData = payload.college || payload;

    if (collegeData.collegeName) config.collegeName = collegeData.collegeName.trim();
    if (collegeData.shortName) config.shortName = collegeData.shortName.trim();
    if (collegeData.collegeCode) config.collegeCode = collegeData.collegeCode.trim().toUpperCase();
    if (collegeData.collegeLogo) config.collegeLogo = collegeData.collegeLogo;
    if (collegeData.address) config.address = collegeData.address;
    if (collegeData.city) config.city = collegeData.city;
    if (collegeData.state) config.state = collegeData.state;
    if (collegeData.website) config.website = collegeData.website;
    if (collegeData.contactEmail) config.contactEmail = collegeData.contactEmail;
    if (collegeData.phone) config.phone = collegeData.phone;
    if (collegeData.currentAcademicYear) config.currentAcademicYear = collegeData.currentAcademicYear;

    config.collegeSetupCompleted = true;
    await config.save();

    // If batch departments passed, ensure created
    if (Array.isArray(payload.departments)) {
      for (const d of payload.departments) {
        if (d.name && d.code) {
          const exists = await Department.findOne({ code: d.code.trim().toUpperCase() });
          if (!exists) {
            await Department.create({
              name: d.name.trim(),
              code: d.code.trim().toUpperCase(),
              description: d.description || '',
              isActive: d.isActive !== false,
            });
          }
        }
      }
    }

    // If batch programs passed, ensure created
    if (Array.isArray(payload.programs)) {
      for (const p of payload.programs) {
        if (p.name && p.code) {
          const exists = await Course.findOne({ code: p.code.trim().toUpperCase() });
          if (!exists) {
            let deptId = p.department;
            if (!deptId && p.departmentCode) {
              const d = await Department.findOne({ code: p.departmentCode.trim().toUpperCase() });
              deptId = d ? d._id : null;
            }
            if (deptId) {
              await Course.create({
                name: p.name.trim(),
                code: p.code.trim().toUpperCase(),
                department: deptId,
                degreeType: p.degreeType || 'B.Tech',
                duration: p.duration || '4 Years',
                totalSemesters: Number(p.totalSemesters) || 8,
                isActive: p.isActive !== false,
              });
            }
          }
        }
      }
    }

    await logAuditAction(req, 'COMPLETE_SETUP', 'College', config._id, { collegeName: config.collegeName });

    res.status(200).json({
      success: true,
      message: 'College setup completed successfully! Registration is now live.',
      config,
    });
  } catch (err) {
    next(err);
  }
};

// --- DEPARTMENTS ---
const getDepartments = async (req, res, next) => {
  try {
    const departments = await Department.find().sort({ name: 1 });
    res.status(200).json({ success: true, count: departments.length, departments });
  } catch (err) {
    next(err);
  }
};

const createDepartment = async (req, res, next) => {
  try {
    const { name, code, description, headOfDepartment, isActive = true } = req.body;
    if (!name || !code) {
      return res.status(400).json({ success: false, message: 'Department Name and Code are required.' });
    }

    const existingCode = await Department.findOne({ code: code.trim().toUpperCase() });
    if (existingCode) {
      return res.status(409).json({ success: false, message: `Department code '${code.trim().toUpperCase()}' is already in use.` });
    }

    const existingName = await Department.findOne({ name: name.trim() });
    if (existingName) {
      return res.status(409).json({ success: false, message: `Department name '${name.trim()}' already exists.` });
    }

    const dept = await Department.create({
      name: name.trim(),
      code: code.trim().toUpperCase(),
      description: description ? description.trim() : '',
      headOfDepartment: headOfDepartment ? headOfDepartment.trim() : '',
      isActive: Boolean(isActive),
    });

    await logAuditAction(req, 'CREATE_DEPARTMENT', 'College', dept._id, { name: dept.name, code: dept.code });
    res.status(201).json({ success: true, message: 'Department created successfully.', department: dept });
  } catch (err) {
    next(err);
  }
};

const updateDepartment = async (req, res, next) => {
  try {
    const dept = await Department.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!dept) {
      return res.status(404).json({ success: false, message: 'Department not found.' });
    }
    await logAuditAction(req, 'UPDATE_DEPARTMENT', 'College', dept._id);
    res.status(200).json({ success: true, message: 'Department updated successfully.', department: dept });
  } catch (err) {
    next(err);
  }
};

const deleteDepartment = async (req, res, next) => {
  try {
    const dept = await Department.findById(req.params.id);
    if (!dept) {
      return res.status(404).json({ success: false, message: 'Department not found.' });
    }

    // Safe deletion: Check if courses reference this department
    const linkedCourses = await Course.countDocuments({ department: dept._id });
    if (linkedCourses > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete department '${dept.name}' because ${linkedCourses} course(s) are linked to it. Delete or reassign those courses first.`,
      });
    }

    await Department.findByIdAndDelete(req.params.id);
    await logAuditAction(req, 'DELETE_DEPARTMENT', 'College', dept._id, { name: dept.name });
    res.status(200).json({ success: true, message: 'Department deleted successfully.' });
  } catch (err) {
    next(err);
  }
};

// --- COURSES / PROGRAMS ---
const getCourses = async (req, res, next) => {
  try {
    const courses = await Course.find().populate('department', 'name code').sort({ name: 1 });
    res.status(200).json({ success: true, count: courses.length, courses });
  } catch (err) {
    next(err);
  }
};

const createCourse = async (req, res, next) => {
  try {
    const { name, code, department, degreeType, duration, totalSemesters, description, isActive = true } = req.body;
    if (!name || !code || !department) {
      return res.status(400).json({ success: false, message: 'Program Name, Code, and Department are required.' });
    }

    const existingCode = await Course.findOne({ code: code.trim().toUpperCase() });
    if (existingCode) {
      return res.status(409).json({ success: false, message: `Course/Program code '${code.trim().toUpperCase()}' is already in use.` });
    }

    const dept = await Department.findById(department);
    if (!dept) {
      return res.status(404).json({ success: false, message: 'Selected Department does not exist.' });
    }

    const course = await Course.create({
      name: name.trim(),
      code: code.trim().toUpperCase(),
      department,
      departmentCode: dept.code,
      degreeType: degreeType || 'B.Tech',
      duration: Number(duration) || 4,
      totalSemesters: Number(totalSemesters) || (Number(duration) ? Number(duration) * 2 : 8),
      description: description || '',
      isActive: Boolean(isActive),
    });

    await logAuditAction(req, 'CREATE_COURSE', 'College', course._id, { name: course.name, code: course.code });
    res.status(201).json({ success: true, message: 'Course/Program created successfully.', course });
  } catch (err) {
    next(err);
  }
};

const updateCourse = async (req, res, next) => {
  try {
    const course = await Course.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found.' });
    }
    res.status(200).json({ success: true, message: 'Course updated successfully.', course });
  } catch (err) {
    next(err);
  }
};

const deleteCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found.' });
    }

    // Safe deletion: Check if any student profiles reference this course
    const linkedStudents = await StudentProfile.countDocuments({ course: course.name });
    if (linkedStudents > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete course '${course.name}' because ${linkedStudents} student(s) are enrolled in it.`,
      });
    }

    await Course.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Course deleted successfully.' });
  } catch (err) {
    next(err);
  }
};

// --- ACADEMIC YEARS ---
const getAcademicYears = async (req, res, next) => {
  try {
    const years = await AcademicYear.find().sort({ year: -1 });
    res.status(200).json({ success: true, years });
  } catch (err) {
    next(err);
  }
};

const createAcademicYear = async (req, res, next) => {
  try {
    const { year, label, isCurrent } = req.body;
    if (!year || !year.trim()) {
      return res.status(400).json({ success: false, message: 'Academic Year is required (e.g. 2026-2027).' });
    }

    const existing = await AcademicYear.findOne({ year: year.trim() });
    if (existing) {
      return res.status(409).json({ success: false, message: `Academic Year '${year.trim()}' already exists.` });
    }

    if (isCurrent) {
      await AcademicYear.updateMany({}, { isCurrent: false });
    }

    const ay = await AcademicYear.create({
      year: year.trim(),
      label: label ? label.trim() : '',
      isCurrent: isCurrent || false,
    });

    res.status(201).json({ success: true, message: 'Academic Year created successfully.', academicYear: ay });
  } catch (err) {
    next(err);
  }
};

const setCurrentAcademicYear = async (req, res, next) => {
  try {
    await AcademicYear.updateMany({}, { isCurrent: false });
    const ay = await AcademicYear.findByIdAndUpdate(req.params.id, { isCurrent: true }, { new: true });
    if (!ay) {
      return res.status(404).json({ success: false, message: 'Academic Year not found.' });
    }
    res.status(200).json({ success: true, message: 'Current Academic Year updated.', academicYear: ay });
  } catch (err) {
    next(err);
  }
};

// --- SECTIONS ---
const getSections = async (req, res, next) => {
  try {
    const sections = await Section.find().populate('department', 'name code').sort({ name: 1 });
    res.status(200).json({ success: true, sections });
  } catch (err) {
    next(err);
  }
};

const createSection = async (req, res, next) => {
  try {
    const { name, department, semester, maxStudents } = req.body;
    if (!name || semester === undefined) {
      return res.status(400).json({ success: false, message: 'Section Name and Semester are required.' });
    }

    const section = await Section.create({
      name: name.trim().toUpperCase(),
      department: department || null,
      semester: Number(semester),
      maxStudents: Number(maxStudents) || 60,
    });

    res.status(201).json({ success: true, message: 'Section created.', section });
  } catch (err) {
    next(err);
  }
};

const deleteSection = async (req, res, next) => {
  try {
    const section = await Section.findByIdAndDelete(req.params.id);
    if (!section) {
      return res.status(404).json({ success: false, message: 'Section not found.' });
    }
    res.status(200).json({ success: true, message: 'Section removed.' });
  } catch (err) {
    next(err);
  }
};

// --- CAMPUS RESOURCES (FACILITIES & LABS) ---
const getCampusResources = async (req, res, next) => {
  try {
    const resources = await CampusResource.find().sort({ name: 1 });
    res.status(200).json({ success: true, count: resources.length, resources });
  } catch (err) {
    next(err);
  }
};

const createCampusResource = async (req, res, next) => {
  try {
    const { name, category, location, building, block, roomNumber, capacity, description, approvalRequired } = req.body;
    if (!name || !category || !location) {
      return res.status(400).json({ success: false, message: 'Name, Category, and Location are required.' });
    }

    const resource = await CampusResource.create({
      name: name.trim(),
      category,
      location: location.trim(),
      building: building ? building.trim() : '',
      block: block ? block.trim() : '',
      roomNumber: roomNumber ? roomNumber.trim() : '',
      capacity: Number(capacity) || 30,
      description: description || '',
      approvalRequired: approvalRequired !== false,
      isActive: true,
    });

    res.status(201).json({ success: true, message: 'Campus facility registered.', resource });
  } catch (err) {
    next(err);
  }
};

const updateCampusResource = async (req, res, next) => {
  try {
    const resource = await CampusResource.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!resource) {
      return res.status(404).json({ success: false, message: 'Resource not found.' });
    }
    res.status(200).json({ success: true, message: 'Resource updated.', resource });
  } catch (err) {
    next(err);
  }
};

const deleteCampusResource = async (req, res, next) => {
  try {
    const resource = await CampusResource.findByIdAndDelete(req.params.id);
    if (!resource) {
      return res.status(404).json({ success: false, message: 'Resource not found.' });
    }
    res.status(200).json({ success: true, message: 'Campus facility removed.' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getPublicStructure,
  getCollegeConfig,
  updateCollegeConfig,
  completeCollegeSetup,
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  getCourses,
  createCourse,
  updateCourse,
  deleteCourse,
  getAcademicYears,
  createAcademicYear,
  setCurrentAcademicYear,
  getSections,
  createSection,
  deleteSection,
  getCampusResources,
  createCampusResource,
  updateCampusResource,
  deleteCampusResource,
};

