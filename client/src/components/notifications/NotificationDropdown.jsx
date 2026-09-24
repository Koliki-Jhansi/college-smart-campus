import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { notificationApi } from '../../api/client';
import { Bell, CheckCheck, Sparkles, ExternalLink, Clock } from 'lucide-react';

const NotificationDropdown = ({ onClose, onUpdateCount }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    try {
      const res = await notificationApi.getNotifications();
      if (res.data.success) {
        setNotifications(res.data.notifications || []);
        onUpdateCount(res.data.unreadCount || 0);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      onUpdateCount(0);
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const handleNotificationClick = async (notif) => {
    try {
      if (!notif.isRead) {
        await notificationApi.markAsRead(notif._id);
        setNotifications((prev) =>
          prev.map((n) => (n._id === notif._id ? { ...n, isRead: true } : n))
        );
        onUpdateCount((prev) => Math.max(0, prev - 1));
      }
      onClose();
      if (notif.link) {
        navigate(notif.link);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="absolute right-0 mt-3 w-80 sm:w-96 glass-card rounded-3xl p-4 shadow-2xl border border-slate-700/80 z-50 animate-in fade-in zoom-in-95 duration-100">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-indigo-400" />
          <h4 className="text-sm font-bold text-white">Campus Notifications</h4>
        </div>
        <button
          onClick={handleMarkAllRead}
          className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
        >
          <CheckCheck className="w-3.5 h-3.5" />
          <span>Mark all read</span>
        </button>
      </div>

      {/* Notifications List */}
      <div className="max-h-80 overflow-y-auto py-2 divide-y divide-slate-800/60">
        {loading ? (
          <div className="py-8 text-center text-xs text-slate-400">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">No notifications yet. You are all caught up!</div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif._id}
              onClick={() => handleNotificationClick(notif)}
              className={`p-3 rounded-2xl cursor-pointer transition-colors flex items-start gap-3 my-1 ${
                notif.isRead ? 'hover:bg-slate-800/60 opacity-75' : 'bg-indigo-950/40 hover:bg-indigo-900/50 border border-indigo-500/20'
              }`}
            >
              <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0 mt-0.5">
                <Sparkles className="w-4 h-4" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-white flex items-center justify-between">
                  <span className="truncate">{notif.title}</span>
                  {!notif.isRead && (
                    <span className="w-2 h-2 rounded-full bg-indigo-400 shrink-0"></span>
                  )}
                </div>
                <p className="text-xs text-slate-300 mt-1 line-clamp-2">{notif.message}</p>
                <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-2">
                  <Clock className="w-3 h-3" />
                  <span>{new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationDropdown;
