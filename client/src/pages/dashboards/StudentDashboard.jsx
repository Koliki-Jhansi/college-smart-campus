import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { analyticsApi, projectApi, eventApi, slotApi } from '../../api/client';
import StatsCard from '../../components/common/StatsCard';
import { LoadingState } from '../../components/common/LoadingState';
import EmptyState from '../../components/common/EmptyState';
import {
  Briefcase,
  Calendar,
  CalendarCheck,
  Wrench,
  Repeat,
  BookOpen,
  SearchCheck,
  Users,
  Sparkles,
  ArrowRight,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
} from 'lucide-react';

const StudentDashboard = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await analyticsApi.getDashboardData();
      if (res.data.success) {
        setDashboardData(res.data);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return <LoadingState message="Fetching your real-time campus hub metrics from MongoDB..." />;
  }

  const metrics = dashboardData?.metrics || {};
  const recentData = dashboardData?.data || {};

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Welcome Banner & Profile Completion */}
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-indigo-900/60 via-slate-900 to-slate-900 border border-indigo-500/20 shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Smart Campus OS Active</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Welcome back, {user?.name}! 👋
            </h1>
            <p className="text-sm text-slate-300 mt-2 max-w-xl">
              {profile?.department || 'CollegeHub'} • Year {profile?.year || 1} • Semester {profile?.semester || 1} • Roll No: {profile?.collegeId || 'N/A'}
            </p>
          </div>

          {/* Profile Completion Bar */}
          <div className="w-full md:w-72 bg-slate-950/80 rounded-2xl p-4 border border-slate-800 shrink-0">
            <div className="flex items-center justify-between text-xs font-bold mb-2">
              <span className="text-slate-300">Profile Completion</span>
              <span className="text-indigo-400">{metrics.profileCompletion || 40}%</span>
            </div>
            <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
                style={{ width: `${metrics.profileCompletion || 40}%` }}
              ></div>
            </div>
            {metrics.profileCompletion < 100 && (
              <Link
                to={`/profile/${user?._id}`}
                className="block text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 mt-2 text-right"
              >
                Add skills & social links →
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Real-time Metric Cards (Counted directly from MongoDB) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatsCard
          title="My Projects"
          value={metrics.myProjects}
          icon={Briefcase}
          color="indigo"
          subtitle={metrics.projectInvitations > 0 ? `${metrics.projectInvitations} join requests pending` : 'Active collaborations'}
          onClick={() => navigate('/projects')}
        />

        <StatsCard
          title="Registered Events"
          value={metrics.myEvents}
          icon={Calendar}
          color="emerald"
          subtitle="Events joined"
          onClick={() => navigate('/events')}
        />

        <StatsCard
          title="CampusFix Tickets"
          value={metrics.myComplaints}
          icon={Wrench}
          color={metrics.myComplaints > 0 ? 'amber' : 'slate'}
          subtitle={metrics.myComplaints > 0 ? 'Active maintenance requests' : 'Zero open issues'}
          onClick={() => navigate('/campus-fix')}
        />

        <StatsCard
          title="Active Bookings"
          value={metrics.activeBookings}
          icon={CalendarCheck}
          color="cyan"
          subtitle="Labs & halls reserved"
          onClick={() => navigate('/campus-slot')}
        />
      </div>

      {/* Secondary Quick Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div
          onClick={() => navigate('/skill-swap')}
          className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-purple-500/40 cursor-pointer transition-all flex items-center gap-3.5"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
            <Repeat className="w-5 h-5" />
          </div>
          <div>
            <div className="text-lg font-bold text-white">{metrics.upcomingSessions || 0}</div>
            <div className="text-xs text-slate-400">Skill Sessions</div>
          </div>
        </div>

        <div
          onClick={() => navigate('/study-hub')}
          className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-indigo-500/40 cursor-pointer transition-all flex items-center gap-3.5"
        >
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="text-lg font-bold text-white">{metrics.myStudyGroups || 0}</div>
            <div className="text-xs text-slate-400">Study Groups</div>
          </div>
        </div>

        <div
          onClick={() => navigate('/campus-connect')}
          className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-emerald-500/40 cursor-pointer transition-all flex items-center gap-3.5"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-lg font-bold text-white">{metrics.connections || 0}</div>
            <div className="text-xs text-slate-400">Peer Connections</div>
          </div>
        </div>

        <div
          onClick={() => navigate('/campus-lost')}
          className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-rose-500/40 cursor-pointer transition-all flex items-center gap-3.5"
        >
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
            <SearchCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-lg font-bold text-white">{metrics.lostFoundMatches || 0}</div>
            <div className="text-xs text-slate-400">Lost Item Matches</div>
          </div>
        </div>
      </div>

      {/* Grid: My Projects & Upcoming Campus Events */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* My Projects */}
        <div className="glass-card rounded-3xl p-6 border border-slate-800 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <Briefcase className="w-5 h-5 text-indigo-400" />
              <h3 className="text-base font-bold text-white">My Active Projects</h3>
            </div>
            <Link to="/projects" className="text-xs font-semibold text-indigo-400 hover:text-indigo-300">
              View all →
            </Link>
          </div>

          <div className="flex-1 space-y-3">
            {recentData.recentProjects?.length === 0 ? (
              <EmptyState
                icon={Briefcase}
                title="No projects yet"
                description="Create a project idea or join projects looking for your skills."
                actionLabel="Explore Projects"
                onAction={() => navigate('/projects')}
              />
            ) : (
              recentData.recentProjects?.map((proj) => (
                <div
                  key={proj._id}
                  onClick={() => navigate(`/projects/${proj._id}`)}
                  className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 cursor-pointer transition-all"
                >
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-sm font-bold text-white">{proj.title}</h4>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                      {proj.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-1">{proj.description}</p>
                  <div className="flex items-center gap-3 mt-3 text-[11px] text-slate-400">
                    <span>Category: {proj.category}</span>
                    <span>•</span>
                    <span>{proj.members?.length || 1} team members</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="glass-card rounded-3xl p-6 border border-slate-800 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <Calendar className="w-5 h-5 text-emerald-400" />
              <h3 className="text-base font-bold text-white">Upcoming Events</h3>
            </div>
            <Link to="/events" className="text-xs font-semibold text-emerald-400 hover:text-emerald-300">
              Browse Events →
            </Link>
          </div>

          <div className="flex-1 space-y-3">
            {recentData.upcomingEvents?.length === 0 ? (
              <EmptyState
                icon={Calendar}
                title="No upcoming events"
                description="Check back soon for hackathons, workshops, and sports tournaments."
                actionLabel="Explore EventHub"
                onAction={() => navigate('/events')}
              />
            ) : (
              recentData.upcomingEvents?.map((ev) => (
                <div
                  key={ev._id}
                  onClick={() => navigate(`/events/${ev._id}`)}
                  className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 cursor-pointer transition-all"
                >
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-sm font-bold text-white">{ev.title}</h4>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      {ev.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      <span>{new Date(ev.startDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-500" />
                      <span>{ev.venue}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
