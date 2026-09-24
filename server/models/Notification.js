const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: [
      'connection_request',
      'connection_accepted',
      'project_invite',
      'project_join_request',
      'project_status_update',
      'skill_request',
      'skill_session_scheduled',
      'booking_status',
      'complaint_assigned',
      'complaint_updated',
      'complaint_resolved',
      'lost_found_match',
      'lost_found_claim',
      'event_registration',
      'club_request',
      'transport_announcement',
      'general'
    ],
    default: 'general',
  },
  link: {
    type: String,
    default: '',
  },
  isRead: {
    type: Boolean,
    default: false,
    index: true,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Notification', notificationSchema);
