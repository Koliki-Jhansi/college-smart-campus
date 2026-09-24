const mongoose = require('mongoose');

const lostFoundItemSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['lost', 'found'],
    required: true,
    index: true,
  },
  title: {
    type: String,
    required: [true, 'Item title is required'],
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
  },
  category: {
    type: String,
    enum: ['Electronics', 'ID Cards & Wallets', 'Keys', 'Books & Stationery', 'Clothing & Accessories', 'Bags', 'Bottles', 'Other'],
    required: true,
    index: true,
  },
  brand: {
    type: String,
    default: '',
    trim: true,
  },
  color: {
    type: String,
    default: '',
    trim: true,
  },
  location: {
    type: String,
    required: [true, 'Location is required'],
    trim: true,
  },
  date: {
    type: Date,
    required: true,
    index: true,
  },
  photo: {
    type: String,
    default: '',
  },
  secretDetails: {
    type: String,
    default: '', // Private unique identifying marks used for ownership verification
    select: false, // Hidden from public listings
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  status: {
    type: String,
    enum: ['Open', 'Possible Match', 'Claim Requested', 'Verified', 'Returned', 'Closed'],
    default: 'Open',
    index: true,
  },
  claims: [{
    claimedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    verificationProof: String,
    message: String,
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    claimedAt: { type: Date, default: Date.now },
  }],
  returnedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  returnedAt: Date,
}, {
  timestamps: true,
});

lostFoundItemSchema.index({ type: 1, category: 1, status: 1 });

module.exports = mongoose.model('LostFoundItem', lostFoundItemSchema);
