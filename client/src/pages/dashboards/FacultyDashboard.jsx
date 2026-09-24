import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { analyticsApi } from '../../api/client';
import StatsCard from '../../components/common/StatsCard';
import { LoadingState } from '../../components/common/LoadingState';
import { Briefcase, BookOpen, FileText, CalendarCheck, Wrench, Sparkles } from 'lucide-react';

const FacultyDashboard = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await analyticsApi.getDashboardData();
        if (res.data.success) {
          setData(res.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <LoadingState message="Loading faculty portal metrics..." />;

  const m = data?.metrics || {};

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-emerald-950/80 via-slate-900 to-slate-900 border border-emerald-500/20 shadow-2xl">
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold w-fit mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Faculty Portal Active</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
          Welcome, Prof. {user?.name}
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 mt-1.5">
          {profile?.department || 'Department'} • {profile?.designation || 'Faculty Member'} • Employee ID: {profile?.employeeId || 'N/A'}
        </p>
      </div>

      {/* Real-time Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
        <StatsCard
          title="Mentored Projects"
          value={m.mentoredProjects}
          icon={Briefcase}
          color="emerald"
          subtitle="Active student projects guided"
          onClick={() => navigate('/projects')}
        />
        <StatsCard
          title="Shared Resources"
          value={m.sharedResources}
          icon={FileText}
          color="indigo"
          subtitle="Notes & reference papers"
          onClick={() => navigate('/resources')}
        />
        <StatsCard
          title="Study Groups"
          value={m.studyGroups}
          icon={BookOpen}
          color="purple"
          subtitle="Department learning groups"
          onClick={() => navigate('/study-hub')}
        />
        <StatsCard
          title="Resource Bookings"
          value={m.resourceBookings}
          icon={CalendarCheck}
          color="cyan"
          subtitle="Lab & seminar hall slots"
          onClick={() => navigate('/campus-slot')}
        />
        <StatsCard
          title="CampusFix Tickets"
          value={m.complaints}
          icon={Wrench}
          color="amber"
          subtitle="Reported facility issues"
          onClick={() => navigate('/campus-fix')}
        />
      </div>
    </div>
  );
};

export default FacultyDashboard;
