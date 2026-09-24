import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { analyticsApi } from '../../api/client';
import StatsCard from '../../components/common/StatsCard';
import { LoadingState } from '../../components/common/LoadingState';
import { Flag, Users, Calendar, UserPlus, Sparkles } from 'lucide-react';

const ClubDashboard = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
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
    fetchMetrics();
  }, []);

  if (loading) return <LoadingState message="Loading club statistics..." />;

  const m = data?.metrics || {};

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-indigo-950/80 via-slate-900 to-slate-900 border border-indigo-500/20 shadow-2xl">
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-semibold w-fit mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Club Coordinator Portal</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
          Campus Clubs & Societies Hub
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 mt-1.5">
          Member approvals, event organizing, and campus community engagement
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="My Clubs"
          value={m.clubsCount}
          icon={Flag}
          color="indigo"
          subtitle="Managed organizations"
          onClick={() => navigate('/clubs')}
        />
        <StatsCard
          title="Active Members"
          value={m.totalMembers}
          icon={Users}
          color="emerald"
          subtitle="Registered participants"
          onClick={() => navigate('/clubs')}
        />
        <StatsCard
          title="Pending Requests"
          value={m.pendingRequests}
          icon={UserPlus}
          color={m.pendingRequests > 0 ? 'amber' : 'slate'}
          subtitle="Awaiting membership approval"
          onClick={() => navigate('/clubs')}
        />
        <StatsCard
          title="Club Events"
          value={m.eventsOrganized}
          icon={Calendar}
          color="purple"
          subtitle={`${m.totalRegistrations || 0} registrations`}
          onClick={() => navigate('/events')}
        />
      </div>
    </div>
  );
};

export default ClubDashboard;
