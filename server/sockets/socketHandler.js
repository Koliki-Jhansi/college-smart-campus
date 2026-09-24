const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const Notification = require('../models/Notification');

let ioInstance = null;

const initSocketIO = (io) => {
  ioInstance = io;

  // Track online users: map of userId -> Set of socketIds
  const userSockets = new Map();

  io.on('connection', (socket) => {
    // console.log(`[Socket] Client connected: ${socket.id}`);

    socket.on('authenticate', (userId) => {
      if (!userId) return;
      socket.userId = userId;
      socket.join(`user:${userId}`);

      if (!userSockets.has(userId)) {
        userSockets.set(userId, new Set());
      }
      userSockets.get(userId).add(socket.id);
      // console.log(`[Socket] User ${userId} joined their personal room`);
    });

    socket.on('join_conversation', (conversationId) => {
      socket.join(`conv:${conversationId}`);
    });

    socket.on('leave_conversation', (conversationId) => {
      socket.leave(`conv:${conversationId}`);
    });

    socket.on('send_message', async (data) => {
      try {
        const { conversationId, senderId, text, attachments } = data;
        if (!conversationId || !senderId || !text) return;

        const message = await Message.create({
          conversation: conversationId,
          sender: senderId,
          text,
          attachments: attachments || [],
          readBy: [senderId],
        });

        const populatedMessage = await Message.findById(message._id).populate('sender', 'name avatar role');

        // Update conversation last message
        await Conversation.findByIdAndUpdate(conversationId, {
          lastMessage: text,
          lastMessageSender: senderId,
          lastMessageAt: new Date(),
        });

        // Broadcast to conversation room
        io.to(`conv:${conversationId}`).emit('new_message', {
          conversationId,
          message: populatedMessage,
        });

        // Notify other participants in the conversation
        const conv = await Conversation.findById(conversationId);
        if (conv && conv.participants) {
          conv.participants.forEach(pId => {
            if (String(pId) !== String(senderId)) {
              io.to(`user:${pId}`).emit('conversation_updated', {
                conversationId,
                lastMessage: text,
                senderId,
              });
            }
          });
        }
      } catch (err) {
        console.error('Socket message error:', err.message);
      }
    });

    socket.on('typing', ({ conversationId, userName }) => {
      socket.to(`conv:${conversationId}`).emit('user_typing', { conversationId, userName });
    });

    socket.on('stop_typing', ({ conversationId }) => {
      socket.to(`conv:${conversationId}`).emit('user_stop_typing', { conversationId });
    });

    socket.on('disconnect', () => {
      if (socket.userId && userSockets.has(socket.userId)) {
        const set = userSockets.get(socket.userId);
        set.delete(socket.id);
        if (set.size === 0) {
          userSockets.delete(socket.userId);
        }
      }
    });
  });
};

const sendNotificationToUser = async (recipientId, notificationData) => {
  try {
    const notif = await Notification.create({
      recipient: recipientId,
      sender: notificationData.sender || null,
      title: notificationData.title,
      message: notificationData.message,
      type: notificationData.type || 'general',
      link: notificationData.link || '',
    });

    const populated = await Notification.findById(notif._id).populate('sender', 'name avatar');

    if (ioInstance) {
      ioInstance.to(`user:${recipientId}`).emit('new_notification', populated);
    }
    return notif;
  } catch (err) {
    console.error('Error sending notification:', err.message);
  }
};

const broadcastToRole = (role, event, data) => {
  if (ioInstance) {
    ioInstance.emit(`role:${role}`, { event, data });
  }
};

const broadcastSystemUpdate = (event, data) => {
  if (ioInstance) {
    ioInstance.emit('system_event', { event, data });
  }
};

module.exports = {
  initSocketIO,
  sendNotificationToUser,
  broadcastToRole,
  broadcastSystemUpdate,
};
