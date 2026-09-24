import React, { useState, useEffect } from 'react';
import { eventApi } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/common/Modal';
import { QRModal } from '../../components/qr/QRModal';
import { QRScannerModal } from '../../components/qr/QRScannerModal';
import { LoadingState, Pagination } from '../../components/common/LoadingState';
import EmptyState from '../../components/common/EmptyState';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  QrCode,
  Award,
  Plus,
  Scan,
  CheckCircle2,
  Ticket,
  Download,
} from 'lucide-react';

const EventHub = () => {
  const { user, isClubCoordinator, isFaculty, isAdmin } = useAuth();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState('explore'); // 'explore', 'my_registrations'
  const [events, setEvents] = useState([]);
  const [myRegistrations, setMyRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Pagination
  const [category, setCategory] = useState('All');
  const [timeframe, setTimeframe] = useState('upcoming');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [activeTicket, setActiveTicket] = useState(null);

  // Create Event Form
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventCategory, setEventCategory] = useState('Workshop');
  const [venue, setVenue] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [maxParticipants, setMaxParticipants] = useState(100);
  const [eligibility, setEligibility] = useState('Open to all students');
  const [banner, setBanner] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await eventApi.getEvents({ category, timeframe, page, limit: 9 });
      if (res.data.success) {
        setEvents(res.data.events || []);
        setTotalPages(res.data.pagination?.pages || 1);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyRegistrations = async () => {
    try {
      setLoading(true);
      const res = await eventApi.getMyRegistrations();
      if (res.data.success) {
        setMyRegistrations(res.data.registrations || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'explore') fetchEvents();
    else fetchMyRegistrations();
  }, [activeTab, category, timeframe, page]);

  const handleRegister = async (eventId) => {
    try {
      const res = await eventApi.register(eventId);
      addToast(res.data.message || 'Registered! Digital QR Ticket generated.', 'success');
      fetchEvents();
      setActiveTab('my_registrations');
    } catch (err) {
      addToast(err.response?.data?.message || 'Registration failed.', 'error');
    }
  };

  const handleCheckInAttendee = async (code) => {
    const res = await eventApi.checkIn({ ticketCode: code });
    return res.data;
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('category', eventCategory);
      formData.append('venue', venue);
      formData.append('startDate', startDate);
      formData.append('endDate', endDate);
      formData.append('maxParticipants', maxParticipants);
      formData.append('eligibility', eligibility);
      if (banner) formData.append('banner', banner);

      await eventApi.createEvent(formData);
      addToast('Campus event published!', 'success');
      setCreateModalOpen(false);
      setTitle('');
      setDescription('');
      setVenue('');
      setStartDate('');
      setEndDate('');
      fetchEvents();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to create event.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <Calendar className="w-7 h-7 text-emerald-400" />
            <span>EventHub Campus Festivities & Hackathons</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Browse hackathons, technical workshops, coding contests, and download verified participation certificates
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
              All Events
            </button>
            <button
              onClick={() => setActiveTab('my_registrations')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'my_registrations' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              My Tickets ({myRegistrations.length})
            </button>
          </div>

          {(isClubCoordinator || isFaculty || isAdmin) && (
            <button
              onClick={() => setScannerOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-bold text-slate-200 flex items-center gap-1.5"
            >
              <Scan className="w-4 h-4 text-emerald-400" />
              <span>QR Check-In</span>
            </button>
          )}

          {(isClubCoordinator || isFaculty || isAdmin) && (
            <button
              onClick={() => setCreateModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Publish Event</span>
            </button>
          )}
        </div>
      </div>

      {activeTab === 'explore' ? (
        <div className="space-y-6">
          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {['All', 'Hackathon', 'Workshop', 'Coding Contest', 'Technical Fest', 'Cultural Event', 'Sports', 'Seminar'].map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  category === cat
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Events Grid */}
          {loading ? (
            <LoadingState message="Fetching live campus events from MongoDB..." />
          ) : events.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title="No events in this category"
              description="Check back soon for new hackathons and workshops."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((ev) => (
                <div key={ev._id} className="glass-card-hover rounded-3xl p-6 border border-slate-800 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] uppercase font-bold px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        {ev.category}
                      </span>
                      <span className="text-xs text-slate-400 font-semibold">
                        {ev.currentRegistrations || 0} / {ev.maxParticipants} Registered
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-white mb-1.5">{ev.title}</h3>
                    <p className="text-xs text-slate-400 line-clamp-2 mb-4">{ev.description}</p>

                    <div className="space-y-1.5 text-xs text-slate-300 mb-4">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{new Date(ev.startDate).toLocaleDateString()} ({new Date(ev.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{ev.venue}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-800">
                    {ev.isUserRegistered ? (
                      <div className="w-full py-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs font-bold text-center flex items-center justify-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>Registered (Pass Active)</span>
                      </div>
                    ) : (
                      <button
                        disabled={ev.isFull}
                        onClick={() => handleRegister(ev._id)}
                        className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition-all active:scale-95"
                      >
                        {ev.isFull ? 'Event Full' : 'Register Now (Free Ticket)'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <Pagination currentPage={page} totalPages={totalPages} onPageChange={(p) => setPage(p)} />
        </div>
      ) : (
        /* My Registrations & Digital Tickets Tab */
        <div className="space-y-6">
          {loading ? (
            <LoadingState message="Loading your tickets & certificates..." />
          ) : myRegistrations.length === 0 ? (
            <EmptyState
              icon={Ticket}
              title="No registrations yet"
              description="Browse upcoming events and grab your ticket."
              actionLabel="Explore Events"
              onAction={() => setActiveTab('explore')}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myRegistrations.map((reg) => (
                <div key={reg._id} className="glass-card rounded-3xl p-6 border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-emerald-400">{reg.event?.category}</span>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                      {reg.status}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-white">{reg.event?.title}</h3>
                    <p className="text-xs text-slate-400 mt-1">Venue: {reg.event?.venue}</p>
                    <p className="text-xs text-slate-400">Date: {new Date(reg.event?.startDate).toLocaleString()}</p>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs flex items-center justify-between">
                    <span className="text-slate-400">Ticket Code:</span>
                    <span className="font-mono font-bold text-emerald-400">{reg.ticketCode}</span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setActiveTicket(reg);
                        setQrModalOpen(true);
                      }}
                      className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md"
                    >
                      <QrCode className="w-4 h-4" />
                      <span>Digital Ticket</span>
                    </button>

                    {reg.certificateId && (
                      <a
                        href={eventApi.getCertificatePdfUrl(reg.certificateId._id || reg.certificateId)}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-2 rounded-xl bg-amber-500/20 text-amber-300 hover:bg-amber-500 hover:text-white text-xs font-bold flex items-center gap-1 transition-all"
                      >
                        <Award className="w-4 h-4" />
                        <span>PDF Cert</span>
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Publish Event Modal */}
      <Modal isOpen={createModalOpen} onClose={() => setCreateModalOpen(false)} title="Publish Campus Event">
        <form onSubmit={handleCreateEvent} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Event Title *</label>
            <input
              type="text"
              placeholder="e.g. HackCampus 2026: 24-Hour National Hackathon"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Category</label>
              <select
                value={eventCategory}
                onChange={(e) => setEventCategory(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="Hackathon">Hackathon</option>
                <option value="Workshop">Workshop</option>
                <option value="Coding Contest">Coding Contest</option>
                <option value="Technical Fest">Technical Fest</option>
                <option value="Cultural Event">Cultural Event</option>
                <option value="Sports">Sports</option>
                <option value="Seminar">Seminar</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Max Participants</label>
              <input
                type="number"
                value={maxParticipants}
                onChange={(e) => setMaxParticipants(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Start Date & Time *</label>
              <input
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">End Date & Time *</label>
              <input
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Venue / Auditorium *</label>
            <input
              type="text"
              placeholder="e.g. Main Auditorium & Lab 5"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              required
              className="w-full px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Description *</label>
            <textarea
              rows={3}
              placeholder="Event schedule, rules, prize pools, and takeaways..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className="w-full px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-indigo-600 text-white font-bold text-xs shadow-lg shadow-emerald-600/30"
          >
            {submitting ? 'Publishing Event...' : 'Publish Campus Event'}
          </button>
        </form>
      </Modal>

      {/* Ticket Modal */}
      {activeTicket && (
        <QRModal
          isOpen={qrModalOpen}
          onClose={() => setQrModalOpen(false)}
          title="Digital QR Event Ticket"
          code={activeTicket.ticketCode}
          qrValue={`COLLEGEHUB:EVENT_TICKET:${activeTicket.ticketCode}:${activeTicket.event?._id}:${activeTicket.user}`}
          subtitle="Present this ticket code at the event gate for check-in."
          details={[
            { label: 'Event', value: activeTicket.event?.title },
            { label: 'Category', value: activeTicket.event?.category },
            { label: 'Venue', value: activeTicket.event?.venue },
            { label: 'Status', value: activeTicket.status },
          ]}
        />
      )}

      {/* Check-In Scanner */}
      <QRScannerModal
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        title="Event Gate Attendance Scanner"
        placeholder="Enter ticket code (e.g. EVT-2026-9482)..."
        onVerify={handleCheckInAttendee}
      />
    </div>
  );
};

export default EventHub;
