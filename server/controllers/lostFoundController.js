const LostFoundItem = require('../models/LostFoundItem');
const { calculateMatchScore } = require('../utils/matchScoreHelper');
const { sendNotificationToUser } = require('../sockets/socketHandler');

// @desc    Get Lost & Found Items with filtering
// @route   GET /api/lost-found
// @access  Private
const getItems = async (req, res, next) => {
  try {
    const { type, category, status, search, page = 1, limit = 12 } = req.query;
    const query = {};

    if (type && type !== 'All') {
      query.type = type.toLowerCase();
    }
    if (category && category !== 'All') {
      query.category = category;
    }
    if (status && status !== 'All') {
      query.status = status;
    }
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { brand: searchRegex },
        { color: searchRegex },
        { location: searchRegex },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await LostFoundItem.countDocuments(query);

    const items = await LostFoundItem.find(query)
      .populate('createdBy', 'name email avatar')
      .populate('returnedTo', 'name')
      .sort({ date: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.json({
      success: true,
      items,
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

// @desc    Report Lost or Found Item
// @route   POST /api/lost-found
// @access  Private
const reportItem = async (req, res, next) => {
  try {
    const {
      type, // 'lost' or 'found'
      title,
      description,
      category,
      brand,
      color,
      location,
      date,
      secretDetails, // private verification detail
    } = req.body;

    if (!type || !title || !description || !category || !location || !date) {
      return res.status(400).json({ success: false, message: 'Type, title, description, category, location, and date are required.' });
    }

    let photo = '';
    if (req.file) {
      photo = `/uploads/${req.file.filename}`;
    }

    const item = await LostFoundItem.create({
      type: type.toLowerCase(),
      title: title.trim(),
      description,
      category,
      brand: brand || '',
      color: color || '',
      location: location.trim(),
      date: new Date(date),
      photo,
      secretDetails: secretDetails || '',
      createdBy: req.user._id,
      status: 'Open',
    });

    // Check for potential matches automatically
    const oppositeType = type.toLowerCase() === 'lost' ? 'found' : 'lost';
    const potentialOpposites = await LostFoundItem.find({
      type: oppositeType,
      status: { $in: ['Open', 'Possible Match'] },
    });

    let highestMatch = null;
    let highestScore = 0;

    for (const opp of potentialOpposites) {
      const lost = type.toLowerCase() === 'lost' ? item : opp;
      const found = type.toLowerCase() === 'lost' ? opp : item;
      const { score } = calculateMatchScore(lost, found);

      if (score > highestScore && score >= 40) {
        highestScore = score;
        highestMatch = opp;
      }
    }

    if (highestMatch && highestScore >= 50) {
      item.status = 'Possible Match';
      await item.save();

      highestMatch.status = 'Possible Match';
      await highestMatch.save();

      // Notify owners of both
      await sendNotificationToUser(highestMatch.createdBy, {
        sender: req.user._id,
        title: 'Possible Match Found! 🔍',
        message: `A newly reported ${type} item ("${item.title}") matches your ${highestMatch.type} item ("${highestMatch.title}").`,
        type: 'lost_found_match',
        link: `/campus-lost/${highestMatch._id}`,
      });
    }

    res.status(201).json({
      success: true,
      message: `${type === 'lost' ? 'Lost' : 'Found'} item reported successfully!`,
      item,
      possibleMatchFound: highestScore >= 50,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get Item Details & Transparent Matches
// @route   GET /api/lost-found/:id
// @access  Private
const getItemById = async (req, res, next) => {
  try {
    const item = await LostFoundItem.findById(req.params.id)
      .populate('createdBy', 'name email avatar phone')
      .populate('claims.claimedBy', 'name email avatar');

    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found.' });
    }

    // Authorize secret details view (only creator or admin)
    const isOwner = String(item.createdBy._id) === String(req.user._id);
    const isAdmin = req.user.role === 'admin';

    let secretDetails = undefined;
    if (isOwner || isAdmin) {
      const itemWithSecret = await LostFoundItem.findById(item._id).select('+secretDetails');
      secretDetails = itemWithSecret.secretDetails;
    }

    // Find transparent matches with opposite items
    const oppositeType = item.type === 'lost' ? 'found' : 'lost';
    const opposites = await LostFoundItem.find({
      type: oppositeType,
      status: { $nin: ['Returned', 'Closed'] },
    }).populate('createdBy', 'name');

    const calculatedMatches = [];
    for (const opp of opposites) {
      const lost = item.type === 'lost' ? item : opp;
      const found = item.type === 'lost' ? opp : item;
      const matchResult = calculateMatchScore(lost, found);

      if (matchResult.score >= 25) {
        calculatedMatches.push({
          item: opp,
          score: matchResult.score,
          matchLevel: matchResult.matchLevel,
          matchDetails: matchResult.matchDetails,
        });
      }
    }

    calculatedMatches.sort((a, b) => b.score - a.score);

    res.json({
      success: true,
      item: {
        ...item.toObject(),
        secretDetails,
      },
      matches: calculatedMatches,
      isOwner,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Claim Found Item (Submit verification proof)
// @route   POST /api/lost-found/:id/claim
// @access  Private
const submitClaim = async (req, res, next) => {
  try {
    const { message, verificationProof } = req.body;
    const item = await LostFoundItem.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found.' });
    }

    if (String(item.createdBy) === String(req.user._id)) {
      return res.status(400).json({ success: false, message: 'You cannot claim an item you reported.' });
    }

    item.claims.push({
      claimedBy: req.user._id,
      message: message || '',
      verificationProof: verificationProof || '',
      claimedAt: new Date(),
    });

    item.status = 'Claim Requested';
    await item.save();

    await sendNotificationToUser(item.createdBy, {
      sender: req.user._id,
      title: 'Ownership Claim Submitted 📦',
      message: `${req.user.name} submitted an ownership claim for "${item.title}".`,
      type: 'lost_found_claim',
      link: `/campus-lost/${item._id}`,
    });

    res.status(201).json({
      success: true,
      message: 'Claim submitted. The reporter/moderator will verify your details.',
      item,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Verify & Return Item
// @route   PUT /api/lost-found/:id/return
// @access  Private
const confirmReturn = async (req, res, next) => {
  try {
    const { claimId } = req.body;
    const item = await LostFoundItem.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found.' });
    }

    const isOwner = String(item.createdBy) === String(req.user._id);
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Only the item reporter or admin can confirm returns.' });
    }

    const claim = item.claims.id(claimId);
    if (!claim) {
      return res.status(404).json({ success: false, message: 'Claim not found.' });
    }

    claim.status = 'approved';
    item.status = 'Returned';
    item.returnedTo = claim.claimedBy;
    item.returnedAt = new Date();
    await item.save();

    await sendNotificationToUser(claim.claimedBy, {
      sender: req.user._id,
      title: 'Item Return Confirmed! 🎉',
      message: `Your claim for "${item.title}" was verified and marked as returned.`,
      type: 'general',
      link: `/campus-lost/${item._id}`,
    });

    res.json({ success: true, message: 'Item marked as returned!', item });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getItems,
  reportItem,
  getItemById,
  submitClaim,
  confirmReturn,
};
