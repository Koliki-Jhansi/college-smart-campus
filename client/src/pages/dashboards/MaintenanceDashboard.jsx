import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { analyticsApi } from '../../api/client';
import StatsCard from '../../components/common/StatsCard';
import { LoadingState } from '../../components/common/LoadingState';
import { Wrench, AlertTriangle, Clock, CheckCircle2, ShieldAlert, Sparkles } from 'lucide-react';

const MaintenanceDashboard = () => {
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

  if (loading) return <LoadingState message="Loading maintenance workboard metrics..." />;

  const m = data?.metrics || {};

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-amber-950/80 via-slate-900 to-slate-900 border border-amber-500/20 shadow-2xl">
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold w-fit mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>CampusFix Maintenance Ops</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
          Maintenance & Facilities Workboard
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 mt-1.5">
          SLA-driven issue resolution & campus infrastructure triage
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
        <StatsCard
          title="Assigned To Me"
          value={m.assignedTickets}
          icon={Wrench}
          color="indigo"
          subtitle="Open work tickets"
          onClick={() => navigate('/campus-fix')}
        />
        <StatsCard
          title="High & Critical Priority"
          value={m.highPriority}
          icon={AlertTriangle}
          color="rose"
          subtitle="Immediate attention required"
          onClick={() => navigate('/campus-fix')}
        />
        <StatsCard
          title="SLA Breached"
          value={m.slaBreached}
          icon={ShieldAlert}
          color="rose"
          subtitle="Overdue resolution deadline"
          onClick={() => navigate('/campus-fix')}
        />
        <StatsCard
          title="In Progress"
          value={m.inProgress}
          icon={Clock}
          color="amber"
          subtitle="Currently being resolved"
          onClick={() => navigate('/campus-fix')}
        />
        <StatsCard
          title="Resolved Today"
          value={m.resolvedToday}
          icon={CheckCircle2}
          color="emerald"
          subtitle="Closed within SLA"
          onClick={() => navigate('/campus-fix')}
        />
      </div>
    </div>
  );
};

export default MaintenanceDashboard;
