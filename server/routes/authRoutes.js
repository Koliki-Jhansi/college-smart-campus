const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getMe,
  refreshTokenHandler,
  setupFirstAdmin,
  checkFirstAdmin,
  changePassword,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.post('/refresh', refreshTokenHandler);
router.get('/setup-admin-check', checkFirstAdmin);
router.get('/first-admin-status', checkFirstAdmin);
router.post('/setup-admin', setupFirstAdmin);
router.post('/setup-master-admin', setupFirstAdmin);
router.put('/change-password', protect, changePassword);

module.exports = router;
