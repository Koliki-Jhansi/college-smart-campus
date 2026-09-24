import React, { useState, useEffect } from 'react';
import { transportApi } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/common/Modal';
import { LoadingState } from '../../components/common/LoadingState';
import EmptyState from '../../components/common/EmptyState';
import {
  Bus,
  MapPin,
  Clock,
  Search,
  AlertTriangle,
  Plus,
  CheckCircle2,
  Users,
} from 'lucide-react';

const CampusRide = () => {
  const { user, isTransportStaff, isAdmin } = useAuth();
  const { addToast } = useToast();

  const [routes, setRoutes] = useState([]);
  const [buses, setBuses] = useState([]);
  const [searchStop, setSearchStop] = useState('');
  const [loading, setLoading] = useState(true);

  // Modals
  const [issueModalOpen, setIssueModalOpen] = useState(false);
  const [issueTitle, setIssueTitle] = useState('');
  const [issueDesc, setIssueDesc] = useState('');
  const [issueBus, setIssueBus] = useState('');

  // Create Route Modal (Transport Staff / Admin)
  const [routeModalOpen, setRouteModalOpen] = useState(false);
  const [routeName, setRouteName] = useState('');
  const [routeNumber, setRouteNumber] = useState('');
  const [startLocation, setStartLocation] = useState('');
  const [destination, setDestination] = useState('Main Campus');
  const [stopsText, setStopsText] = useState('Metro Station (07:30 AM), City Center (07:50 AM), Campus Gate (08:20 AM)');

  const fetchTransportData = async () => {
    try {
      setLoading(true);
      const [rRes, bRes] = await Promise.all([
        transportApi.getRoutes({ searchStop }),
        transportApi.getBuses(),
      ]);

      if (rRes.data.success) setRoutes(rRes.data.routes || []);
      if (bRes.data.success) setBuses(bRes.data.buses || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransportData();
  }, [searchStop]);

  const handleReportIssue = async (e) => {
    e.preventDefault();
    try {
      await transportApi.reportIssue({
        title: issueTitle,
        description: issueDesc,
        busNumber: issueBus,
      });
      addToast('Transit issue reported to fleet operations.', 'success');
      setIssueModalOpen(false);
      setIssueTitle('');
      setIssueDesc('');
    } catch (err) {
      addToast('Failed to report issue.', 'error');
    }
  };

  const handleCreateRoute = async (e) => {
    e.preventDefault();
    try {
      // Parse stops string format: "Stop Name (Time Morning), Stop Name 2 (Time Morning)"
      const stops = stopsText.split(',').map((s, idx) => {
        const match = s.match(/(.+?)\s*\((.+?)\)/);
        if (match) {
          return { stopName: match[1].trim(), timeMorning: match[2].trim(), timeEvening: '05:30 PM', sequence: idx + 1 };
        }
        return { stopName: s.trim(), timeMorning: '07:30 AM', timeEvening: '05:30 PM', sequence: idx + 1 };
      });

      await transportApi.createRoute({
        routeName,
        routeNumber,
        startLocation,
        destination,
        stops,
      });

      addToast('New bus route registered!', 'success');
      setRouteModalOpen(false);
      setRouteName('');
      setRouteNumber('');
      setStartLocation('');
      fetchTransportData();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to create route.', 'error');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <Bus className="w-7 h-7 text-purple-400" />
            <span>CampusRide Transit & Shuttle Routes</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Search pick-up stops, view morning & evening bus schedules, and report route delay notes
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIssueModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-bold text-slate-200 flex items-center gap-1.5"
          >
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>Report Transit Issue</span>
          </button>

          {(isTransportStaff || isAdmin) && (
            <button
              onClick={() => setRouteModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-600/30 flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add Bus Route</span>
            </button>
          )}
        </div>
      </div>

      {/* Stop Search Bar */}
      <div className="glass-card rounded-3xl p-4 sm:p-5 border border-slate-800 max-w-xl">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search your bus stop or pickup point (e.g. City Center, Metro)..."
            value={searchStop}
            onChange={(e) => setSearchStop(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
          />
        </div>
      </div>

      {/* Routes & Schedules Grid */}
      {loading ? (
        <LoadingState message="Fetching campus bus routes..." />
      ) : routes.length === 0 ? (
        <EmptyState
          icon={Bus}
          title="No transit routes found"
          description="Campus transit routes and stops will be listed here once scheduled."
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {routes.map((r) => (
            <div key={r._id} className="glass-card rounded-3xl p-6 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold px-2.5 py-1 rounded bg-purple-500/10 text-purple-300 border border-purple-500/30">
                  {r.routeNumber}
                </span>
                <span className="text-xs text-slate-400 font-semibold">{r.stops?.length || 0} Designated Stops</span>
              </div>

              <div>
                <h3 className="text-lg font-bold text-white">{r.routeName}</h3>
                <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                  <MapPin className="w-3.5 h-3.5 text-purple-400" />
                  <span>{r.startLocation} ➔ {r.destination}</span>
                </div>
              </div>

              {/* Stops Timeline */}
              <div className="space-y-2 p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs">
                <span className="font-bold text-slate-300 uppercase tracking-wider text-[10px]">Stops & Pickup Times:</span>
                <div className="space-y-1.5 mt-1">
                  {r.stops?.map((s, idx) => (
                    <div key={idx} className="flex justify-between items-center text-slate-300 py-0.5">
                      <span className="truncate">{idx + 1}. {s.stopName}</span>
                      <span className="font-mono text-purple-300 font-bold ml-2 shrink-0">{s.timeMorning}</span>
                    </div>
                  ))}
                </div>
              </div>

              {r.announcement && (
                <p className="text-xs text-amber-400 bg-amber-950/20 p-2.5 rounded-xl border border-amber-500/20">
                  Notice: {r.announcement}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Report Issue Modal */}
      <Modal isOpen={issueModalOpen} onClose={() => setIssueModalOpen(false)} title="Report Transit Issue">
        <form onSubmit={handleReportIssue} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Bus Number / Route</label>
            <input
              type="text"
              placeholder="e.g. Route R-101 / BUS-04"
              value={issueBus}
              onChange={(e) => setIssueBus(e.target.value)}
              className="w-full px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Issue Subject *</label>
            <input
              type="text"
              placeholder="e.g. 15-minute delay at City Center stop"
              value={issueTitle}
              onChange={(e) => setIssueTitle(e.target.value)}
              required
              className="w-full px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Details *</label>
            <textarea
              rows={3}
              placeholder="Explain the route irregularity or maintenance issue..."
              value={issueDesc}
              onChange={(e) => setIssueDesc(e.target.value)}
              required
              className="w-full px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30"
          >
            Submit Transit Issue
          </button>
        </form>
      </Modal>

      {/* Add Route Modal (Staff) */}
      <Modal isOpen={routeModalOpen} onClose={() => setRouteModalOpen(false)} title="Add Campus Transit Route">
        <form onSubmit={handleCreateRoute} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Route Name *</label>
              <input
                type="text"
                placeholder="e.g. North Metro Express"
                value={routeName}
                onChange={(e) => setRouteName(e.target.value)}
                required
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Route Number *</label>
              <input
                type="text"
                placeholder="e.g. R-101"
                value={routeNumber}
                onChange={(e) => setRouteNumber(e.target.value.toUpperCase())}
                required
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white uppercase focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Start Location *</label>
              <input
                type="text"
                placeholder="e.g. Central Metro Station"
                value={startLocation}
                onChange={(e) => setStartLocation(e.target.value)}
                required
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Destination</label>
              <input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Stops & Morning Times (Comma-separated)</label>
            <textarea
              rows={2}
              value={stopsText}
              onChange={(e) => setStopsText(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg"
          >
            Save Transit Route
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default CampusRide;
