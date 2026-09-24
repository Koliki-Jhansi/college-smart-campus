const Project = require('../models/Project');
const ProjectJoinRequest = require('../models/ProjectJoinRequest');
const ProjectTask = require('../models/ProjectTask');
const Conversation = require('../models/Conversation');
const { sendNotificationToUser } = require('../sockets/socketHandler');

// @desc    Get all projects with filtering & pagination
// @route   GET /api/projects
// @access  Private
const getProjects = async (req, res, next) => {
  try {
    const {
      search,
      category,
      status,
      technology,
      skill,
      page = 1,
      limit = 9,
    } = req.query;

    const query = {};

    if (category && category !== 'All') {
      query.category = category;
    }

    if (status && status !== 'All') {
      query.status = status;
    }

    if (technology) {
      query.technologies = { $regex: new RegExp(technology, 'i') };
    }

    if (skill) {
      query.requiredSkills = { $regex: new RegExp(skill, 'i') };
    }

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { problemStatement: searchRegex },
        { technologies: searchRegex },
        { requiredSkills: searchRegex },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Project.countDocuments(query);

    const projects = await Project.find(query)
      .populate('createdBy', 'name email avatar')
      .populate('members.user', 'name email avatar')
      .populate('mentor', 'name email designation')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.json({
      success: true,
      projects,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get My Projects (Created by me or Member of)
// @route   GET /api/projects/my
// @access  Private
const getMyProjects = async (req, res, next) => {
  try {
    const projects = await Project.find({
      $or: [
        { createdBy: req.user._id },
        { 'members.user': req.user._id },
        { mentor: req.user._id }
      ]
    })
      .populate('createdBy', 'name avatar')
      .populate('members.user', 'name avatar')
      .populate('mentor', 'name designation')
      .sort({ updatedAt: -1 });

    const pendingRequests = await ProjectJoinRequest.find({
      applicant: req.user._id,
      status: 'pending'
    }).populate('project', 'title category status');

    res.json({
      success: true,
      count: projects.length,
      projects,
      pendingRequests,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get Single Project Detail
// @route   GET /api/projects/:id
// @access  Private
const getProjectById = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('createdBy', 'name email avatar role')
      .populate('members.user', 'name email avatar role')
      .populate('mentor', 'name email designation avatar');

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    const tasks = await ProjectTask.find({ project: project._id })
      .populate('assignedTo', 'name avatar')
      .sort({ createdAt: -1 });

    const joinRequests = await ProjectJoinRequest.find({ project: project._id })
      .populate('applicant', 'name email avatar')
      .sort({ createdAt: -1 });

    // Check user membership status
    const isOwner = String(project.createdBy._id) === String(req.user._id);
    const isMember = project.members.some(m => String(m.user._id) === String(req.user._id));
    const isMentor = project.mentor && String(project.mentor._id) === String(req.user._id);

    const existingRequest = await ProjectJoinRequest.findOne({
      project: project._id,
      applicant: req.user._id,
    });

    res.json({
      success: true,
      project,
      tasks,
      joinRequests: (isOwner || req.user.role === 'admin') ? joinRequests : [],
      userStatus: {
        isOwner,
        isMember,
        isMentor,
        hasPendingRequest: existingRequest && existingRequest.status === 'pending',
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create Project
// @route   POST /api/projects
// @access  Private
const createProject = async (req, res, next) => {
  try {
    const {
      title,
      description,
      problemStatement,
      category,
      technologies,
      requiredSkills,
      maxTeamSize = 4,
      status = 'Recruiting',
      githubRepo,
      liveDemo,
      mentor,
    } = req.body;

    if (!title || !description) {
      return res.status(400).json({ success: false, message: 'Title and description are required.' });
    }

    const cleanArray = (val) => {
      if (Array.isArray(val)) return val.map(s => String(s).trim()).filter(Boolean);
      if (typeof val === 'string') return val.split(',').map(s => s.trim()).filter(Boolean);
      return [];
    };

    const project = await Project.create({
      title: title.trim(),
      description,
      problemStatement: problemStatement || '',
      category: category || 'Web Development',
      technologies: cleanArray(technologies),
      requiredSkills: cleanArray(requiredSkills),
      maxTeamSize: Number(maxTeamSize) || 4,
      status,
      githubRepo: githubRepo || '',
      liveDemo: liveDemo || '',
      createdBy: req.user._id,
      mentor: mentor || null,
      members: [{
        user: req.user._id,
        role: 'Team Lead / Creator',
        joinedAt: new Date(),
      }],
      activityLog: [{
        action: 'Created project idea',
        user: req.user._id,
        timestamp: new Date(),
      }],
    });

    // Create group conversation for project team chat
    await Conversation.create({
      type: 'project',
      participants: [req.user._id],
      referenceId: project._id,
      title: `${project.title} Team Chat`,
    });

    res.status(201).json({
      success: true,
      message: 'Project created successfully!',
      project,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update Project
// @route   PUT /api/projects/:id
// @access  Private
const updateProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    const isOwner = String(project.createdBy) === String(req.user._id);
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Only project owner can update project settings.' });
    }

    const {
      title,
      description,
      problemStatement,
      category,
      technologies,
      requiredSkills,
      maxTeamSize,
      status,
      githubRepo,
      liveDemo,
      progress,
    } = req.body;

    const cleanArray = (val) => {
      if (Array.isArray(val)) return val.map(s => String(s).trim()).filter(Boolean);
      if (typeof val === 'string') return val.split(',').map(s => s.trim()).filter(Boolean);
      return undefined;
    };

    if (title) project.title = title.trim();
    if (description) project.description = description;
    if (problemStatement !== undefined) project.problemStatement = problemStatement;
    if (category) project.category = category;
    if (technologies !== undefined) project.technologies = cleanArray(technologies);
    if (requiredSkills !== undefined) project.requiredSkills = cleanArray(requiredSkills);
    if (maxTeamSize) project.maxTeamSize = Number(maxTeamSize);
    if (status) project.status = status;
    if (githubRepo !== undefined) project.githubRepo = githubRepo;
    if (liveDemo !== undefined) project.liveDemo = liveDemo;
    if (progress !== undefined) project.progress = Number(progress);

    project.activityLog.push({
      action: `Updated project details`,
      user: req.user._id,
    });

    await project.save();

    res.json({ success: true, message: 'Project updated successfully.', project });
  } catch (err) {
    next(err);
  }
};

// @desc    Request to Join Project
// @route   POST /api/projects/:id/join-request
// @access  Private
const applyToProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    // Check team capacity
    if (project.members.length >= project.maxTeamSize) {
      return res.status(400).json({ success: false, message: 'This project team has reached its maximum size.' });
    }

    // Check if already member
    if (project.members.some(m => String(m.user) === String(req.user._id))) {
      return res.status(400).json({ success: false, message: 'You are already a member of this project.' });
    }

    // Check duplicate request
    const existing = await ProjectJoinRequest.findOne({
      project: project._id,
      applicant: req.user._id,
    });

    if (existing && existing.status === 'pending') {
      return res.status(400).json({ success: false, message: 'You already have a pending join request.' });
    }

    const { message, roleOffered, skills } = req.body;

    const request = await ProjectJoinRequest.create({
      project: project._id,
      applicant: req.user._id,
      message: message || '',
      roleOffered: roleOffered || 'Developer',
      skills: Array.isArray(skills) ? skills : (skills ? skills.split(',').map(s => s.trim()) : []),
    });

    // Notify Project Owner
    await sendNotificationToUser(project.createdBy, {
      sender: req.user._id,
      title: 'New Project Join Request',
      message: `${req.user.name} requested to join "${project.title}".`,
      type: 'project_join_request',
      link: `/projects/${project._id}`,
    });

    res.status(201).json({
      success: true,
      message: 'Join request submitted to project creator!',
      request,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Accept / Reject Join Request
// @route   PUT /api/projects/requests/:requestId
// @access  Private
const handleJoinRequest = async (req, res, next) => {
  try {
    const { requestId } = req.params;
    const { action } = req.body; // 'accept' or 'reject'

    const joinReq = await ProjectJoinRequest.findById(requestId).populate('project');
    if (!joinReq) {
      return res.status(404).json({ success: false, message: 'Join request not found.' });
    }

    const project = await Project.findById(joinReq.project._id);
    if (String(project.createdBy) !== String(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only the project owner can approve join requests.' });
    }

    if (action === 'accept') {
      if (project.members.length >= project.maxTeamSize) {
        return res.status(400).json({ success: false, message: 'Team is already full.' });
      }

      // Add to members
      project.members.push({
        user: joinReq.applicant,
        role: joinReq.roleOffered || 'Developer',
        joinedAt: new Date(),
      });

      project.activityLog.push({
        action: `Accepted new team member`,
        user: joinReq.applicant,
      });

      await project.save();

      // Add to conversation room
      await Conversation.findOneAndUpdate(
        { type: 'project', referenceId: project._id },
        { $addToSet: { participants: joinReq.applicant } }
      );

      joinReq.status = 'accepted';
      await joinReq.save();

      await sendNotificationToUser(joinReq.applicant, {
        sender: req.user._id,
        title: 'Project Request Accepted! 🎉',
        message: `You were accepted into "${project.title}"! Welcome to the team.`,
        type: 'project_invite',
        link: `/projects/${project._id}`,
      });

      return res.json({ success: true, message: 'Member accepted to project!', project });
    } else {
      joinReq.status = 'rejected';
      await joinReq.save();
      return res.json({ success: true, message: 'Join request declined.' });
    }
  } catch (err) {
    next(err);
  }
};

// @desc    Add Project Task
// @route   POST /api/projects/:id/tasks
// @access  Private (Project Member)
const addProjectTask = async (req, res, next) => {
  try {
    const { title, description, assignedTo, priority, dueDate } = req.body;
    if (!title) {
      return res.status(400).json({ success: false, message: 'Task title is required.' });
    }

    const task = await ProjectTask.create({
      project: req.params.id,
      title: title.trim(),
      description: description || '',
      assignedTo: assignedTo || null,
      priority: priority || 'medium',
      dueDate: dueDate || null,
      createdBy: req.user._id,
    });

    const populated = await ProjectTask.findById(task._id).populate('assignedTo', 'name avatar');

    res.status(201).json({ success: true, message: 'Task added.', task: populated });
  } catch (err) {
    next(err);
  }
};

// @desc    Update Task Status
// @route   PUT /api/projects/tasks/:taskId
// @access  Private
const updateTaskStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const task = await ProjectTask.findByIdAndUpdate(req.params.taskId, { status }, { new: true })
      .populate('assignedTo', 'name avatar');

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    res.json({ success: true, task });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getProjects,
  getMyProjects,
  getProjectById,
  createProject,
  updateProject,
  applyToProject,
  handleJoinRequest,
  addProjectTask,
  updateTaskStatus,
};
