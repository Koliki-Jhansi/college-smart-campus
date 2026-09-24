const Suggestion = require('../models/Suggestion');

// @desc    Get all suggestions with filters & sorting
// @route   GET /api/voice
// @access  Private
const getSuggestions = async (req, res, next) => {
  try {
    const { category, status, sortBy = 'upvotes', search } = req.query;
    const query = {};

    if (category && category !== 'All') {
      query.category = category;
    }
    if (status && status !== 'All') {
      query.status = status;
    }
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [{ title: searchRegex }, { description: searchRegex }];
    }

    let sortOption = { upvotesCount: -1 };
    if (sortBy === 'newest') sortOption = { createdAt: -1 };
    if (sortBy === 'oldest') sortOption = { createdAt: 1 };

    const suggestions = await Suggestion.find(query)
      .populate('createdBy', 'name avatar role')
      .populate('respondedBy', 'name designation role')
      .sort(sortOption);

    // Sanitize anonymous suggestions for non-admins
    const sanitized = suggestions.map(s => {
      const isMySuggestion = String(s.createdBy._id) === String(req.user._id);
      const isAdmin = req.user.role === 'admin';
      const hasUpvoted = s.upvotes.includes(req.user._id);

      const obj = s.toObject();
      if (s.isAnonymous && !isMySuggestion && !isAdmin) {
        obj.createdBy = {
          name: 'Anonymous Student',
          avatar: '',
          role: 'student',
        };
      }
      return {
        ...obj,
        hasUpvoted,
      };
    });

    res.json({ success: true, count: sanitized.length, suggestions: sanitized });
  } catch (err) {
    next(err);
  }
};

// @desc    Submit Suggestion / Idea
// @route   POST /api/voice
// @access  Private
const createSuggestion = async (req, res, next) => {
  try {
    const { title, description, category, isAnonymous } = req.body;

    if (!title || !description) {
      return res.status(400).json({ success: false, message: 'Title and description are required.' });
    }

    const suggestion = await Suggestion.create({
      title: title.trim(),
      description,
      category: category || 'Campus Facilities',
      createdBy: req.user._id,
      isAnonymous: Boolean(isAnonymous),
      status: 'Submitted',
      upvotes: [req.user._id], // Creator automatically upvotes their own suggestion
      upvotesCount: 1,
    });

    res.status(201).json({
      success: true,
      message: 'Suggestion posted to CampusVoice!',
      suggestion,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Toggle Upvote (Prevent multiple votes from same student)
// @route   POST /api/voice/:id/vote
// @access  Private
const toggleUpvote = async (req, res, next) => {
  try {
    const suggestion = await Suggestion.findById(req.params.id);
    if (!suggestion) {
      return res.status(404).json({ success: false, message: 'Suggestion not found.' });
    }

    const userIndex = suggestion.upvotes.indexOf(req.user._id);

    if (userIndex === -1) {
      suggestion.upvotes.push(req.user._id);
      suggestion.upvotesCount = suggestion.upvotes.length;
      await suggestion.save();
      return res.json({ success: true, upvoted: true, upvotesCount: suggestion.upvotesCount });
    } else {
      suggestion.upvotes.splice(userIndex, 1);
      suggestion.upvotesCount = suggestion.upvotes.length;
      await suggestion.save();
      return res.json({ success: true, upvoted: false, upvotesCount: suggestion.upvotesCount });
    }
  } catch (err) {
    next(err);
  }
};

// @desc    Admin Public Response & Status Update
// @route   PUT /api/voice/:id/respond
// @access  Private (Admin)
const respondToSuggestion = async (req, res, next) => {
  try {
    const { status, adminResponse } = req.body;
    const suggestion = await Suggestion.findById(req.params.id);

    if (!suggestion) {
      return res.status(404).json({ success: false, message: 'Suggestion not found.' });
    }

    if (status) suggestion.status = status;
    if (adminResponse !== undefined) suggestion.adminResponse = adminResponse;
    suggestion.respondedBy = req.user._id;
    suggestion.respondedAt = new Date();

    await suggestion.save();

    res.json({
      success: true,
      message: 'Official response recorded.',
      suggestion,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getSuggestions,
  createSuggestion,
  toggleUpvote,
  respondToSuggestion,
};
