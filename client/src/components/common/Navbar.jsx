import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import {
  Search,
  Bell,
  MessageSquare,
  LogOut,
  User as UserIcon,
  Shield,
  GraduationCap,
  Sparkles,
  Award,
} from 'lucide-react';
import NotificationDropdown from '../notifications/NotificationDropdown';
import { notificationApi } from '../../api/client';

const Navbar = ({ onToggleSidebar, onToggleChat }) => {
  const { user, logout, isStudent, isAdmin } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const fetchUnreadNotifications = async () => {
    try {
      const res = await notificationApi.getNotifications();
      if (res.data.success) {
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch (err) {
      // ignore
    }
  };

  useEffect(() => {
    if (user) {
      fetchUnreadNotifications();
    }
  }, [user]);

  useEffect(() => {
    if (socket) {
      socket.on('new_notification', () => {
        setUnreadCount((prev) => prev + 1);
      });

      return () => {
        socket.off('new_notification');
      };
    }
  }, [socket]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const roleBadgeColor = {
    student: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
    faculty: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    admin: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    club_coordinator: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    maintenance_staff: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
    transport_staff: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
  }[user?.role] || 'bg-slate-800 text-slate-300 border-slate-700';

  return (
    <header className="sticky top-0 z-30 h-16 glass-nav px-4 lg:px-6 flex items-center justify-between gap-4">
      {/* Search Bar */}
      <form onSubmit={handleSearchSubmit} className="flex-1 max-w-lg relative">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Global search students, skills, projects, events, resources, clubs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-900/90 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500/70 focus:ring-1 focus:ring-indigo-500/50 transition-all"
          />
        </div>
      </form>

      {/* Action Buttons */}
      <div className="flex items-center gap-2.5">
        {/* Chat Drawer Toggle */}
        <button
          onClick={onToggleChat}
          className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-all relative"
          title="Campus Chat"
        >
          <MessageSquare className="w-5 h-5" />
        </button>

        {/* Notifications Toggle */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-all relative"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <NotificationDropdown
              onClose={() => setShowNotifications(false)}
              onUpdateCount={(newCount) => setUnreadCount(newCount)}
            />
          )}
        </div>

        {/* Role Badge */}
        <div className={`hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-lg border text-xs font-semibold uppercase tracking-wider ${roleBadgeColor}`}>
          {user?.role === 'admin' ? <Shield className="w-3.5 h-3.5" /> : <GraduationCap className="w-3.5 h-3.5" />}
          <span>{user?.role?.replace('_', ' ')}</span>
        </div>

        {/* User Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-900 border border-transparent hover:border-slate-800 transition-all"
          >
            {user?.avatar ? (
              <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-lg object-cover border border-indigo-500/30" />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center text-white font-bold text-sm shadow-md">
                {user?.name?.charAt(0) || 'U'}
              </div>
            )}
            <span className="hidden md:inline text-sm font-medium text-slate-200">{user?.name}</span>
          </button>

          {showUserMenu && (
            <div
              className="absolute right-0 mt-2 w-56 glass-card rounded-2xl p-2 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-100"
              onClick={() => setShowUserMenu(false)}
            >
              <div className="px-3 py-2 border-b border-slate-800">
                <div className="text-sm font-semibold text-white">{user?.name}</div>
                <div className="text-xs text-slate-400 truncate">{user?.email}</div>
              </div>

              <div className="py-1">
                <Link
                  to={`/profile/${user?._id}`}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <UserIcon className="w-4 h-4 text-indigo-400" />
                  <span>My Profile</span>
                </Link>

                {isStudent && (
                  <Link
                    to="/my-certificates"
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                  >
                    <Award className="w-4 h-4 text-amber-400" />
                    <span>My Certificates</span>
                  </Link>
                )}

                {isAdmin && (
                  <Link
                    to="/admin/college-setup"
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                  >
                    <Shield className="w-4 h-4 text-rose-400" />
                    <span>College Settings</span>
                  </Link>
                )}
              </div>

              <div className="pt-1 border-t border-slate-800">
                <button
                  onClick={logout}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-rose-400 hover:bg-rose-500/10 transition-colors text-left"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
