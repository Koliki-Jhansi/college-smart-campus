import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projectApi } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/common/Modal';
import { LoadingState } from '../../components/common/LoadingState';
import {
  Briefcase,
  Users,
  CheckCircle2,
  Clock,
  Plus,
  Code2,
  Globe,
  UserPlus,
  Shield,
  ArrowLeft,
  Calendar,
  Check,
  X,
} from 'lucide-react';

const ProjectWorkspace = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [projectData, setProjectData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [joinModalOpen, setJoinModalOpen] = useState(false);

  // New task form
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskPriority, setTaskPriority] = useState('medium');

  // Join application form
  const [joinMessage, setJoinMessage] = useState('');
  const [joinRole, setJoinRole] = useState('Developer');

  const fetchProjectDetails = async () => {
    try {
      setLoading(true);
      const res = await projectApi.getProjectById(id);
      if (res.data.success) {
        setProjectData(res.data);
      }
    } catch (err) {
      addToast('Failed to load project workspace.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectDetails();
  }, [id]);

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      await projectApi.addTask(id, {
        title: taskTitle,
        description: taskDesc,
        priority: taskPriority,
      });
      addToast('Task added to workspace!', 'success');
      setTaskModalOpen(false);
      setTaskTitle('');
      setTaskDesc('');
      fetchProjectDetails();
    } catch (err) {
      addToast('Failed to create task.', 'error');
    }
  };

  const handleTaskStatusChange = async (taskId, newStatus) => {
    try {
      await projectApi.updateTaskStatus(taskId, { status: newStatus });
      addToast('Task status updated.', 'success');
      fetchProjectDetails();
    } catch (err) {
      addToast('Failed to update task status.', 'error');
    }
  };

  const handleApplyToProject = async (e) => {
    e.preventDefault();
    try {
      const res = await projectApi.applyToProject(id, {
        message: joinMessage,
        roleOffered: joinRole,
      });
      addToast(res.data.message || 'Join request sent!', 'success');
      setJoinModalOpen(false);
      fetchProjectDetails();
    } catch (err) {
      addToast(err.response?.data?.message || 'Could not send join request.', 'error');
    }
  };

  const handleRequestResponse = async (requestId, action) => {
    try {
      const res = await projectApi.handleJoinRequest(requestId, { action });
      addToast(res.data.message || `Request ${action}ed.`, 'success');
      fetchProjectDetails();
    } catch (err) {
      addToast('Error responding to request.', 'error');
    }
  };

  if (loading) return <LoadingState message="Loading project workspace..." />;

  const p = projectData?.project;
  const tasks = projectData?.tasks || [];
  const joinRequests = projectData?.joinRequests || [];
  const userStatus = projectData?.userStatus || {};

  const taskColumns = [
    { id: 'todo', label: 'To Do', color: 'border-slate-700 bg-slate-900/40' },
    { id: 'in_progress', label: 'In Progress', color: 'border-indigo-500/30 bg-indigo-950/20' },
    { id: 'review', label: 'Review', color: 'border-amber-500/30 bg-amber-950/20' },
    { id: 'completed', label: 'Completed', color: 'border-emerald-500/30 bg-emerald-950/20' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Navigation Top Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/projects')}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Projects</span>
        </button>

        <div className="flex items-center gap-3">
          {!userStatus.isMember && !userStatus.isOwner && !userStatus.hasPendingRequest && (
            <button
              onClick={() => setJoinModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>Apply to Join Team</span>
            </button>
          )}

          {userStatus.hasPendingRequest && (
            <span className="px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-300 border border-amber-500/30 text-xs font-semibold">
              Join Request Pending
            </span>
          )}

          {(userStatus.isMember || userStatus.isOwner) && (
            <button
              onClick={() => setTaskModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/30"
            >
              <Plus className="w-4 h-4" />
              <span>Add Task</span>
            </button>
          )}
        </div>
      </div>

      {/* Project Overview Card */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 text-[10px] font-bold uppercase">
                {p?.category}
              </span>
              <span className="px-2.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold uppercase">
                {p?.status}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">{p?.title}</h1>
          </div>

          {p?.githubRepo && (
            <a
              href={p.githubRepo}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-bold text-slate-200 flex items-center gap-2 w-fit"
            >
              <Code2 className="w-4 h-4" />
              <span>GitHub Repo</span>
            </a>
          )}
        </div>

        <p className="text-sm text-slate-300 leading-relaxed max-w-4xl">{p?.description}</p>

        {p?.problemStatement && (
          <div className="mt-4 p-4 rounded-2xl bg-indigo-950/20 border border-indigo-500/20">
            <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-1">Problem Statement</h4>
            <p className="text-xs text-slate-300">{p.problemStatement}</p>
          </div>
        )}

        {/* Tech Stack & Required Skills */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 pt-6 border-t border-slate-800/80">
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Technologies Used</h4>
            <div className="flex flex-wrap gap-1.5">
              {p?.technologies?.map((t, i) => (
                <span key={i} className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-indigo-300">
                  {t}
                </span>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Looking For Skills</h4>
            <div className="flex flex-wrap gap-1.5">
              {p?.requiredSkills?.map((s, i) => (
                <span key={i} className="px-2.5 py-1 rounded-lg bg-purple-500/10 border border-purple-500/30 text-xs font-semibold text-purple-300">
                  {s}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Pending Join Requests (Visible to Owner) */}
      {joinRequests.length > 0 && (
        <div className="glass-card rounded-3xl p-6 border border-amber-500/30 bg-amber-950/10">
          <h3 className="text-sm font-bold text-amber-300 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Users className="w-4 h-4" />
            <span>Pending Team Applications ({joinRequests.length})</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {joinRequests.map((req) => (
              <div key={req._id} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white">{req.applicant?.name}</h4>
                  <p className="text-[11px] text-slate-400">Role: {req.roleOffered} • {req.message}</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleRequestResponse(req._id, 'accept')}
                    className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleRequestResponse(req._id, 'reject')}
                    className="p-2 rounded-xl bg-rose-600/30 hover:bg-rose-600 text-rose-300 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tasks Workspace Kanban */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-indigo-400" />
            <span>Workspace Tasks ({tasks.length})</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {taskColumns.map((col) => {
            const colTasks = tasks.filter((t) => t.status === col.id);
            return (
              <div key={col.id} className={`rounded-3xl p-4 border ${col.color} flex flex-col min-h-[300px]`}>
                <div className="flex items-center justify-between mb-3 px-1">
                  <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">{col.label}</h3>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                    {colTasks.length}
                  </span>
                </div>

                <div className="flex-1 space-y-2.5 overflow-y-auto">
                  {colTasks.map((t) => (
                    <div key={t._id} className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm space-y-2">
                      <div className="text-xs font-bold text-white">{t.title}</div>
                      {t.description && <p className="text-[11px] text-slate-400">{t.description}</p>}

                      {/* Status quick mover */}
                      {(userStatus.isMember || userStatus.isOwner) && (
                        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
                          <span className="text-slate-500 capitalize">{t.priority}</span>
                          <select
                            value={t.status}
                            onChange={(e) => handleTaskStatusChange(t._id, e.target.value)}
                            className="bg-slate-950 border border-slate-800 text-[10px] text-slate-300 rounded px-1.5 py-0.5"
                          >
                            <option value="todo">To Do</option>
                            <option value="in_progress">In Progress</option>
                            <option value="review">Review</option>
                            <option value="completed">Completed</option>
                          </select>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Task Modal */}
      <Modal isOpen={taskModalOpen} onClose={() => setTaskModalOpen(false)} title="Create Workspace Task">
        <form onSubmit={handleCreateTask} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Task Title *</label>
            <input
              type="text"
              placeholder="e.g. Implement JWT refresh token interceptor"
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              required
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Task Description</label>
            <textarea
              rows={3}
              placeholder="Details and implementation checklist..."
              value={taskDesc}
              onChange={(e) => setTaskDesc(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Priority</label>
            <select
              value={taskPriority}
              onChange={(e) => setTaskPriority(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30"
          >
            Create Task
          </button>
        </form>
      </Modal>

      {/* Join Request Modal */}
      <Modal isOpen={joinModalOpen} onClose={() => setJoinModalOpen(false)} title="Apply to Join Project Team">
        <form onSubmit={handleApplyToProject} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Role / Contribution</label>
            <input
              type="text"
              placeholder="e.g. Frontend React Developer / ML Specialist"
              value={joinRole}
              onChange={(e) => setJoinRole(e.target.value)}
              required
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Message to Project Owner</label>
            <textarea
              rows={3}
              placeholder="Share why you're interested and what skills you bring..."
              value={joinMessage}
              onChange={(e) => setJoinMessage(e.target.value)}
              required
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30"
          >
            Submit Application
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default ProjectWorkspace;
