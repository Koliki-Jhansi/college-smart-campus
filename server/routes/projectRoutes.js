const express = require('express');
const router = express.Router();
const {
  getProjects,
  getMyProjects,
  getProjectById,
  createProject,
  updateProject,
  applyToProject,
  handleJoinRequest,
  addProjectTask,
  updateTaskStatus,
} = require('../controllers/projectController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getProjects);
router.get('/my', protect, getMyProjects);
router.get('/:id', protect, getProjectById);
router.post('/', protect, createProject);
router.put('/:id', protect, updateProject);
router.post('/:id/join-request', protect, applyToProject);
router.put('/requests/:requestId', protect, handleJoinRequest);
router.post('/:id/tasks', protect, addProjectTask);
router.put('/tasks/:taskId', protect, updateTaskStatus);

module.exports = router;
