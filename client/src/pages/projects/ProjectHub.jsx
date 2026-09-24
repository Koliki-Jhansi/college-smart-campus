import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { projectApi } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/common/Modal';
import { LoadingState, Pagination } from '../../components/common/LoadingState';
import EmptyState from '../../components/common/EmptyState';
import {
  Briefcase,
  Search,
  Plus,
  Users,
  Code,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Filter,
} from 'lucide-react';

const ProjectHub = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState('explore'); // 'explore' or 'my'
  const [projects, setProjects] = useState([]);
  const [myProjects, setMyProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [status, setStatus] = useState('All');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // New Project Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [problemStatement, setProblemStatement] = useState('');
  const [newCategory, setNewCategory] = useState('Web Development');
  const [technologies, setTechnologies] = useState('');
  const [requiredSkills, setRequiredSkills] = useState('');
  const [maxTeamSize, setMaxTeamSize] = useState(4);
  const [githubRepo, setGithubRepo] = useState('');

  const fetchExploreProjects = async () => {
    try {
      setLoading(true);
      const res = await projectApi.getProjects({ search, category, status, page, limit: 9 });
      if (res.data.success) {
        setProjects(res.data.projects || []);
        setTotalPages(res.data.pagination?.pages || 1);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyProjects = async () => {
    try {
      setLoading(true);
      const res = await projectApi.getMyProjects();
      if (res.data.success) {
        setMyProjects(res.data.projects || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'explore') fetchExploreProjects();
    else fetchMyProjects();
  }, [activeTab, category, status, page]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchExploreProjects();
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await projectApi.createProject({
        title,
        description,
        problemStatement,
        category: newCategory,
        technologies: technologies.split(',').map((t) => t.trim()).filter(Boolean),
        requiredSkills: requiredSkills.split(',').map((s) => s.trim()).filter(Boolean),
        maxTeamSize: Number(maxTeamSize),
        githubRepo,
      });

      addToast('Project published to ProjectHub!', 'success');
      setCreateModalOpen(false);
      // Reset form
      setTitle('');
      setDescription('');
      setProblemStatement('');
      setTechnologies('');
      setRequiredSkills('');
      navigate(`/projects/${res.data.project._id}`);
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to create project.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <Briefcase className="w-7 h-7 text-indigo-400" />
            <span>ProjectHub Innovation & Teaming</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Build cross-functional teams, post project ideas, and recruit student collaborators
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
              Explore Ideas
            </button>
            <button
              onClick={() => setActiveTab('my')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'my' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              My Projects
            </button>
          </div>

          <button
            onClick={() => setCreateModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center gap-2 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Post Project</span>
          </button>
        </div>
      </div>

      {activeTab === 'explore' ? (
        <div className="space-y-6">
          {/* Filters Bar */}
          <form onSubmit={handleSearchSubmit} className="glass-card rounded-3xl p-4 sm:p-5 border border-slate-800 grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="relative sm:col-span-2">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search projects by title, keywords, tech stack..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="All">All Categories</option>
                <option value="Web Development">Web Development</option>
                <option value="Mobile App">Mobile App</option>
                <option value="AI & Machine Learning">AI & Machine Learning</option>
                <option value="IoT & Hardware">IoT & Hardware</option>
                <option value="Cybersecurity">Cybersecurity</option>
                <option value="Blockchain">Blockchain</option>
                <option value="Robotics">Robotics</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="All">All Statuses</option>
                <option value="Recruiting">Recruiting</option>
                <option value="Idea">Idea</option>
                <option value="In Development">In Development</option>
                <option value="Testing">Testing</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </form>

          {/* Projects Grid */}
          {loading ? (
            <LoadingState message="Fetching live projects..." />
          ) : projects.length === 0 ? (
            <EmptyState
              icon={Briefcase}
              title="No projects match criteria"
              description="Be the first to create an innovative project idea in this category."
              actionLabel="Create Project Idea"
              onAction={() => setCreateModalOpen(true)}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((proj) => (
                <div
                  key={proj._id}
                  onClick={() => navigate(`/projects/${proj._id}`)}
                  className="glass-card-hover rounded-3xl p-6 border border-slate-800 flex flex-col justify-between cursor-pointer group"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                        {proj.category}
                      </span>
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                          proj.status === 'Recruiting'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {proj.status}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-white group-hover:text-indigo-400 transition-colors mb-2 line-clamp-1">
                      {proj.title}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-3 mb-4">{proj.description}</p>

                    {/* Technologies tags */}
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {proj.technologies?.slice(0, 3).map((t, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 font-mono">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                    <div className="flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{proj.members?.length || 1} / {proj.maxTeamSize} members</span>
                    </div>

                    <div className="flex items-center gap-1 font-bold text-indigo-400 group-hover:translate-x-1 transition-transform">
                      <span>Workspace</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <Pagination currentPage={page} totalPages={totalPages} onPageChange={(p) => setPage(p)} />
        </div>
      ) : (
        /* My Projects Tab */
        <div className="space-y-6">
          {loading ? (
            <LoadingState message="Loading your projects..." />
          ) : myProjects.length === 0 ? (
            <EmptyState
              icon={Briefcase}
              title="You haven't created or joined any projects yet"
              description="Start a new project or explore ideas to join as a contributor."
              actionLabel="Create Project"
              onAction={() => setCreateModalOpen(true)}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myProjects.map((proj) => (
                <div
                  key={proj._id}
                  onClick={() => navigate(`/projects/${proj._id}`)}
                  className="glass-card-hover rounded-3xl p-6 border border-slate-800 flex flex-col justify-between cursor-pointer"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold text-indigo-400 uppercase">{proj.category}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
                        {proj.status}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-white mb-2">{proj.title}</h3>
                    <p className="text-xs text-slate-400 line-clamp-2 mb-4">{proj.description}</p>
                  </div>

                  <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-indigo-400 font-bold">
                    <span>Open Workspace →</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create Project Modal */}
      <Modal isOpen={createModalOpen} onClose={() => setCreateModalOpen(false)} title="Post New Project Idea">
        <form onSubmit={handleCreateProject} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Project Title *</label>
            <input
              type="text"
              placeholder="e.g. Smart Campus Parking System"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Category</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="Web Development">Web Development</option>
                <option value="Mobile App">Mobile App</option>
                <option value="AI & Machine Learning">AI & Machine Learning</option>
                <option value="IoT & Hardware">IoT & Hardware</option>
                <option value="Cybersecurity">Cybersecurity</option>
                <option value="Robotics">Robotics</option>
                <option value="Blockchain">Blockchain</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Max Team Size</label>
              <input
                type="number"
                min={2}
                max={10}
                value={maxTeamSize}
                onChange={(e) => setMaxTeamSize(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Description *</label>
            <textarea
              rows={3}
              placeholder="What does this project do and what is the vision?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Technologies (comma-separated)</label>
              <input
                type="text"
                placeholder="React, Node.js, Python, OpenCV"
                value={technologies}
                onChange={(e) => setTechnologies(e.target.value)}
                className="w-full px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Required Skills Needed</label>
              <input
                type="text"
                placeholder="Frontend, Backend, ML Engineer"
                value={requiredSkills}
                onChange={(e) => setRequiredSkills(e.target.value)}
                className="w-full px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">GitHub Repository (Optional)</label>
            <input
              type="url"
              placeholder="https://github.com/org/project"
              value={githubRepo}
              onChange={(e) => setGithubRepo(e.target.value)}
              className="w-full px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all"
          >
            {submitting ? 'Publishing Project...' : 'Launch Project Idea'}
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default ProjectHub;
