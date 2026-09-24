const express = require('express');
const router = express.Router();
const {
  getResources,
  uploadResource,
  recordDownload,
  toggleBookmark,
  getMyBookmarks,
  reportResource,
} = require('../controllers/resourceController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.get('/', protect, getResources);
router.post('/', protect, upload.single('file'), uploadResource);
router.get('/:id/download', protect, recordDownload);
router.post('/:id/bookmark', protect, toggleBookmark);
router.get('/my-bookmarks', protect, getMyBookmarks);
router.post('/:id/report', protect, reportResource);

module.exports = router;
