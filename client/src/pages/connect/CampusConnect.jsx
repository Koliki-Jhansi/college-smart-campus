import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { userApi, collegeApi } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { LoadingState } from '../../components/common/LoadingState';
import EmptyState from '../../components/common/EmptyState';
import {
  Users,
  Search,
  UserPlus,
  Check,
  X,
  MessageSquare,
  GraduationCap,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';

const CampusConnect = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState('discover'); // 'discover' or 'connections'
  const [students, setStudents] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [connectionsData, setConnectionsData] = useState({ connections: [], pendingIncoming: [], pendingOutgoing: [] });
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('All');
  const [year, setYear] = useState('All');
  const [skill, setSkill] = useState('');

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const res = await userApi.searchStudents({ search, department, year, skill });
      if (res.data.success) {
        setStudents(res.data.students || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchConnections = async () => {
    try {
      const res = await userApi.getMyConnections();
      if (res.data.success) {
        setConnectionsData(res.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDepts = async () => {
    try {
      const res = await collegeApi.getPublicStructure();
      if (res.data.success) {
        setDepartments(res.data.departments || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchDepts();
    fetchConnections();
  }, []);

  useEffect(() => {
    if (activeTab === 'discover') {
      fetchStudents();
    } else {
      fetchConnections();
    }
  }, [activeTab, department, year, skill]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchStudents();
  };

  const handleSendConnect = async (recipientId) => {
    try {
      const res = await userApi.sendConnectRequest(recipientId, { message: 'Hi, let’s connect on CampusConnect!' });
      addToast(res.data.message || 'Connection request sent!', 'success');
      fetchConnections();
      fetchStudents();
    } catch (err) {
      addToast(err.response?.data?.message || 'Could not send request.', 'error');
    }
  };

  const handleRespondConnect = async (connectionId, action) => {
    try {
      const res = await userApi.handleConnectResponse(connectionId, { action });
      addToast(res.data.message || `Request ${action}ed!`, 'success');
      fetchConnections();
    } catch (err) {
      addToast('Error responding to request.', 'error');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <Users className="w-7 h-7 text-indigo-400" />
            <span>CampusConnect Networking</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Discover fellow students by department, skills, and academic interests
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center p-1 rounded-2xl bg-slate-900 border border-slate-800">
          <button
            onClick={() => setActiveTab('discover')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'discover' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Discover Peers
          </button>
          <button
            onClick={() => setActiveTab('connections')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all relative ${
              activeTab === 'connections' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            My Connections
            {connectionsData.pendingIncoming?.length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px]">
                {connectionsData.pendingIncoming.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {activeTab === 'discover' ? (
        <div className="space-y-6">
          {/* Filters Bar */}
          <form onSubmit={handleSearchSubmit} className="glass-card rounded-3xl p-4 sm:p-5 border border-slate-800 grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search name, ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="All">All Departments</option>
                {departments.map((d) => (
                  <option key={d._id} value={d.name}>{d.name}</option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="All">All Years</option>
                {[1, 2, 3, 4, 5].map((y) => (
                  <option key={y} value={y}>Year {y}</option>
                ))}
              </select>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Skill (e.g. React, Python)"
                value={skill}
                onChange={(e) => setSkill(e.target.value)}
                className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30"
              >
                Search
              </button>
            </div>
          </form>

          {/* Students Grid */}
          {loading ? (
            <LoadingState message="Searching student directory..." />
          ) : students.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No students found"
              description="Try adjusting your search filters or skill keywords."
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {students.map((sp) => (
                <div key={sp._id} className="glass-card-hover rounded-3xl p-5 border border-slate-800 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        {sp.user?.avatar ? (
                          <img src={sp.user.avatar} alt={sp.user.name} className="w-12 h-12 rounded-2xl object-cover border border-indigo-500/30" />
                        ) : (
                          <div className="w-12 h-12 rounded-2xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-300 font-bold text-lg">
                            {sp.user?.name?.charAt(0)}
                          </div>
                        )}
                        <div>
                          <h3
                            onClick={() => navigate(`/profile/${sp.user?._id}`)}
                            className="text-sm font-bold text-white hover:text-indigo-400 cursor-pointer transition-colors truncate max-w-[150px]"
                          >
                            {sp.user?.name}
                          </h3>
                          <p className="text-[11px] text-slate-400">{sp.department} • Year {sp.year}</p>
                        </div>
                      </div>
                    </div>

                    {sp.bio && <p className="text-xs text-slate-300 line-clamp-2 mb-3">{sp.bio}</p>}

                    {/* Skills pills */}
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {sp.skills?.slice(0, 4).map((s, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded-lg bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 text-[10px] font-semibold">
                          {s}
                        </span>
                      ))}
                      {sp.skills?.length > 4 && (
                        <span className="text-[10px] text-slate-500">+{sp.skills.length - 4} more</span>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800/80 flex items-center gap-2">
                    <button
                      onClick={() => navigate(`/profile/${sp.user?._id}`)}
                      className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors"
                    >
                      View Profile
                    </button>
                    <button
                      onClick={() => handleSendConnect(sp.user?._id)}
                      className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition-all active:scale-95"
                      title="Connect"
                    >
                      <UserPlus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* My Connections Tab */
        <div className="space-y-8">
          {/* Pending Incoming Requests */}
          {connectionsData.pendingIncoming?.length > 0 && (
            <div className="glass-card rounded-3xl p-6 border border-amber-500/30 bg-amber-950/10">
              <h3 className="text-sm font-bold text-amber-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                <span>Pending Connection Requests ({connectionsData.pendingIncoming.length})</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {connectionsData.pendingIncoming.map((req) => (
                  <div key={req._id} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-600/30 flex items-center justify-center font-bold text-indigo-300">
                        {req.requester?.name?.charAt(0)}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white">{req.requester?.name}</h4>
                        <p className="text-[10px] text-slate-400">{req.requester?.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleRespondConnect(req._id, 'accept')}
                        className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white"
                        title="Accept"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleRespondConnect(req._id, 'reject')}
                        className="p-2 rounded-xl bg-rose-600/30 hover:bg-rose-600 text-rose-300 hover:text-white"
                        title="Decline"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Active Connections */}
          <div className="glass-card rounded-3xl p-6 border border-slate-800">
            <h3 className="text-base font-bold text-white mb-4">
              Connected Peers ({connectionsData.connections?.length || 0})
            </h3>

            {connectionsData.connections?.length === 0 ? (
              <EmptyState
                icon={Users}
                title="No connections yet"
                description="Explore student profiles and send connection requests to build your campus network."
                actionLabel="Discover Students"
                onAction={() => setActiveTab('discover')}
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {connectionsData.connections?.map((c) => (
                  <div key={c._id} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-600/30 flex items-center justify-center font-bold text-indigo-300">
                        {c.peer?.name?.charAt(0)}
                      </div>
                      <div>
                        <h4
                          onClick={() => navigate(`/profile/${c.peer?._id}`)}
                          className="text-xs font-bold text-white hover:text-indigo-400 cursor-pointer"
                        >
                          {c.peer?.name}
                        </h4>
                        <p className="text-[10px] text-slate-400">{c.peer?.email}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => navigate(`/profile/${c.peer?._id}`)}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200"
                    >
                      Profile
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CampusConnect;
