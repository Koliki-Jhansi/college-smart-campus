import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Repeat,
  BookOpen,
  FileText,
  CalendarCheck,
  Wrench,
  SearchCheck,
  Calendar,
  Flag,
  Bus,
  MessageSquareHeart,
  ShieldAlert,
  Award,
  Settings,
  Sparkles,
  ChevronRight,
} from 'lucide-react';

const Sidebar = () => {
  const { user, isStudent, isFaculty, isMaintenanceStaff, isTransportStaff, isClubCoordinator, isAdmin } = useAuth();

  const getDashboardLink = () => {
    if (isAdmin) return '/admin/dashboard';
    if (isMaintenanceStaff) return '/maintenance/dashboard';
    if (isTransportStaff) return '/transport/dashboard';
    if (isClubCoordinator) return '/club/dashboard';
    if (isFaculty) return '/faculty/dashboard';
    return '/dashboard'; // Student
  };

  const navGroups = [
    {
      title: 'OVERVIEW',
      items: [
        { label: 'Dashboard', path: getDashboardLink(), icon: LayoutDashboard },
        ...(isStudent ? [{ label: 'CampusConnect', path: '/campus-connect', icon: Users }] : []),
      ],
    },
    {
      title: 'ACADEMICS & COLLABORATION',
      items: [
        { label: 'ProjectHub', path: '/projects', icon: Briefcase },
        { label: 'SkillSwap', path: '/skill-swap', icon: Repeat },
        { label: 'StudyHub', path: '/study-hub', icon: BookOpen },
        { label: 'Resource Library', path: '/resources', icon: FileText },
      ],
    },
    {
      title: 'CAMPUS SERVICES',
      items: [
        { label: 'CampusSlot Bookings', path: '/campus-slot', icon: CalendarCheck },
        { label: 'CampusFix Maintenance', path: '/campus-fix', icon: Wrench },
        { label: 'CampusLost & Found', path: '/campus-lost', icon: SearchCheck },
        { label: 'CampusRide Transit', path: '/campus-ride', icon: Bus },
      ],
    },
    {
      title: 'STUDENT LIFE',
      items: [
        { label: 'EventHub', path: '/events', icon: Calendar },
        { label: 'Campus Clubs', path: '/clubs', icon: Flag },
        { label: 'CampusVoice Ideas', path: '/campus-voice', icon: MessageSquareHeart },
        ...(isStudent ? [{ label: 'My Certificates', path: '/my-certificates', icon: Award }] : []),
      ],
    },
  ];

  if (isAdmin) {
    navGroups.push({
      title: 'ADMINISTRATION',
      items: [
        { label: 'College Setup', path: '/admin/college-setup', icon: Settings },
        { label: 'User Management', path: '/admin/users', icon: ShieldAlert },
      ],
    });
  }

  return (
    <aside className="w-64 shrink-0 bg-slate-950/95 border-r border-slate-800/80 flex flex-col h-screen sticky top-0">
      {/* Brand Header */}
      <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-800/80">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-indigo-500/30">
          CH
        </div>
        <div>
          <div className="text-base font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent">
            CollegeHub
          </div>
          <div className="text-[10px] uppercase font-bold tracking-widest text-indigo-400">
            Smart Campus OS
          </div>
        </div>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
        {navGroups.map((group, gIdx) => (
          <div key={gIdx} className="space-y-1.5">
            <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {group.title}
            </div>
            {group.items.map((item, idx) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={idx}
                  to={item.path}
                  end={item.path === '/dashboard' || item.path === '/admin/dashboard'}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 group ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 glow-border'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900'
                    }`
                  }
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" />
                    <span>{item.label}</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </NavLink>
              );
            })}
          </div>
        ))}
      </div>

      {/* Footer User Info */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-900/40">
        <div className="flex items-center gap-3">
          {user?.avatar ? (
            <img src={user.avatar} alt={user.name} className="w-9 h-9 rounded-xl object-cover border border-slate-700" />
          ) : (
            <div className="w-9 h-9 rounded-xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-300 font-bold text-sm">
              {user?.name?.charAt(0)}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold text-slate-200 truncate">{user?.name}</div>
            <div className="text-[10px] text-slate-400 capitalize">{user?.role?.replace('_', ' ')}</div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
