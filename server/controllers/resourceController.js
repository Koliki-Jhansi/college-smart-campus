const StudyResource = require('../models/StudyResource');
const ResourceBookmark = require('../models/ResourceBookmark');
const ResourceReport = require('../models/ResourceReport');
const path = require('path');
const fs = require('fs');

// @desc    Get resources with search & filters
// @route   GET /api/resources
// @access  Private
const getResources = async (req, res, next) => {
  try {
    const {
      search,
      department,
      semester,
      type,
      page = 1,
      limit = 12,
    } = req.query;

    const query = { isReported: false };

    if (department && department !== 'All') {
      query.department = department;
    }
    if (semester && semester !== 'All') {
      query.semester = Number(semester);
    }
    if (type && type !== 'All') {
      query.type = type;
    }

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { subject: searchRegex },
        { tags: searchRegex },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await StudyResource.countDocuments(query);

    const resources = await StudyResource.find(query)
      .populate('uploadedBy', 'name email avatar role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    // Get user's bookmarked resource IDs
    const bookmarks = await ResourceBookmark.find({ user: req.user._id });
    const bookmarkedIds = new Set(bookmarks.map(b => String(b.resource)));

    const enriched = resources.map(r => ({
      ...r.toObject(),
      isBookmarked: bookmarkedIds.has(String(r._id)),
    }));

    res.json({
      success: true,
      resources: enriched,
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

// @desc    Upload new resource
// @route   POST /api/resources
// @access  Private
const uploadResource = async (req, res, next) => {
  try {
    const {
      title,
      description,
      subject,
      department,
      semester,
      type = 'Notes',
      externalUrl,
      tags,
    } = req.body;

    if (!title || !subject || !department || !semester) {
      return res.status(400).json({ success: false, message: 'Title, subject, department, and semester are required.' });
    }

    let fileUrl = '';
    let fileSize = 0;
    let mimeType = '';

    if (req.file) {
      fileUrl = `/uploads/${req.file.filename}`;
      fileSize = req.file.size;
      mimeType = req.file.mimetype;
    } else if (!externalUrl) {
      return res.status(400).json({ success: false, message: 'Please upload a file or provide an external resource URL.' });
    }

    const cleanTags = Array.isArray(tags) ? tags : (tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : []);

    const resource = await StudyResource.create({
      title: title.trim(),
      description: description || '',
      subject: subject.trim(),
      department,
      semester: Number(semester),
      type,
      fileUrl,
      externalUrl: externalUrl || '',
      fileSize,
      mimeType,
      tags: cleanTags,
      uploadedBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: 'Resource uploaded successfully!',
      resource,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Download / Access resource & record legitimate download count
// @route   GET /api/resources/:id/download
// @access  Private
const recordDownload = async (req, res, next) => {
  try {
    const resource = await StudyResource.findByIdAndUpdate(
      req.params.id,
      { $inc: { downloadCount: 1 } },
      { new: true }
    );

    if (!resource) {
      return res.status(404).json({ success: false, message: 'Resource not found.' });
    }

    res.json({
      success: true,
      fileUrl: resource.fileUrl,
      externalUrl: resource.externalUrl,
      downloadCount: resource.downloadCount,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Toggle Bookmark Resource
// @route   POST /api/resources/:id/bookmark
// @access  Private
const toggleBookmark = async (req, res, next) => {
  try {
    const existing = await ResourceBookmark.findOne({
      user: req.user._id,
      resource: req.params.id,
    });

    if (existing) {
      await ResourceBookmark.findByIdAndDelete(existing._id);
      await StudyResource.findByIdAndUpdate(req.params.id, { $inc: { bookmarksCount: -1 } });
      return res.json({ success: true, bookmarked: false, message: 'Bookmark removed.' });
    } else {
      await ResourceBookmark.create({
        user: req.user._id,
        resource: req.params.id,
      });
      await StudyResource.findByIdAndUpdate(req.params.id, { $inc: { bookmarksCount: 1 } });
      return res.json({ success: true, bookmarked: true, message: 'Resource bookmarked!' });
    }
  } catch (err) {
    next(err);
  }
};

// @desc    Get My Bookmarked Resources
// @route   GET /api/resources/my-bookmarks
// @access  Private
const getMyBookmarks = async (req, res, next) => {
  try {
    const bookmarks = await ResourceBookmark.find({ user: req.user._id })
      .populate({
        path: 'resource',
        populate: { path: 'uploadedBy', select: 'name avatar role' }
      })
      .sort({ createdAt: -1 });

    const resources = bookmarks.map(b => b.resource).filter(Boolean);

    res.json({
      success: true,
      count: resources.length,
      resources: resources.map(r => ({ ...r.toObject(), isBookmarked: true })),
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Report inappropriate resource
// @route   POST /api/resources/:id/report
// @access  Private
const reportResource = async (req, res, next) => {
  try {
    const { reason } = req.body;
    if (!reason) {
      return res.status(400).json({ success: false, message: 'Please provide a reason for the report.' });
    }

    await ResourceReport.create({
      reporter: req.user._id,
      resource: req.params.id,
      reason,
    });

    res.status(201).json({
      success: true,
      message: 'Resource reported. Campus moderators will review it shortly.',
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getResources,
  uploadResource,
  recordDownload,
  toggleBookmark,
  getMyBookmarks,
  reportResource,
};
