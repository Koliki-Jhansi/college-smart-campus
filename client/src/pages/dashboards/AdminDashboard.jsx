import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { analyticsApi } from '../../api/client';
import StatsCard from '../../components/common/StatsCard';
import { LoadingState } from '../../components/common/LoadingState';
import {
  Users,
  GraduationCap,
  Briefcase,
  Calendar,
  Wrench,
  CalendarCheck,
  SearchCheck,
  Flag,
  BookOpen,
  FileText,
  Download,
  Shield,
  Settings,
  ShieldAlert,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminStats = async () => {
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
    fetchAdminStats();
  }, []);

  if (loading) return <LoadingState message="Aggregating campus-wide metrics from MongoDB..." />;

  const m = data?.metrics || {};
  const charts = data?.charts || {};

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#f43f5e', '#a855f7', '#38bdf8', '#ec4899'];

  const handleExportCSV = (type) => {
    window.open(analyticsApi.getExportUrl(type), '_blank');
  };

  const isConfigured = data?.collegeSetupCompleted !== false;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* College Setup Incomplete Warning Banner */}
      {!isConfigured && (
        <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
            <div>
              <h3 className="text-sm font-bold text-amber-300">Initial College Setup Pending</h3>
              <p className="text-xs text-amber-200/80 mt-0.5">
                The institutional profile, academic departments, and programs have not been completed. Complete the setup wizard so students and faculty can register.
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/admin/setup')}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs whitespace-nowrap shadow-lg shadow-amber-500/20 transition-all"
          >
            Launch Setup Wizard →
          </button>
        </div>
      )}

      {/* Top Banner */}
      <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border border-indigo-500/20 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold w-fit mb-3">
            <Shield className="w-3.5 h-3.5" />
            <span>Master Administration Authority</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Campus-Wide Administrative Hub
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1.5">
            Real MongoDB telemetry, student services orchestration, and reports
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => handleExportCSV('complaints')}
            className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-2"
          >
            <Download className="w-3.5 h-3.5 text-indigo-400" />
            <span>Export Complaints CSV</span>
          </button>
          <button
            onClick={() => handleExportCSV('users')}
            className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-2"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export Users CSV</span>
          </button>
          <button
            onClick={() => navigate('/admin/setup')}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-lg shadow-indigo-600/30 flex items-center gap-2"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>College Setup</span>
          </button>
        </div>
      </div>

      {/* Primary MongoDB Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Users"
          value={m.totalUsers}
          icon={Users}
          color="indigo"
          subtitle={`${m.studentsCount || 0} Students • ${m.facultyCount || 0} Faculty`}
          onClick={() => navigate('/admin/users')}
        />
        <StatsCard
          title="Active Projects"
          value={m.activeProjects}
          icon={Briefcase}
          color="purple"
          subtitle="Collaborations underway"
          onClick={() => navigate('/projects')}
        />
        <StatsCard
          title="Open CampusFix Tickets"
          value={m.openComplaints}
          icon={Wrench}
          color={m.openComplaints > 0 ? 'rose' : 'emerald'}
          subtitle="Maintenance queue"
          onClick={() => navigate('/campus-fix')}
        />
        <StatsCard
          title="Resource Bookings"
          value={m.totalBookings}
          icon={CalendarCheck}
          color="cyan"
          subtitle="Labs & auditoriums"
          onClick={() => navigate('/campus-slot')}
        />
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatsCard title="Campus Events" value={m.totalEvents} icon={Calendar} color="emerald" onClick={() => navigate('/events')} />
        <StatsCard title="Clubs & Societies" value={m.totalClubs} icon={Flag} color="amber" onClick={() => navigate('/clubs')} />
        <StatsCard title="Study Groups" value={m.totalStudyGroups} icon={BookOpen} color="indigo" onClick={() => navigate('/study-hub')} />
        <StatsCard title="Shared Resources" value={m.totalResources} icon={FileText} color="purple" onClick={() => navigate('/resources')} />
      </div>

      {/* Analytics Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Complaints by Category Chart */}
        <div className="glass-card rounded-3xl p-6 border border-slate-800">
          <h3 className="text-base font-bold text-white mb-4">Complaints by Category (Live MongoDB)</h3>
          <div className="h-64">
            {charts.complaintsByCategory?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.complaintsByCategory}>
                  <XAxis dataKey="category" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }} />
                  <Bar dataKey="count" fill="#6366f1" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                No complaint records in database yet.
              </div>
            )}
          </div>
        </div>

        {/* Department Participation Chart */}
        <div className="glass-card rounded-3xl p-6 border border-slate-800">
          <h3 className="text-base font-bold text-white mb-4">Student Registrations by Department</h3>
          <div className="h-64 flex items-center justify-center">
            {charts.studentsByDepartment?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts.studentsByDepartment}
                    dataKey="count"
                    nameKey="department"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ department, count }) => `${department}: ${count}`}
                  >
                    {charts.studentsByDepartment.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-xs text-slate-500">
                No student profiles registered yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
