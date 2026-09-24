const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/collegeConfigController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Public structure for registrations & guest views
router.get('/public-structure', getPublicStructure);
router.get('/structure', getPublicStructure);

// Admin Configuration & Setup Wizard
router.get('/config', protect, authorize('admin'), getCollegeConfig);
router.put('/config', protect, authorize('admin'), updateCollegeConfig);
router.post('/complete-setup', protect, authorize('admin'), completeCollegeSetup);

// Departments
router.get('/departments', getDepartments);
router.post('/departments', protect, authorize('admin'), createDepartment);
router.put('/departments/:id', protect, authorize('admin'), updateDepartment);
router.delete('/departments/:id', protect, authorize('admin'), deleteDepartment);

// Courses / Programs
router.get('/courses', getCourses);
router.get('/programs', getCourses);
router.post('/courses', protect, authorize('admin'), createCourse);
router.post('/programs', protect, authorize('admin'), createCourse);
router.put('/courses/:id', protect, authorize('admin'), updateCourse);
router.put('/programs/:id', protect, authorize('admin'), updateCourse);
router.delete('/courses/:id', protect, authorize('admin'), deleteCourse);
router.delete('/programs/:id', protect, authorize('admin'), deleteCourse);

// Academic Years
router.get('/academic-years', getAcademicYears);
router.post('/academic-years', protect, authorize('admin'), createAcademicYear);
router.put('/academic-years/:id/set-current', protect, authorize('admin'), setCurrentAcademicYear);

// Sections
router.get('/sections', getSections);
router.post('/sections', protect, authorize('admin'), createSection);
router.delete('/sections/:id', protect, authorize('admin'), deleteSection);

// Campus Facilities & Resources
router.get('/resources', getCampusResources);
router.post('/resources', protect, authorize('admin'), createCampusResource);
router.put('/resources/:id', protect, authorize('admin'), updateCampusResource);
router.delete('/resources/:id', protect, authorize('admin'), deleteCampusResource);

module.exports = router;

