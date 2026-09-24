const express = require('express');
const router = express.Router();
const {
  getAllUsersAdmin,
  approveStaffAccount,
  updateUserStatusAdmin,
} = require('../controllers/userController');
const {
  getCollegeConfig,
  updateCollegeConfig,
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
} = require('../controllers/collegeConfigController');
const { protect, authorize } = require('../middleware/authMiddleware');

// All Admin routes require Admin authentication
router.use(protect, authorize('admin'));

// User Management
router.get('/users', getAllUsersAdmin);
router.patch('/users/:id/approve-staff', approveStaffAccount);
router.patch('/users/:id/status', updateUserStatusAdmin);

// Config
router.get('/config', getCollegeConfig);
router.put('/config', updateCollegeConfig);

// Departments
router.get('/departments', getDepartments);
router.post('/departments', createDepartment);
router.put('/departments/:id', updateDepartment);
router.delete('/departments/:id', deleteDepartment);

// Courses
router.get('/courses', getCourses);
router.post('/courses', createCourse);
router.put('/courses/:id', updateCourse);
router.delete('/courses/:id', deleteCourse);

// Academic Years
router.get('/academic-years', getAcademicYears);
router.post('/academic-years', createAcademicYear);
router.put('/academic-years/:id/set-current', setCurrentAcademicYear);

module.exports = router;
