const express = require('express');
const router = express.Router();
const {
  getItems,
  reportItem,
  getItemById,
  submitClaim,
  confirmReturn,
} = require('../controllers/lostFoundController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.get('/', protect, getItems);
router.post('/', protect, upload.single('photo'), reportItem);
router.get('/:id', protect, getItemById);
router.post('/:id/claim', protect, submitClaim);
router.put('/:id/return', protect, confirmReturn);

module.exports = router;
