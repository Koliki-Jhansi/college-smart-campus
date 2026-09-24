const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');
const FacultyProfile = require('../models/FacultyProfile');
const StaffProfile = require('../models/StaffProfile');
const SystemConfig = require('../models/SystemConfig');
const { generateToken, generateRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const { logAuditAction } = require('../middleware/auditMiddleware');

// @desc    Register new user (Student, Faculty, Staff)
// @desc    Register new user (Student, Faculty, Staff)
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res, next) => {
  try {
    const {
      name,
      email,
      password,
      role = 'student',
      phone,
      // Student Fields
      collegeId,
      department,
      course,
      year,
      semester,
      section,
      // Faculty Fields
      employeeId,
      designation,
      // Staff Fields
      staffType,
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Please provide your full name.' });
    }
    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, message: 'Please provide a valid campus email address.' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
    }

    const validRoles = ['student', 'faculty', 'club_coordinator', 'maintenance_staff', 'transport_staff'];
    if (role && !validRoles.includes(role)) {
      return res.status(400).json({ success: false, message: `Invalid role selected: ${role}.` });
    }

    // Check existing email
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'A user with this email address already exists.' });
    }

    // Role-specific validation BEFORE creating user
    if (role === 'student') {
      if (!collegeId || !collegeId.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Student registration requires Roll Number / College ID.',
        });
      }
      if (!department || !department.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Student registration requires Department.',
        });
      }
      if (!year || isNaN(Number(year)) || Number(year) < 1 || Number(year) > 6) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a valid academic year (1-6).',
        });
      }
      if (!semester || isNaN(Number(semester)) || Number(semester) < 1 || Number(semester) > 12) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a valid semester (1-12).',
        });
      }

      // Check unique Roll Number
      const existingStudent = await StudentProfile.findOne({ collegeId: collegeId.trim().toUpperCase() });
      if (existingStudent) {
        return res.status(409).json({ success: false, message: 'A student with this College ID / Roll Number already exists.' });
      }
    } else if (role === 'faculty') {
      if (!employeeId || !employeeId.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Faculty registration requires Employee ID.',
        });
      }
      if (!department || !department.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Faculty registration requires Department.',
        });
      }
      if (!designation || !designation.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Faculty registration requires Designation.',
        });
      }

      const existingFaculty = await FacultyProfile.findOne({ employeeId: employeeId.trim().toUpperCase() });
      if (existingFaculty) {
        return res.status(409).json({ success: false, message: 'Faculty with this Employee ID already exists.' });
      }
    } else if (['maintenance_staff', 'transport_staff', 'club_coordinator'].includes(role)) {
      const staffEmpId = (employeeId && employeeId.trim()) || `STF-${Date.now().toString().slice(-5)}`;
      const existingStaff = await StaffProfile.findOne({ employeeId: staffEmpId.toUpperCase() });
      if (existingStaff) {
        return res.status(409).json({ success: false, message: 'Staff with this Employee ID already exists.' });
      }
    }

    // Check config for staff approval requirement
    let config = null;
    try {
      config = await SystemConfig.findOne();
    } catch (_) {}
    const isStaffRole = ['maintenance_staff', 'transport_staff', 'club_coordinator'].includes(role);
    const isApproved = config && config.requireStaffApproval && isStaffRole ? false : true;

    // Create User
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role,
      phone: phone ? phone.trim() : '',
      isApproved,
    });

    try {
      // Create Role-Specific Profile
      if (role === 'student') {
        await StudentProfile.create({
          user: user._id,
          collegeId: collegeId.trim().toUpperCase(),
          department: department.trim(),
          course: course ? course.trim() : 'B.Tech',
          year: Number(year),
          semester: Number(semester),
          section: section ? section.trim().toUpperCase() : 'A',
        });
      } else if (role === 'faculty') {
        await FacultyProfile.create({
          user: user._id,
          employeeId: employeeId.trim().toUpperCase(),
          department: department.trim(),
          designation: designation.trim(),
        });
      } else if (['maintenance_staff', 'transport_staff', 'club_coordinator'].includes(role)) {
        const staffKind = role === 'maintenance_staff' ? 'maintenance' : (role === 'transport_staff' ? 'transport' : 'general');
        const staffEmpId = (employeeId && employeeId.trim()) || `STF-${Date.now().toString().slice(-5)}`;

        await StaffProfile.create({
          user: user._id,
          employeeId: staffEmpId.toUpperCase(),
          staffType: staffType && ['maintenance', 'transport', 'general'].includes(staffType) ? staffType : staffKind,
          assignedDepartment: department ? department.trim() : 'Campus Services',
        });
      }
    } catch (profileErr) {
      await User.findByIdAndDelete(user._id);
      throw profileErr;
    }

    const token = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    user.refreshToken = refreshToken;
    user.lastLogin = new Date();
    await user.save();

    await logAuditAction(req, 'REGISTER', 'Auth', user._id, { role: user.role, email: user.email });

    res.status(201).json({
      success: true,
      message: isApproved ? 'Registration successful!' : 'Registration successful! Your account is pending admin approval.',
      token,
      refreshToken,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        isApproved: user.isApproved,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Your account has been deactivated. Contact admin.' });
    }

    if (!user.isApproved) {
      return res.status(403).json({ success: false, message: 'Your account is pending administrator approval.' });
    }

    const token = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    user.refreshToken = refreshToken;
    user.lastLogin = new Date();
    await user.save();

    await logAuditAction(req, 'LOGIN', 'Auth', user._id, { role: user.role });

    const config = await SystemConfig.findOne().catch(() => null);

    res.status(200).json({
      success: true,
      token,
      refreshToken,
      collegeSetupCompleted: Boolean(config?.collegeSetupCompleted),
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        phone: user.phone,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get current authenticated user & profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    let profile = null;
    if (user.role === 'student') {
      profile = await StudentProfile.findOne({ user: user._id });
    } else if (user.role === 'faculty') {
      profile = await FacultyProfile.findOne({ user: user._id });
    } else if (['maintenance_staff', 'transport_staff', 'club_coordinator'].includes(user.role)) {
      profile = await StaffProfile.findOne({ user: user._id });
    }

    const config = await SystemConfig.findOne().catch(() => null);

    res.status(200).json({
      success: true,
      user,
      profile,
      collegeSetupCompleted: Boolean(config?.collegeSetupCompleted),
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Refresh access token
// @route   POST /api/auth/refresh
// @access  Public
const refreshTokenHandler = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ success: false, message: 'Refresh token required.' });
    }

    const decoded = verifyRefreshToken(refreshToken);
    const user = await User.findById(decoded.id).select('+refreshToken');

    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({ success: false, message: 'Invalid or expired refresh token.' });
    }

    const newToken = generateToken(user);
    res.status(200).json({
      success: true,
      token: newToken,
    });
  } catch (err) {
    res.status(401).json({ success: false, message: 'Invalid refresh token.' });
  }
};

