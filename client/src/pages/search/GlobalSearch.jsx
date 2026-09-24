import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { LoadingState } from '../../components/LoadingState';
import { EmptyState } from '../../components/EmptyState';
import { Badge } from '../../components/LoadingState';
import {
  Search,
  Users,
  FolderGit2,
  BookOpen,
  Calendar,
  Users2,
  HelpCircle,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';

export const GlobalSearch = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const [query, setQuery] = useState(initialQuery);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const { showToast } = useToast();

  const handleSearch = async (searchQuery) => {
    if (!searchQuery || !searchQuery.trim()) {
      setResults(null);
      return;
    }

    try {
      setLoading(true);
      const res = await api.get(`/search?q=${encodeURIComponent(searchQuery)}`);
      setResults(res.data.results || {});
    } catch (err) {
      showToast(err.response?.data?.message || 'Search failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialQuery) {
      handleSearch(initialQuery);
    }
  }, [initialQuery]);

  const onSearchSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      setSearchParams({ q: query.trim() });
      handleSearch(query.trim());
    }
  };

  const totalResults = results
    ? (results.students?.length || 0) +
      (results.projects?.length || 0) +
      (results.resources?.length || 0) +
      (results.events?.length || 0) +
      (results.clubs?.length || 0) +
      (results.lostItems?.length || 0)
    : 0;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header & Search Bar */}
      <div className="glass-card p-6 rounded-2xl border border-slate-700/60">
        <h1 className="text-2xl font-bold text-slate-100 mb-2 flex items-center gap-2">
          <Search className="w-6 h-6 text-indigo-400" />
          Global Campus Search
        </h1>
        <p className="text-sm text-slate-400 mb-6">
          Find students, open project teams, learning resources, upcoming events, clubs, and lost items across campus.
        </p>

        <form onSubmit={onSearchSubmit} className="relative">
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search keywords, skills (e.g. React, Python), subjects, event names, club titles..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-slate-900/80 border border-slate-700 rounded-xl pl-12 pr-28 py-3.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors shadow-inner"
          />
          <button
            type="submit"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-semibold transition-colors shadow-lg shadow-indigo-500/25"
          >
            Search
          </button>
        </form>
      </div>

      {/* Tabs */}
      {results && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === 'all'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
            }`}
          >
            All Results ({totalResults})
          </button>
          <button
            onClick={() => setActiveTab('students')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === 'students'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
            }`}
          >
            Students ({results.students?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('projects')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === 'projects'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
            }`}
          >
            Projects ({results.projects?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('resources')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === 'resources'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
            }`}
          >
            Resources ({results.resources?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('events')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === 'events'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
            }`}
          >
            Events ({results.events?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('clubs')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === 'clubs'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
            }`}
          >
            Clubs ({results.clubs?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('lost')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === 'lost'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
            }`}
          >
            Lost & Found ({results.lostItems?.length || 0})
          </button>
        </div>
      )}

      {/* Results Content */}
      {loading ? (
        <LoadingState message="Searching real MongoDB records..." />
      ) : !results ? (
        <EmptyState
          icon={Search}
          title="Type a query to search CollegeHub"
          description="Instant discovery across student skill profiles, academic resources, clubs, and campus events."
        />
      ) : totalResults === 0 ? (
        <EmptyState
          icon={Search}
          title={`No matches found for "${query}"`}
          description="Try searching with broader terms or check the spelling."
        />
      ) : (
        <div className="space-y-8">
          {/* Students */}
          {(activeTab === 'all' || activeTab === 'students') && results.students?.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-400" />
                  Students ({results.students.length})
                </h2>
                <Link to="/connect" className="text-xs text-indigo-400 hover:underline flex items-center gap-1">
                  View in CampusConnect <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {results.students.map((student) => (
                  <div key={student._id} className="glass-card p-4 rounded-xl border border-slate-700/60 flex items-start gap-3">
                    <div className="w-12 h-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-indigo-400 shrink-0">
                      {student.avatar ? (
                        <img src={student.avatar} alt={student.name} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        student.name?.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-100 truncate">{student.name}</h3>
                      <p className="text-xs text-slate-400 truncate">
                        {student.department?.code || student.department?.name || 'Student'} • Year {student.year || '1'}
                      </p>
                      {student.skills?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {student.skills.slice(0, 3).map((s, idx) => (
                            <span key={idx} className="px-2 py-0.5 bg-indigo-500/10 text-indigo-300 text-[10px] rounded-md border border-indigo-500/20">
                              {s}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Projects */}
          {(activeTab === 'all' || activeTab === 'projects') && results.projects?.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2">
                  <FolderGit2 className="w-5 h-5 text-emerald-400" />
                  Projects ({results.projects.length})
                </h2>
                <Link to="/projects" className="text-xs text-indigo-400 hover:underline flex items-center gap-1">
                  View in ProjectHub <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {results.projects.map((proj) => (
                  <div key={proj._id} className="glass-card p-5 rounded-xl border border-slate-700/60 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-slate-100">{proj.title}</h3>
                      <Badge variant="primary">{proj.status}</Badge>
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-2">{proj.description}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {proj.technologies?.map((tech, idx) => (
                        <span key={idx} className="px-2 py-0.5 bg-slate-800 text-slate-300 text-[11px] rounded border border-slate-700">
                          {tech}
                        </span>
                      ))}
                    </div>
                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                      <span>Created by {proj.createdBy?.name || 'Student'}</span>
                      <Link to={`/projects/${proj._id}`} className="text-indigo-400 hover:underline flex items-center gap-1">
                        Details <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Resources */}
          {(activeTab === 'all' || activeTab === 'resources') && results.resources?.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-amber-400" />
                  Learning Resources ({results.resources.length})
                </h2>
                <Link to="/resources" className="text-xs text-indigo-400 hover:underline flex items-center gap-1">
                  View Resource Library <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {results.resources.map((resItem) => (
                  <div key={resItem._id} className="glass-card p-4 rounded-xl border border-slate-700/60 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                        {resItem.type}
                      </span>
                      <span className="text-xs text-slate-400">{resItem.downloadCount || 0} downloads</span>
                    </div>
                    <h3 className="font-semibold text-slate-100 text-sm">{resItem.title}</h3>
                    <p className="text-xs text-slate-400 line-clamp-2">{resItem.description}</p>
                    <div className="text-xs text-slate-400 pt-2 border-t border-slate-800/80">
                      Subject: {resItem.subject}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Events */}
          {(activeTab === 'all' || activeTab === 'events') && results.events?.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-purple-400" />
                  Upcoming Events ({results.events.length})
                </h2>
                <Link to="/events" className="text-xs text-indigo-400 hover:underline flex items-center gap-1">
                  Browse EventHub <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {results.events.map((evt) => (
                  <div key={evt._id} className="glass-card p-4 rounded-xl border border-slate-700/60 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="accent">{evt.category}</Badge>
                        <span className="text-xs text-slate-400">
                          {new Date(evt.startDate).toLocaleDateString()}
                        </span>
                      </div>
                      <h3 className="font-semibold text-slate-100">{evt.title}</h3>
                      <p className="text-xs text-slate-400 line-clamp-2 mt-1">{evt.description}</p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                      <span>Venue: {evt.venue}</span>
                      <Link to="/events" className="text-indigo-400 hover:underline">
                        Register / Details
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Clubs */}
          {(activeTab === 'all' || activeTab === 'clubs') && results.clubs?.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2">
                  <Users2 className="w-5 h-5 text-cyan-400" />
                  Clubs & Communities ({results.clubs.length})
                </h2>
                <Link to="/clubs" className="text-xs text-indigo-400 hover:underline flex items-center gap-1">
                  View Clubs <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {results.clubs.map((club) => (
                  <div key={club._id} className="glass-card p-4 rounded-xl border border-slate-700/60 space-y-2">
                    <h3 className="font-semibold text-slate-100">{club.name}</h3>
                    <Badge variant="info">{club.category}</Badge>
                    <p className="text-xs text-slate-400 line-clamp-2">{club.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Lost & Found */}
          {(activeTab === 'all' || activeTab === 'lost') && results.lostItems?.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-rose-400" />
                  Lost & Found Items ({results.lostItems.length})
                </h2>
                <Link to="/lost-found" className="text-xs text-indigo-400 hover:underline flex items-center gap-1">
                  View CampusLost <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {results.lostItems.map((item) => (
                  <div key={item._id} className="glass-card p-4 rounded-xl border border-slate-700/60 space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge variant={item.type === 'lost' ? 'danger' : 'success'}>
                        {item.type.toUpperCase()}
                      </Badge>
                      <span className="text-xs text-slate-400">{item.location}</span>
                    </div>
                    <h3 className="font-semibold text-slate-100 text-sm">{item.title}</h3>
                    <p className="text-xs text-slate-400 line-clamp-2">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
