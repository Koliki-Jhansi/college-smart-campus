import React, { useState, useEffect } from 'react';
import { studyGroupApi, collegeApi } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/common/Modal';
import { LoadingState } from '../../components/common/LoadingState';
import EmptyState from '../../components/common/EmptyState';
import {
  BookOpen,
  Users,
  Plus,
  Search,
  ExternalLink,
  MessageSquare,
  Sparkles,
  Lock,
  Globe,
  Share2,
} from 'lucide-react';

const StudyHub = () => {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState('explore'); // 'explore' or 'my'
  const [groups, setGroups] = useState([]);
  const [myGroups, setMyGroups] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('All');
  const [semester, setSemester] = useState('All');

  // Create Modal Form
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [newDept, setNewDept] = useState('All');
  const [newSem, setNewSem] = useState(1);
  const [maxMembers, setMaxMembers] = useState(10);
  const [scheduleInfo, setScheduleInfo] = useState('');

  // Add Resource Modal Form
  const [resourceModalOpen, setResourceModalOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [resTitle, setResTitle] = useState('');
  const [resUrl, setResUrl] = useState('');

  const fetchExploreGroups = async () => {
    try {
      setLoading(true);
      const res = await studyGroupApi.getGroups({ search, department, semester });
      if (res.data.success) {
        setGroups(res.data.groups || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyGroups = async () => {
    try {
      setLoading(true);
      const res = await studyGroupApi.getMyGroups();
      if (res.data.success) {
        setMyGroups(res.data.groups || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
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
  }, []);

  useEffect(() => {
    if (activeTab === 'explore') fetchExploreGroups();
    else fetchMyGroups();
  }, [activeTab, department, semester]);

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    try {
      await studyGroupApi.createGroup({
        name,
        subject,
        description,
        department: newDept,
        semester: Number(newSem),
        maxMembers: Number(maxMembers),
        scheduleInfo,
      });
      addToast('Study group created!', 'success');
      setCreateModalOpen(false);
      setName('');
      setSubject('');
      setDescription('');
      fetchExploreGroups();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to create group.', 'error');
    }
  };

  const handleJoinGroup = async (groupId) => {
    try {
      const res = await studyGroupApi.joinGroup(groupId);
      addToast(res.data.message || 'Joined study group!', 'success');
      fetchExploreGroups();
    } catch (err) {
      addToast(err.response?.data?.message || 'Could not join group.', 'error');
    }
  };

  const handleLeaveGroup = async (groupId) => {
    try {
      await studyGroupApi.leaveGroup(groupId);
      addToast('Left study group.', 'info');
      if (activeTab === 'explore') fetchExploreGroups();
      else fetchMyGroups();
    } catch (err) {
      addToast(err.response?.data?.message || 'Could not leave group.', 'error');
    }
  };

  const handleAddResource = async (e) => {
    e.preventDefault();
    try {
      await studyGroupApi.addResource(selectedGroup._id, { title: resTitle, url: resUrl });
      addToast('Resource shared with study group!', 'success');
      setResourceModalOpen(false);
      setResTitle('');
      setResUrl('');
      if (activeTab === 'explore') fetchExploreGroups();
      else fetchMyGroups();
    } catch (err) {
      addToast('Failed to add resource.', 'error');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <BookOpen className="w-7 h-7 text-indigo-400" />
            <span>StudyHub Circles & Peer Groups</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Form collaborative study circles, share academic links, and schedule review sessions
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center p-1 rounded-2xl bg-slate-900 border border-slate-800">
            <button
              onClick={() => setActiveTab('explore')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'explore' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              All Circles
            </button>
            <button
              onClick={() => setActiveTab('my')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'my' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              My Groups
            </button>
          </div>

          <button
            onClick={() => setCreateModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create Circle</span>
          </button>
        </div>
      </div>

      {activeTab === 'explore' ? (
        <div className="space-y-6">
          {/* Filter Bar */}
          <div className="glass-card rounded-3xl p-4 sm:p-5 border border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search subject, topic..."
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
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="All">All Semesters</option>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                  <option key={s} value={s}>Semester {s}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Groups Grid */}
          {loading ? (
            <LoadingState message="Fetching study groups from MongoDB..." />
          ) : groups.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="Discover or create your first study group."
              description="Start the first study group for your subject or exam revision."
              actionLabel="Create Study Circle"
              onAction={() => setCreateModalOpen(true)}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {groups.map((g) => {
                const isMember = g.members?.some((m) => String(m._id || m) === String(user._id));
                const isFull = g.members?.length >= g.maxMembers;

                return (
                  <div key={g._id} className="glass-card-hover rounded-3xl p-6 border border-slate-800 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                          {g.department} • Sem {g.semester}
                        </span>
                        <div className="flex items-center gap-1.5 text-xs text-slate-400">
                          <Users className="w-3.5 h-3.5 text-indigo-400" />
                          <span>{g.members?.length || 1} / {g.maxMembers}</span>
                        </div>
                      </div>

                      <h3 className="text-base font-bold text-white mb-1">{g.name}</h3>
                      <p className="text-xs font-semibold text-indigo-300 mb-2">Subject: {g.subject}</p>
                      {g.description && <p className="text-xs text-slate-400 line-clamp-2 mb-4">{g.description}</p>}

                      {/* Shared Resources Preview */}
                      {g.resources?.length > 0 && (
                        <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 mb-4 text-xs space-y-1">
                          <span className="text-[10px] uppercase font-bold text-slate-400">Shared Links:</span>
                          {g.resources.slice(0, 2).map((r, i) => (
                            <a
                              key={i}
                              href={r.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-indigo-400 hover:text-indigo-300 block truncate"
                            >
                              • {r.title}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="pt-4 border-t border-slate-800 flex items-center gap-2">
                      {isMember ? (
                        <>
                          <button
                            onClick={() => {
                              setSelectedGroup(g);
                              setResourceModalOpen(true);
                            }}
                            className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200"
                          >
                            + Share Link
                          </button>
                          <button
                            onClick={() => handleLeaveGroup(g._id)}
                            className="px-3 py-2 rounded-xl bg-rose-600/20 text-rose-300 text-xs font-bold hover:bg-rose-600 hover:text-white"
                          >
                            Leave
                          </button>
                        </>
                      ) : (
                        <button
                          disabled={isFull}
                          onClick={() => handleJoinGroup(g._id)}
                          className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-bold shadow-lg shadow-indigo-600/30"
                        >
                          {isFull ? 'Group Full' : 'Join Study Circle'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* My Groups Tab */
        <div className="space-y-6">
          {loading ? (
            <LoadingState message="Loading your study circles..." />
          ) : myGroups.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="You haven't joined any study groups yet"
              description="Browse the circles directory or create your own topic group."
              actionLabel="Explore Groups"
              onAction={() => setActiveTab('explore')}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myGroups.map((g) => (
                <div key={g._id} className="glass-card rounded-3xl p-6 border border-slate-800 space-y-4">
                  <div>
                    <h3 className="text-base font-bold text-white">{g.name}</h3>
                    <p className="text-xs text-indigo-300">{g.subject} • {g.department}</p>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs space-y-2">
                    <div className="font-bold text-slate-300">Shared Learning Links:</div>
                    {g.resources?.length > 0 ? (
                      g.resources.map((r, i) => (
                        <a
                          key={i}
                          href={r.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-indigo-400 hover:underline flex items-center gap-1.5"
                        >
                          <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{r.title}</span>
                        </a>
                      ))
                    ) : (
                      <p className="text-slate-500">No resources shared yet.</p>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      setSelectedGroup(g);
                      setResourceModalOpen(true);
                    }}
                    className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold"
                  >
                    + Share Learning Resource
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create Group Modal */}
      <Modal isOpen={createModalOpen} onClose={() => setCreateModalOpen(false)} title="Create Study Circle">
        <form onSubmit={handleCreateGroup} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Group Name *</label>
            <input
              type="text"
              placeholder="e.g. Algorithms & Data Structures Prep"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Subject / Topic *</label>
            <input
              type="text"
              placeholder="e.g. CS201 - Advanced Graph Algorithms"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Department</label>
              <select
                value={newDept}
                onChange={(e) => setNewDept(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="All">All Departments</option>
                {departments.map((d) => (
                  <option key={d._id} value={d.name}>{d.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Semester</label>
              <select
                value={newSem}
                onChange={(e) => setNewSem(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                  <option key={s} value={s}>Semester {s}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Meeting Schedule Info</label>
            <input
              type="text"
              placeholder="e.g. Tuesdays & Thursdays at 5:00 PM (Google Meet / Room 302)"
              value={scheduleInfo}
              onChange={(e) => setScheduleInfo(e.target.value)}
              className="w-full px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30"
          >
            Launch Study Circle
          </button>
        </form>
      </Modal>

      {/* Share Resource Modal */}
      <Modal isOpen={resourceModalOpen} onClose={() => setResourceModalOpen(false)} title="Share Link with Study Group">
        <form onSubmit={handleAddResource} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Resource Title *</label>
            <input
              type="text"
              placeholder="e.g. MIT OpenCourseWare Lecture Notes"
              value={resTitle}
              onChange={(e) => setResTitle(e.target.value)}
              required
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">URL Link *</label>
            <input
              type="url"
              placeholder="https://..."
              value={resUrl}
              onChange={(e) => setResUrl(e.target.value)}
              required
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg"
          >
            Share Link
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default StudyHub;
