import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { analyticsApi } from '../../api/client';
import StatsCard from '../../components/common/StatsCard';
import { LoadingState } from '../../components/common/LoadingState';
import { Bus, MapPin, AlertCircle, Sparkles } from 'lucide-react';

const TransportDashboard = () => {
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

  if (loading) return <LoadingState message="Loading transit statistics..." />;

  const m = data?.metrics || {};

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-purple-950/80 via-slate-900 to-slate-900 border border-purple-500/20 shadow-2xl">
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-400 text-xs font-semibold w-fit mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>CampusRide Transit Ops</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
          Campus Transit & Fleet Operations
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 mt-1.5">
          Bus fleet management, route scheduling, and commuter issue tracking
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Bus Fleet"
          value={m.totalBuses}
          icon={Bus}
          color="purple"
          subtitle="Registered vehicles"
          onClick={() => navigate('/campus-ride')}
        />
        <StatsCard
          title="Active Buses"
          value={m.activeBuses}
          icon={Bus}
          color="emerald"
          subtitle="On-road operational"
          onClick={() => navigate('/campus-ride')}
        />
        <StatsCard
          title="Transit Routes"
          value={m.totalRoutes}
          icon={MapPin}
          color="indigo"
          subtitle="Active campus routes"
          onClick={() => navigate('/campus-ride')}
        />
        <StatsCard
          title="Commuter Issues"
          value={m.reportedIssues}
          icon={AlertCircle}
          color={m.reportedIssues > 0 ? 'amber' : 'slate'}
          subtitle="Reported delay/route notes"
          onClick={() => navigate('/campus-ride')}
        />
      </div>
    </div>
  );
};

export default TransportDashboard;
