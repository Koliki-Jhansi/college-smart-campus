import React, { useState, useEffect } from 'react';
import { skillSwapApi } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/common/Modal';
import { LoadingState } from '../../components/common/LoadingState';
import EmptyState from '../../components/common/EmptyState';
import {
  Repeat,
  Sparkles,
  Users,
  Calendar,
  Star,
  CheckCircle2,
  Clock,
  Video,
  Send,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

const SkillSwapHub = () => {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState('matches'); // 'matches', 'requests', 'sessions'
  const [matches, setMatches] = useState([]);
  const [requestsData, setRequestsData] = useState({ incoming: [], outgoing: [] });
  const [sessionsData, setSessionsData] = useState({ asLearner: [], asMentor: [], stats: {} });
  const [loading, setLoading] = useState(true);

  // Modals
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);

  const [selectedPeer, setSelectedPeer] = useState(null);
  const [selectedReq, setSelectedReq] = useState(null);
  const [selectedSession, setSelectedSession] = useState(null);

  // Request Form
  const [reqSkillWanted, setReqSkillWanted] = useState('');
  const [reqSkillOffered, setReqSkillOffered] = useState('');
  const [reqMessage, setReqMessage] = useState('');

  // Schedule Form
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleDuration, setScheduleDuration] = useState(60);
  const [meetingLink, setMeetingLink] = useState('');

  // Review Form
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');

  const fetchMatches = async () => {
    try {
      setLoading(true);
      const res = await skillSwapApi.getMatches();
      if (res.data.success) {
        setMatches(res.data.matches || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await skillSwapApi.getMyRequests();
      if (res.data.success) {
        setRequestsData(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const res = await skillSwapApi.getMySessions();
      if (res.data.success) {
        setSessionsData(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'matches') fetchMatches();
    else if (activeTab === 'requests') fetchRequests();
    else fetchSessions();
  }, [activeTab]);

  const handleSendRequest = async (e) => {
    e.preventDefault();
    try {
      await skillSwapApi.sendRequest({
        mentorId: selectedPeer.user._id,
        skillWanted: reqSkillWanted,
        skillOffered: reqSkillOffered,
        message: reqMessage,
      });
      addToast('SkillSwap request sent!', 'success');
      setRequestModalOpen(false);
      setReqSkillWanted('');
      setReqSkillOffered('');
      setReqMessage('');
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to send request.', 'error');
    }
  };

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    try {
      await skillSwapApi.scheduleSession({
        requestId: selectedReq._id,
        scheduledAt: scheduleDate,
        durationMinutes: Number(scheduleDuration),
        meetingLink,
      });
      addToast('Session scheduled successfully!', 'success');
      setScheduleModalOpen(false);
      fetchRequests();
    } catch (err) {
      addToast('Failed to schedule session.', 'error');
    }
  };

  const handleCompleteReview = async (e) => {
    e.preventDefault();
    try {
      await skillSwapApi.completeSession(selectedSession._id, {
        rating: Number(rating),
        review: reviewText,
      });
      addToast('Session completed and peer rating recorded!', 'success');
      setReviewModalOpen(false);
      fetchSessions();
    } catch (err) {
      addToast('Error submitting review.', 'error');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <Repeat className="w-7 h-7 text-indigo-400" />
            <span>SkillSwap Peer Learning</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Exchange skills transparently — match with students who want what you know
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center p-1 rounded-2xl bg-slate-900 border border-slate-800">
          <button
            onClick={() => setActiveTab('matches')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'matches' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Skill Matches
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all relative ${
              activeTab === 'requests' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Requests
            {requestsData.incoming?.length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px]">
                {requestsData.incoming.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('sessions')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'sessions' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            My Sessions
          </button>
        </div>
      </div>

      {activeTab === 'matches' && (
        <div className="space-y-6">
          {loading ? (
            <LoadingState message="Calculating transparent skill matches from MongoDB..." />
          ) : matches.length === 0 ? (
            <EmptyState
              icon={Repeat}
              title="No skill matches found yet"
              description="Add the skills you know and skills you want to learn on your profile to find mutual learning peers."
              actionLabel="Update My Skills"
              onAction={() => (window.location.href = `/profile/${user?._id}`)}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {matches.map((m, idx) => (
                <div key={idx} className="glass-card-hover rounded-3xl p-6 border border-slate-800 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="text-[10px] uppercase font-bold px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        {m.matchType === 'mutual-swap' ? 'Mutual Skill Swap (95%)' : `${m.matchScore}% Match`}
                      </span>

                      <div className="flex items-center gap-1 text-xs text-amber-400 font-bold">
                        <Star className="w-3.5 h-3.5 fill-amber-400" />
                        <span>{m.rating}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-indigo-600/30 flex items-center justify-center font-bold text-indigo-300">
                        {m.user?.name?.charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white">{m.user?.name}</h3>
                        <p className="text-[11px] text-slate-400">{m.department}</p>
                      </div>
                    </div>

                    {/* Skill Comparison */}
                    <div className="space-y-2 p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 mb-4 text-xs">
                      {m.theyCanTeachMe?.length > 0 && (
                        <div>
                          <span className="text-indigo-400 font-semibold">Can teach you: </span>
                          <span className="text-slate-200">{m.theyCanTeachMe.join(', ')}</span>
                        </div>
                      )}
                      {m.iCanTeachThem?.length > 0 && (
                        <div>
                          <span className="text-emerald-400 font-semibold">Wants from you: </span>
                          <span className="text-slate-200">{m.iCanTeachThem.join(', ')}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedPeer(m);
                      setReqSkillWanted(m.theyCanTeachMe?.[0] || '');
                      setReqSkillOffered(m.iCanTeachThem?.[0] || '');
                      setRequestModalOpen(true);
                    }}
                    className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2"
                  >
                    <span>Request Skill Session</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'requests' && (
        <div className="space-y-6">
          {/* Incoming Requests */}
          <div className="glass-card rounded-3xl p-6 border border-slate-800">
            <h3 className="text-base font-bold text-white mb-4">Incoming Session Requests</h3>
            {requestsData.incoming?.length === 0 ? (
              <p className="text-xs text-slate-500">No incoming session requests right now.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {requestsData.incoming?.map((req) => (
                  <div key={req._id} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-bold text-white">{req.requester?.name}</div>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-amber-500/10 text-amber-300">
                        {req.status}
                      </span>
                    </div>

                    <div className="text-xs text-slate-300">
                      <div><span className="text-slate-500">Wants to learn:</span> {req.skillWanted}</div>
                      {req.skillOffered && <div><span className="text-slate-500">Offered in return:</span> {req.skillOffered}</div>}
                    </div>

                    {req.status === 'requested' && (
                      <button
                        onClick={() => {
                          setSelectedReq(req);
                          setScheduleModalOpen(true);
                        }}
                        className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-600/20"
                      >
                        Accept & Schedule Session
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'sessions' && (
        <div className="space-y-6">
          {/* Stats Bar */}
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl glass-card border border-slate-800 text-center">
              <div className="text-2xl font-black text-indigo-400">{sessionsData.stats?.sessionsCompleted || 0}</div>
              <div className="text-xs text-slate-400 mt-1">Sessions Completed</div>
            </div>
            <div className="p-4 rounded-2xl glass-card border border-slate-800 text-center">
              <div className="text-2xl font-black text-emerald-400">{sessionsData.stats?.studentsHelped || 0}</div>
              <div className="text-xs text-slate-400 mt-1">Students Helped</div>
            </div>
            <div className="p-4 rounded-2xl glass-card border border-slate-800 text-center">
              <div className="text-2xl font-black text-amber-400 flex items-center justify-center gap-1">
                <Star className="w-5 h-5 fill-amber-400" />
                <span>{sessionsData.stats?.averageRating || '5.0'}</span>
              </div>
              <div className="text-xs text-slate-400 mt-1">Peer Rating</div>
            </div>
          </div>

          {/* As Learner Sessions */}
          <div className="glass-card rounded-3xl p-6 border border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-white">My Learning Sessions</h3>
            {sessionsData.asLearner?.length === 0 ? (
              <p className="text-xs text-slate-500">No learning sessions scheduled yet.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {sessionsData.asLearner?.map((s) => (
                  <div key={s._id} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-white">{s.skill}</h4>
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300">
                        {s.status}
                      </span>
                    </div>

                    <div className="text-xs text-slate-400 flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{new Date(s.scheduledAt).toLocaleString()}</span>
                    </div>

                    {s.meetingLink && (
                      <a
                        href={s.meetingLink}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5"
                      >
                        <Video className="w-4 h-4" />
                        <span>Join Meeting Room</span>
                      </a>
                    )}

                    {s.status === 'scheduled' && (
                      <button
                        onClick={() => {
                          setSelectedSession(s);
                          setReviewModalOpen(true);
                        }}
                        className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md"
                      >
                        Complete Session & Rate Peer
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Request Modal */}
      <Modal isOpen={requestModalOpen} onClose={() => setRequestModalOpen(false)} title="Send SkillSwap Request">
        <form onSubmit={handleSendRequest} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Skill You Want to Learn</label>
            <input
              type="text"
              value={reqSkillWanted}
              onChange={(e) => setReqSkillWanted(e.target.value)}
              required
              className="w-full px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Skill You Can Teach in Return</label>
            <input
              type="text"
              value={reqSkillOffered}
              onChange={(e) => setReqSkillOffered(e.target.value)}
              className="w-full px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Message</label>
            <textarea
              rows={3}
              placeholder="Hi, I'd love to learn from your experience and exchange knowledge!"
              value={reqMessage}
              onChange={(e) => setReqMessage(e.target.value)}
              className="w-full px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30"
          >
            Send Request
          </button>
        </form>
      </Modal>

      {/* Schedule Modal */}
      <Modal isOpen={scheduleModalOpen} onClose={() => setScheduleModalOpen(false)} title="Schedule Skill Session">
        <form onSubmit={handleScheduleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Date & Time *</label>
            <input
              type="datetime-local"
              value={scheduleDate}
              onChange={(e) => setScheduleDate(e.target.value)}
              required
              className="w-full px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Duration (Minutes)</label>
            <input
              type="number"
              value={scheduleDuration}
              onChange={(e) => setScheduleDuration(e.target.value)}
              min={15}
              max={180}
              className="w-full px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Meeting Link / Venue (Optional)</label>
            <input
              type="text"
              placeholder="Google Meet link or Library Table 4"
              value={meetingLink}
              onChange={(e) => setMeetingLink(e.target.value)}
              className="w-full px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg"
          >
            Confirm & Schedule Session
          </button>
        </form>
      </Modal>

      {/* Review Modal */}
      <Modal isOpen={reviewModalOpen} onClose={() => setReviewModalOpen(false)} title="Complete & Review Peer">
        <form onSubmit={handleCompleteReview} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">Rating (1 to 5 Stars)</label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setRating(num)}
                  className={`p-2 rounded-xl transition-all ${
                    rating >= num ? 'text-amber-400 bg-amber-500/10' : 'text-slate-600'
                  }`}
                >
                  <Star className="w-6 h-6 fill-current" />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Review & Feedback</label>
            <textarea
              rows={3}
              placeholder="How helpful was the session? Share your peer review..."
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              className="w-full px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg"
          >
            Submit Feedback
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default SkillSwapHub;
