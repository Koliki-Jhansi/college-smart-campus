import React, { useState, useEffect } from 'react';
import { complaintApi } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/common/Modal';
import { LoadingState } from '../../components/common/LoadingState';
import EmptyState from '../../components/common/EmptyState';
import {
  Wrench,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Plus,
  Camera,
  Star,
  MapPin,
  MessageSquare,
  ShieldAlert,
} from 'lucide-react';

const CampusFix = () => {
  const { user, isMaintenanceStaff, isAdmin } = useAuth();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState('my'); // 'my' or 'workboard'
  const [complaints, setComplaints] = useState([]);
  const [workboard, setWorkboard] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Complaint Modal Form
  const [newModalOpen, setNewModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Wi-Fi');
  const [location, setLocation] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [photo, setPhoto] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Ticket Detail & Resolution Modal
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [resolutionProof, setResolutionProof] = useState(null);
  const [resolutionNotes, setResolutionNotes] = useState('');

  // Rating & Closure Modal
  const [closeModalOpen, setCloseModalOpen] = useState(false);
  const [userRating, setUserRating] = useState(5);
  const [userFeedback, setUserFeedback] = useState('');

  const fetchMyComplaints = async () => {
    try {
      setLoading(true);
      const res = await complaintApi.getMyComplaints();
      if (res.data.success) {
        setComplaints(res.data.complaints || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkboard = async () => {
    try {
      setLoading(true);
      const res = await complaintApi.getAllComplaints();
      if (res.data.success) {
        setWorkboard(res.data.complaints || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isMaintenanceStaff || isAdmin) {
      setActiveTab('workboard');
    }
  }, [isMaintenanceStaff, isAdmin]);

  useEffect(() => {
    if (activeTab === 'my') fetchMyComplaints();
    else fetchWorkboard();
  }, [activeTab]);

  const handleCreateComplaint = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('category', category);
      formData.append('location', location);
      formData.append('priority', priority);
      if (photo) formData.append('photo', photo);

      await complaintApi.createComplaint(formData);
      addToast('Ticket reported! Staff notified with SLA deadline.', 'success');
      setNewModalOpen(false);
      setTitle('');
      setDescription('');
      setLocation('');
      setPhoto(null);
      fetchMyComplaints();
      setActiveTab('my');
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to report complaint.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const openTicketDetail = async (complaintId) => {
    try {
      const res = await complaintApi.getComplaintById(complaintId);
      if (res.data.success) {
        setSelectedTicket(res.data.complaint);
        setComments(res.data.comments || []);
        setDetailModalOpen(true);
      }
    } catch (err) {
      addToast('Could not load ticket details.', 'error');
    }
  };

  const handleUpdateStatus = async (newStatus) => {
    try {
      const formData = new FormData();
      formData.append('status', newStatus);
      if (resolutionNotes) formData.append('resolutionNotes', resolutionNotes);
      if (resolutionProof) formData.append('resolutionProof', resolutionProof);

      await complaintApi.updateStatus(selectedTicket._id, formData);
      addToast(`Status updated to ${newStatus}!`, 'success');
      setDetailModalOpen(false);
      if (activeTab === 'workboard') fetchWorkboard();
      else fetchMyComplaints();
    } catch (err) {
      addToast('Failed to update status.', 'error');
    }
  };

  const handleConfirmClose = async (e) => {
    e.preventDefault();
    try {
      await complaintApi.confirmClosure(selectedTicket._id, {
        rating: Number(userRating),
        feedback: userFeedback,
      });
      addToast('Thank you for confirming! Ticket closed.', 'success');
      setCloseModalOpen(false);
      setDetailModalOpen(false);
      fetchMyComplaints();
    } catch (err) {
      addToast('Failed to close ticket.', 'error');
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const formData = new FormData();
      formData.append('message', newComment);
      const res = await complaintApi.addComment(selectedTicket._id, formData);
      setComments((prev) => [...prev, res.data.comment]);
      setNewComment('');
    } catch (err) {
      addToast('Failed to post comment.', 'error');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <Wrench className="w-7 h-7 text-amber-400" />
            <span>CampusFix Maintenance Hub</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            SLA-monitored infrastructure issue tracking with real-time escalation and verified proof of work
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center p-1 rounded-2xl bg-slate-900 border border-slate-800">
            <button
              onClick={() => setActiveTab('my')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'my' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              My Tickets ({complaints.length})
            </button>
            {(isMaintenanceStaff || isAdmin) && (
              <button
                onClick={() => setActiveTab('workboard')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'workboard' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                Staff Workboard ({workboard.length})
              </button>
            )}
          </div>

          <button
            onClick={() => setNewModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white text-xs font-bold shadow-lg shadow-amber-600/30 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Report Problem</span>
          </button>
        </div>
      </div>

      {/* Tickets Feed */}
      <div className="space-y-6">
        {loading ? (
          <LoadingState message="Fetching maintenance tickets..." />
        ) : (activeTab === 'my' ? complaints : workboard).length === 0 ? (
          <EmptyState
            icon={Wrench}
            title={activeTab === 'my' ? "You haven't reported any campus issues." : 'All clear! No open maintenance tickets.'}
            description="Notice a Wi-Fi outage, lab equipment issue, or water leakage? Report it here."
            actionLabel="Report an Issue"
            onAction={() => setNewModalOpen(true)}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(activeTab === 'my' ? complaints : workboard).map((item) => {
              const isBreached = item.slaBreached && !['Resolved', 'Closed'].includes(item.status);
              const priorityColors = {
                Critical: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
                High: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
                Medium: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
                Low: 'bg-slate-800 text-slate-300 border-slate-700',
              }[item.priority] || 'bg-slate-800 text-slate-300';

              return (
                <div
                  key={item._id}
                  onClick={() => openTicketDetail(item._id)}
                  className="glass-card-hover rounded-3xl p-6 border border-slate-800 flex flex-col justify-between cursor-pointer"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="font-mono text-xs font-bold text-slate-400">#{item.ticketNumber}</span>
                      <div className="flex items-center gap-1.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${priorityColors}`}>
                          {item.priority}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                            item.status === 'Resolved' || item.status === 'Closed'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : item.status === 'In Progress'
                              ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                          }`}
                        >
                          {item.status}
                        </span>
                      </div>
                    </div>

                    <h3 className="text-base font-bold text-white mb-1">{item.title}</h3>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-3">
                      <MapPin className="w-3.5 h-3.5 text-amber-400" />
                      <span>{item.location}</span>
                    </div>

                    <p className="text-xs text-slate-400 line-clamp-2 mb-4">{item.description}</p>
                  </div>

                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <Clock className="w-3.5 h-3.5" />
                      <span>SLA: {item.slaHours}h</span>
                    </div>

                    {isBreached && (
                      <span className="text-[10px] font-bold text-rose-400 flex items-center gap-1">
                        <ShieldAlert className="w-3.5 h-3.5" />
                        <span>SLA Breached</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Report Problem Modal */}
      <Modal isOpen={newModalOpen} onClose={() => setNewModalOpen(false)} title="Report Campus Infrastructure Issue">
        <form onSubmit={handleCreateComplaint} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Issue Title *</label>
            <input
              type="text"
              placeholder="e.g. Wi-Fi Access Point offline in 2nd floor library"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
              >
                <option value="Wi-Fi">Wi-Fi & Network</option>
                <option value="Electrical">Electrical & Lighting</option>
                <option value="Classroom">Classroom & Projector</option>
                <option value="Lab Equipment">Lab Equipment</option>
                <option value="Water">Water & Sanitation</option>
                <option value="Cleanliness">Cleanliness</option>
                <option value="Hostel Maintenance">Hostel Maintenance</option>
                <option value="Transport">Transport</option>
                <option value="Infrastructure">Infrastructure</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Priority (Dictates SLA)</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
              >
                <option value="Low">Low (48h SLA)</option>
                <option value="Medium">Medium (12h SLA)</option>
                <option value="High">High (4h SLA)</option>
                <option value="Critical">Critical (1h Urgent SLA)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Specific Campus Location *</label>
            <input
              type="text"
              placeholder="e.g. Science Block, Floor 2, Room 204"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              required
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Detailed Description *</label>
            <textarea
              rows={3}
              placeholder="Describe the issue symptoms, equipment ID if any, and urgency..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Attach Photo Evidence</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setPhoto(e.target.files[0])}
              className="w-full px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-amber-500"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white font-bold text-xs shadow-lg shadow-amber-600/30"
          >
            {submitting ? 'Submitting ticket...' : 'Dispatch Ticket to Facilities'}
          </button>
        </form>
      </Modal>

      {/* Ticket Details & Action Modal */}
      {selectedTicket && (
        <Modal isOpen={detailModalOpen} onClose={() => setDetailModalOpen(false)} title={`Ticket #${selectedTicket.ticketNumber}`}>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-white">{selectedTicket.title}</span>
              <span className="px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 text-xs font-bold uppercase">
                {selectedTicket.status}
              </span>
            </div>

            <p className="text-xs text-slate-300">{selectedTicket.description}</p>
            <div className="text-xs text-slate-400">Location: {selectedTicket.location} • Category: {selectedTicket.category}</div>

            {selectedTicket.photo && (
              <div>
                <span className="text-xs font-bold text-slate-400">Attached Evidence:</span>
                <img src={selectedTicket.photo} alt="Evidence" className="mt-1 max-h-48 rounded-2xl object-cover border border-slate-800" />
              </div>
            )}

            {/* Resolution Proof Photo if Resolved */}
            {selectedTicket.resolutionProof && (
              <div className="p-3 rounded-2xl bg-emerald-950/20 border border-emerald-500/30">
                <span className="text-xs font-bold text-emerald-400">Proof of Completion:</span>
                <img src={selectedTicket.resolutionProof} alt="Completion Proof" className="mt-1 max-h-48 rounded-2xl object-cover border border-emerald-500/20" />
                {selectedTicket.resolutionNotes && <p className="text-xs text-slate-300 mt-2">{selectedTicket.resolutionNotes}</p>}
              </div>
            )}

            {/* Staff Resolution Form */}
            {(isMaintenanceStaff || isAdmin) && selectedTicket.status !== 'Closed' && selectedTicket.status !== 'Resolved' && (
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                <span className="text-xs font-bold text-amber-400 uppercase">Staff Actions:</span>
                <div className="flex gap-2">
                  {selectedTicket.status === 'Open' || selectedTicket.status === 'Assigned' ? (
                    <button
                      onClick={() => handleUpdateStatus('In Progress')}
                      className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold"
                    >
                      Start Work (Mark In Progress)
                    </button>
                  ) : (
                    <button
                      onClick={() => handleUpdateStatus('Resolved')}
                      className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
                    >
                      Mark Resolved & Upload Proof
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Reporter Confirm & Close Action */}
            {String(selectedTicket.reportedBy?._id || selectedTicket.reportedBy) === String(user._id) && selectedTicket.status === 'Resolved' && (
              <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/40 space-y-2 text-center">
                <span className="text-xs font-bold text-emerald-300">Issue has been marked resolved by facilities staff!</span>
                <button
                  onClick={() => setCloseModalOpen(true)}
                  className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md"
                >
                  Confirm Resolution & Rate Service ⭐
                </button>
              </div>
            )}

            {/* Comments Thread */}
            <div className="pt-4 border-t border-slate-800 space-y-2">
              <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-indigo-400" />
                <span>Ticket Notes & Updates</span>
              </h4>

              <div className="max-h-40 overflow-y-auto space-y-2 pr-1">
                {comments.map((c) => (
                  <div key={c._id} className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                    <div className="flex justify-between font-bold text-indigo-300 mb-0.5">
                      <span>{c.user?.name}</span>
                      <span className="text-[10px] text-slate-500">{new Date(c.createdAt).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-slate-300">{c.message}</p>
                  </div>
                ))}
              </div>

              <form onSubmit={handleAddComment} className="flex gap-2 pt-2">
                <input
                  type="text"
                  placeholder="Add note or update..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                />
                <button type="submit" className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold">
                  Post
                </button>
              </form>
            </div>
          </div>
        </Modal>
      )}

      {/* Close & Rating Modal */}
      <Modal isOpen={closeModalOpen} onClose={() => setCloseModalOpen(false)} title="Rate Maintenance Service">
        <form onSubmit={handleConfirmClose} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">Service Rating</label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setUserRating(s)}
                  className={`p-2 rounded-xl transition-all ${userRating >= s ? 'text-amber-400 bg-amber-500/10' : 'text-slate-600'}`}
                >
                  <Star className="w-6 h-6 fill-current" />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Feedback Comments</label>
            <textarea
              rows={3}
              placeholder="How promptly was this resolved? Share your feedback..."
              value={userFeedback}
              onChange={(e) => setUserFeedback(e.target.value)}
              className="w-full px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg"
          >
            Confirm & Close Ticket
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default CampusFix;