// @desc    Setup First Admin Safely if no Admin exists
// @route   POST /api/auth/setup-admin
// @access  Public
const setupFirstAdmin = async (req, res, next) => {
  try {
    const adminCount = await User.countDocuments({ role: 'admin' });
    if (adminCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'An administrator account already exists. Please log in.',
      });
    }

    const { name, email, password, phone } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
    }

    const admin = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: 'admin',
      phone: phone ? phone.trim() : '',
      isApproved: true,
      isActive: true,
    });

    // Ensure system config exists with collegeSetupCompleted false
    let config = await SystemConfig.findOne();
    if (!config) {
      config = await SystemConfig.create({
        collegeName: '',
        collegeCode: '',
        contactEmail: admin.email,
        collegeSetupCompleted: false,
      });
    }

    const token = generateToken(admin);
    const refreshToken = generateRefreshToken(admin);

    admin.refreshToken = refreshToken;
    admin.lastLogin = new Date();
    await admin.save();

    res.status(201).json({
      success: true,
      message: 'Master Administrator created successfully!',
      token,
      refreshToken,
      collegeSetupCompleted: Boolean(config?.collegeSetupCompleted),
      user: {
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Change Password
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Please provide both current and new password.' });
    }

    const user = await User.findById(req.user._id).select('+password');
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: 'Password updated successfully.' });
  } catch (err) {
    next(err);
  }
};

// @desc    Check if First Admin setup is required
// @route   GET /api/auth/setup-admin-check
// @access  Public
const checkFirstAdmin = async (req, res, next) => {
  try {
    const adminCount = await User.countDocuments({ role: 'admin' });
    const config = await SystemConfig.findOne().catch(() => null);
    res.status(200).json({
      success: true,
      needsFirstAdmin: adminCount === 0,
      adminExists: adminCount > 0,
      collegeSetupCompleted: Boolean(config?.collegeSetupCompleted),
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  register,
  login,
  getMe,
  refreshTokenHandler,
  setupFirstAdmin,
  checkFirstAdmin,
  changePassword,
};
