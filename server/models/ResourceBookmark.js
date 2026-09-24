const mongoose = require('mongoose');

const resourceBookmarkSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  resource: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StudyResource',
    required: true,
    index: true,
  }
}, {
  timestamps: true,
});

resourceBookmarkSchema.index({ user: 1, resource: 1 }, { unique: true });

module.exports = mongoose.model('ResourceBookmark', resourceBookmarkSchema);
