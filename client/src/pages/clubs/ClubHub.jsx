import React, { useState, useEffect } from 'react';
import { clubApi } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/common/Modal';
import { LoadingState } from '../../components/common/LoadingState';
import EmptyState from '../../components/common/EmptyState';
import {
  Flag,
  Users,
  Plus,
  Search,
  Bell,
  Check,
  X,
  ExternalLink,
  Shield,
} from 'lucide-react';

const ClubHub = () => {
  const { user, isAdmin, isClubCoordinator } = useAuth();
  const { addToast } = useToast();

  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Create Club Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Technical');

  // Club Detail Modal
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedClubData, setSelectedClubData] = useState(null);
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementContent, setAnnouncementContent] = useState('');

  const fetchClubs = async () => {
    try {
      setLoading(true);
      const res = await clubApi.getClubs({ search });
      if (res.data.success) {
        setClubs(res.data.clubs || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClubs();
  }, []);

  const handleCreateClub = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('code', code);
      formData.append('description', description);
      formData.append('category', category);

      await clubApi.createClub(formData);
      addToast('Club registered successfully!', 'success');
      setCreateModalOpen(false);
      setName('');
      setCode('');
      setDescription('');
      fetchClubs();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to create club.', 'error');
    }
  };

  const openClubDetail = async (clubId) => {
    try {
      const res = await clubApi.getClubById(clubId);
      if (res.data.success) {
        setSelectedClubData(res.data);
        setDetailModalOpen(true);
      }
    } catch (err) {
      addToast('Failed to load club details.', 'error');
    }
  };

  const handleJoinClub = async (clubId) => {
    try {
      const res = await clubApi.requestJoin(clubId, { joinMessage: 'Interested in actively participating in club events!' });
      addToast(res.data.message || 'Membership application sent!', 'success');
      fetchClubs();
      if (selectedClubData) openClubDetail(clubId);
    } catch (err) {
      addToast(err.response?.data?.message || 'Could not join club.', 'error');
    }
  };

  const handleMemberStatus = async (memberId, status) => {
    try {
      await clubApi.handleMember(memberId, { status });
      addToast(`Member status updated to ${status}.`, 'success');
      openClubDetail(selectedClubData.club._id);
    } catch (err) {
      addToast('Error updating member.', 'error');
    }
  };

  const handlePostAnnouncement = async (e) => {
    e.preventDefault();
    try {
      await clubApi.createAnnouncement(selectedClubData.club._id, {
        title: announcementTitle,
        content: announcementContent,
      });
      addToast('Announcement broadcasted to members!', 'success');
      setAnnouncementTitle('');
      setAnnouncementContent('');
      openClubDetail(selectedClubData.club._id);
    } catch (err) {
      addToast('Failed to post announcement.', 'error');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <Flag className="w-7 h-7 text-indigo-400" />
            <span>Campus Clubs & Student Societies</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Join technical chapters, cultural groups, and sports teams led by student coordinators
          </p>
        </div>

        {(isAdmin || isClubCoordinator) && (
          <button
            onClick={() => setCreateModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Register New Club</span>
          </button>
        )}
      </div>

      {/* Clubs Grid */}
      {loading ? (
        <LoadingState message="Fetching campus clubs..." />
      ) : clubs.length === 0 ? (
        <EmptyState
          icon={Flag}
          title="No campus clubs registered yet"
          description="Register the first student chapter or society on CollegeHub."
          actionLabel="Register Club"
          onAction={() => setCreateModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {clubs.map((c) => (
            <div key={c._id} className="glass-card-hover rounded-3xl p-6 border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] uppercase font-bold px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                    {c.category}
                  </span>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <Users className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{c.membersCount || 1} Members</span>
                  </div>
                </div>

                <h3 className="text-lg font-bold text-white mb-1">{c.name}</h3>
                <p className="text-xs font-mono text-indigo-300 mb-2">#{c.code}</p>
                <p className="text-xs text-slate-400 line-clamp-3 mb-4">{c.description}</p>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center gap-2">
                <button
                  onClick={() => openClubDetail(c._id)}
                  className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200"
                >
                  View Details
                </button>

                {c.membershipStatus === 'none' && (
                  <button
                    onClick={() => handleJoinClub(c._id)}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md"
                  >
                    Join
                  </button>
                )}
                {c.membershipStatus === 'pending' && (
                  <span className="px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-400 text-xs font-bold border border-amber-500/30">
                    Pending
                  </span>
                )}
                {c.membershipStatus === 'active' && (
                  <span className="px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/30">
                    Member
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Club Modal */}
      <Modal isOpen={createModalOpen} onClose={() => setCreateModalOpen(false)} title="Register Student Club / Chapter">
        <form onSubmit={handleCreateClub} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Club Name *</label>
            <input
              type="text"
              placeholder="e.g. Google Developer Student Club / ACM Chapter"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Club Code / Acronym *</label>
              <input
                type="text"
                placeholder="e.g. GDSC-CH"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                required
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white uppercase focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="Technical">Technical</option>
                <option value="Cultural">Cultural</option>
                <option value="Sports">Sports</option>
                <option value="Literary">Literary</option>
                <option value="Arts & Design">Arts & Design</option>
                <option value="Entrepreneurship">Entrepreneurship</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Description & Mission *</label>
            <textarea
              rows={3}
              placeholder="Club vision, activities, and community values..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className="w-full px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30"
          >
            Register Club
          </button>
        </form>
      </Modal>

      {/* Club Details Modal */}
      {selectedClubData && (
        <Modal isOpen={detailModalOpen} onClose={() => setDetailModalOpen(false)} title={selectedClubData.club?.name}>
          <div className="space-y-5">
            <div>
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400">
                {selectedClubData.club?.category}
              </span>
              <p className="text-xs text-slate-300 mt-2">{selectedClubData.club?.description}</p>
            </div>

            {/* Announcements */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-slate-200 flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-400" />
                <span>Club Announcements</span>
              </h4>

              {selectedClubData.announcements?.length > 0 ? (
                selectedClubData.announcements.map((a) => (
                  <div key={a._id} className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-xs">
                    <div className="font-bold text-white">{a.title}</div>
                    <p className="text-slate-300 mt-0.5">{a.content}</p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500">No announcements posted yet.</p>
              )}

              {selectedClubData.isCoordinator && (
                <form onSubmit={handlePostAnnouncement} className="pt-2 border-t border-slate-800 space-y-2">
                  <input
                    type="text"
                    placeholder="Announcement Title..."
                    value={announcementTitle}
                    onChange={(e) => setAnnouncementTitle(e.target.value)}
                    required
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none"
                  />
                  <textarea
                    rows={2}
                    placeholder="Announcement content..."
                    value={announcementContent}
                    onChange={(e) => setAnnouncementContent(e.target.value)}
                    required
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none"
                  />
                  <button type="submit" className="w-full py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold">
                    Broadcast Announcement
                  </button>
                </form>
              )}
            </div>

            {/* Pending Requests for Coordinator */}
            {selectedClubData.isCoordinator && selectedClubData.pendingRequests?.length > 0 && (
              <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/30 space-y-2">
                <h4 className="text-xs font-bold text-amber-400">Pending Join Requests:</h4>
                {selectedClubData.pendingRequests.map((req) => (
                  <div key={req._id} className="flex items-center justify-between text-xs p-2 bg-slate-900 rounded-xl">
                    <span className="font-bold text-white">{req.user?.name}</span>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => handleMemberStatus(req._id, 'active')}
                        className="p-1 rounded bg-emerald-600 text-white"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleMemberStatus(req._id, 'rejected')}
                        className="p-1 rounded bg-rose-600 text-white"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ClubHub;
