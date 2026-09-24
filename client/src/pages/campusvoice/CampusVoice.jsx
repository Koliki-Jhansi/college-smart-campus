import React, { useState, useEffect } from 'react';
import { voiceApi } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/common/Modal';
import { LoadingState } from '../../components/common/LoadingState';
import EmptyState from '../../components/common/EmptyState';
import {
  MessageSquareHeart,
  ThumbsUp,
  Plus,
  Search,
  ShieldCheck,
  EyeOff,
  Sparkles,
  MessageCircle,
} from 'lucide-react';

const CampusVoice = () => {
  const { user, isAdmin } = useAuth();
  const { addToast } = useToast();

  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('All');
  const [status, setStatus] = useState('All');
  const [search, setSearch] = useState('');

  // Submit Modal
  const [newModalOpen, setNewModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [newCategory, setNewCategory] = useState('Campus Facilities');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Admin Response Modal
  const [respondModalOpen, setRespondModalOpen] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState(null);
  const [adminResponse, setAdminResponse] = useState('');
  const [responseStatus, setResponseStatus] = useState('Under Review');

  const fetchSuggestions = async () => {
    try {
      setLoading(true);
      const res = await voiceApi.getSuggestions({ category, status, search });
      if (res.data.success) {
        setSuggestions(res.data.suggestions || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuggestions();
  }, [category, status]);

  const handleCreateSuggestion = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await voiceApi.createSuggestion({
        title,
        description,
        category: newCategory,
        isAnonymous,
      });
      addToast('Suggestion submitted to CampusVoice!', 'success');
      setNewModalOpen(false);
      setTitle('');
      setDescription('');
      setIsAnonymous(false);
      fetchSuggestions();
    } catch (err) {
      addToast('Failed to post suggestion.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleVote = async (suggId) => {
    try {
      const res = await voiceApi.toggleVote(suggId);
      setSuggestions((prev) =>
        prev.map((s) =>
          s._id === suggId
            ? { ...s, upvotesCount: res.data.upvotesCount, hasUpvoted: res.data.upvoted }
            : s
        )
      );
    } catch (err) {
      addToast('Error voting.', 'error');
    }
  };

  const handleAdminRespond = async (e) => {
    e.preventDefault();
    try {
      await voiceApi.respond(selectedSuggestion._id, {
        status: responseStatus,
        adminResponse,
      });
      addToast('Admin response published!', 'success');
      setRespondModalOpen(false);
      setAdminResponse('');
      fetchSuggestions();
    } catch (err) {
      addToast('Failed to post response.', 'error');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <MessageSquareHeart className="w-7 h-7 text-rose-400" />
            <span>CampusVoice Feedback & Ideas Hub</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Propose improvements, upvote peer suggestions, and receive official administration responses
          </p>
        </div>

        <button
          onClick={() => setNewModalOpen(true)}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-rose-600/30 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Propose Idea</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="glass-card rounded-3xl p-4 sm:p-5 border border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search suggestions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
          />
        </div>

        <div>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500"
          >
            <option value="All">All Categories</option>
            <option value="Academic">Academic</option>
            <option value="Campus Facilities">Campus Facilities</option>
            <option value="Hostel & Food">Hostel & Food</option>
            <option value="Library">Library</option>
            <option value="Extracurricular">Extracurricular</option>
            <option value="Transport">Transport</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500"
          >
            <option value="All">All Statuses</option>
            <option value="Submitted">Submitted</option>
            <option value="Under Review">Under Review</option>
            <option value="Planned">Planned</option>
            <option value="Implemented">Implemented</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Suggestions Feed */}
      {loading ? (
        <LoadingState message="Fetching suggestions from MongoDB..." />
      ) : suggestions.length === 0 ? (
        <EmptyState
          icon={MessageSquareHeart}
          title="No suggestions in this category"
          description="Have an idea to improve campus dining, library hours, or academics? Post it!"
          actionLabel="Post Suggestion"
          onAction={() => setNewModalOpen(true)}
        />
      ) : (
        <div className="space-y-4">
          {suggestions.map((s) => {
            const statusColors = {
              Implemented: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
              Planned: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
              'Under Review': 'bg-amber-500/10 text-amber-400 border-amber-500/30',
              Submitted: 'bg-slate-800 text-slate-300 border-slate-700',
              Rejected: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
            }[s.status] || 'bg-slate-800 text-slate-300';

            return (
              <div key={s._id} className="glass-card rounded-3xl p-6 border border-slate-800 flex flex-col sm:flex-row gap-5 items-start">
                {/* Upvote Button */}
                <button
                  onClick={() => handleToggleVote(s._id)}
                  className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all shrink-0 w-14 ${
                    s.hasUpvoted
                      ? 'bg-rose-600/20 border-rose-500 text-rose-400 shadow-md shadow-rose-600/20'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                  }`}
                >
                  <ThumbsUp className={`w-5 h-5 mb-1 ${s.hasUpvoted ? 'fill-current' : ''}`} />
                  <span className="text-xs font-black">{s.upvotesCount || 0}</span>
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                        {s.category}
                      </span>
                      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${statusColors}`}>
                        {s.status}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                      {s.isAnonymous ? (
                        <>
                          <EyeOff className="w-3.5 h-3.5 text-slate-500" />
                          <span>Anonymous Student</span>
                        </>
                      ) : (
                        <span>By {s.createdBy?.name}</span>
                      )}
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-white">{s.title}</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">{s.description}</p>

                  {/* Official Admin Reply */}
                  {s.adminResponse && (
                    <div className="mt-3 p-3.5 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-300">
                        <ShieldCheck className="w-4 h-4 text-indigo-400" />
                        <span>Official Campus Administration Response</span>
                      </div>
                      <p className="text-xs text-slate-200">{s.adminResponse}</p>
                    </div>
                  )}

                  {/* Admin Response Trigger */}
                  {isAdmin && (
                    <div className="pt-2 flex justify-end">
                      <button
                        onClick={() => {
                          setSelectedSuggestion(s);
                          setResponseStatus(s.status);
                          setAdminResponse(s.adminResponse || '');
                          setRespondModalOpen(true);
                        }}
                        className="text-xs font-bold text-indigo-400 hover:text-indigo-300"
                      >
                        Respond as Admin →
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Propose Idea Modal */}
      <Modal isOpen={newModalOpen} onClose={() => setNewModalOpen(false)} title="Submit Campus Suggestion">
        <form onSubmit={handleCreateSuggestion} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Title *</label>
            <input
              type="text"
              placeholder="e.g. 24/7 Library Study Lounge Access during exams"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Category</label>
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500"
            >
              <option value="Academic">Academic</option>
              <option value="Campus Facilities">Campus Facilities</option>
              <option value="Hostel & Food">Hostel & Food</option>
              <option value="Library">Library</option>
              <option value="Extracurricular">Extracurricular</option>
              <option value="Transport">Transport</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Detailed Suggestion *</label>
            <textarea
              rows={3}
              placeholder="Explain how this benefits students and campus life..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className="w-full px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="anonCheckbox"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="w-4 h-4 rounded text-rose-600 bg-slate-900 border-slate-800"
            />
            <label htmlFor="anonCheckbox" className="text-xs text-slate-300 font-medium cursor-pointer">
              Post anonymously (Hides name from student directory)
            </label>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-rose-600/30"
          >
            {submitting ? 'Posting idea...' : 'Submit Idea to CampusVoice'}
          </button>
        </form>
      </Modal>

      {/* Admin Response Modal */}
      <Modal isOpen={respondModalOpen} onClose={() => setRespondModalOpen(false)} title="Post Official Admin Response">
        <form onSubmit={handleAdminRespond} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Status Update</label>
            <select
              value={responseStatus}
              onChange={(e) => setResponseStatus(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none"
            >
              <option value="Under Review">Under Review</option>
              <option value="Planned">Planned</option>
              <option value="Implemented">Implemented</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Official Response Message</label>
            <textarea
              rows={3}
              placeholder="Official comment and implementation roadmap..."
              value={adminResponse}
              onChange={(e) => setAdminResponse(e.target.value)}
              required
              className="w-full px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md"
          >
            Publish Response
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default CampusVoice;
