import React, { useState, useEffect } from 'react';
import { slotApi } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/common/Modal';
import { QRModal } from '../../components/qr/QRModal';
import { QRScannerModal } from '../../components/qr/QRScannerModal';
import { LoadingState } from '../../components/common/LoadingState';
import EmptyState from '../../components/common/EmptyState';
import {
  CalendarCheck,
  Calendar,
  Clock,
  MapPin,
  QrCode,
  CheckCircle2,
  AlertCircle,
  Plus,
  Scan,
  Check,
  X,
} from 'lucide-react';

const CampusSlot = () => {
  const { user, isAdmin, isFaculty } = useAuth();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState('resources'); // 'resources', 'my', 'manage'
  const [resources, setResources] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [allBookings, setAllBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [category, setCategory] = useState('All');

  // Booking Request Modal
  const [bookModalOpen, setBookModalOpen] = useState(false);
  const [selectedResource, setSelectedResource] = useState(null);
  const [bookingDate, setBookingDate] = useState('');
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('12:00');
  const [purpose, setPurpose] = useState('');
  const [attendeeCount, setAttendeeCount] = useState(1);
  const [existingSlots, setExistingSlots] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  // QR Modals
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [activeQRBooking, setActiveQRBooking] = useState(null);
  const [scannerOpen, setScannerOpen] = useState(false);

  // Create Resource Modal (Admin)
  const [createResModalOpen, setCreateResModalOpen] = useState(false);
  const [newResName, setNewResName] = useState('');
  const [newResCategory, setNewResCategory] = useState('Computer Lab');
  const [newResLocation, setNewResLocation] = useState('');
  const [newResCapacity, setNewResCapacity] = useState(30);

  const fetchResources = async () => {
    try {
      setLoading(true);
      const res = await slotApi.getResources({ category });
      if (res.data.success) {
        setResources(res.data.resources || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyBookings = async () => {
    try {
      setLoading(true);
      const res = await slotApi.getMyBookings();
      if (res.data.success) {
        setMyBookings(res.data.bookings || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllBookings = async () => {
    try {
      setLoading(true);
      const res = await slotApi.getAllBookings();
      if (res.data.success) {
        setAllBookings(res.data.bookings || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'resources') fetchResources();
    else if (activeTab === 'my') fetchMyBookings();
    else if (activeTab === 'manage') fetchAllBookings();
  }, [activeTab, category]);

  const handleDateChange = async (newDate) => {
    setBookingDate(newDate);
    if (selectedResource && newDate) {
      try {
        const res = await slotApi.checkAvailability(selectedResource._id, newDate);
        if (res.data.success) {
          setExistingSlots(res.data.existingBookings || []);
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await slotApi.requestBooking({
        resourceId: selectedResource._id,
        bookingDate,
        startTime,
        endTime,
        purpose,
        attendeeCount: Number(attendeeCount),
      });

      addToast(res.data.message || 'Booking confirmed!', 'success');
      setBookModalOpen(false);
      setBookingDate('');
      setPurpose('');
      fetchMyBookings();
      setActiveTab('my');
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to book slot. It may overlap with an existing approved booking.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusUpdate = async (bookingId, status) => {
    try {
      await slotApi.updateBookingStatus(bookingId, { status });
      addToast(`Booking marked as ${status}.`, 'success');
      fetchAllBookings();
    } catch (err) {
      addToast('Error updating booking.', 'error');
    }
  };

  const handleCheckInVerify = async (code) => {
    const res = await slotApi.checkIn({ bookingReference: code });
    return res.data;
  };

  const handleCreateResource = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('name', newResName);
      formData.append('category', newResCategory);
      formData.append('location', newResLocation);
      formData.append('capacity', newResCapacity);

      await slotApi.createResource(formData);
      addToast('Campus resource registered!', 'success');
      setCreateResModalOpen(false);
      setNewResName('');
      setNewResLocation('');
      fetchResources();
    } catch (err) {
      addToast('Failed to create campus resource.', 'error');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <CalendarCheck className="w-7 h-7 text-indigo-400" />
            <span>CampusSlot Resource Booking</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Reserve computer labs, seminar halls, auditorium, camera kits, and sports grounds with QR passes
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center p-1 rounded-2xl bg-slate-900 border border-slate-800">
            <button
              onClick={() => setActiveTab('resources')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'resources' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              Resources
            </button>
            <button
              onClick={() => setActiveTab('my')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'my' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              My Bookings ({myBookings.length})
            </button>
            {(isAdmin || isFaculty) && (
              <button
                onClick={() => setActiveTab('manage')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'manage' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                Approvals
              </button>
            )}
          </div>

          <button
            onClick={() => setScannerOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-bold text-slate-200 flex items-center gap-2"
          >
            <Scan className="w-4 h-4 text-indigo-400" />
            <span>QR Check-In</span>
          </button>

          {isAdmin && (
            <button
              onClick={() => setCreateResModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white shadow-md shadow-indigo-600/30 flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add Resource</span>
            </button>
          )}
        </div>
      </div>

      {activeTab === 'resources' && (
        <div className="space-y-6">
          {/* Category Filter */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {['All', 'Computer Lab', 'AI Lab', 'Seminar Hall', 'Auditorium', 'Conference Room', 'Projector', 'Camera', 'Sports Ground'].map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  category === cat
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Resources Grid */}
          {loading ? (
            <LoadingState message="Fetching campus resources from MongoDB..." />
          ) : resources.length === 0 ? (
            <EmptyState
              icon={CalendarCheck}
              title="No resources in this category"
              description="Campus resources can be registered by administrators."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {resources.map((res) => (
                <div key={res._id} className="glass-card-hover rounded-3xl p-6 border border-slate-800 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] uppercase font-bold px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                        {res.category}
                      </span>
                      <span className="text-xs text-slate-400 font-semibold">Capacity: {res.capacity}</span>
                    </div>

                    <h3 className="text-lg font-bold text-white mb-1">{res.name}</h3>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-3">
                      <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{res.location}</span>
                    </div>

                    {res.description && <p className="text-xs text-slate-400 line-clamp-2 mb-4">{res.description}</p>}
                    {res.bookingRules && (
                      <p className="text-[11px] text-slate-500 italic mb-4">Rule: {res.bookingRules}</p>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      setSelectedResource(res);
                      setBookingDate(new Date().toISOString().slice(0, 10));
                      handleDateChange(new Date().toISOString().slice(0, 10));
                      setBookModalOpen(true);
                    }}
                    className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all"
                  >
                    Check Availability & Reserve Slot
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'my' && (
        <div className="space-y-6">
          {loading ? (
            <LoadingState message="Loading your bookings..." />
          ) : myBookings.length === 0 ? (
            <EmptyState
              icon={CalendarCheck}
              title="No bookings yet"
              description="Reserve a campus lab, conference hall, or project equipment."
              actionLabel="Book a Resource"
              onAction={() => setActiveTab('resources')}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myBookings.map((b) => (
                <div key={b._id} className="glass-card rounded-3xl p-6 border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-indigo-400 uppercase">{b.resource?.category}</span>
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                        b.status === 'approved' || b.status === 'checked_in'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : b.status === 'pending'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {b.status}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-white">{b.resource?.name}</h3>
                    <p className="text-xs text-slate-400 mt-1">Location: {b.resource?.location}</p>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs space-y-1">
                    <div className="flex justify-between text-slate-300">
                      <span>Date:</span>
                      <span className="font-bold">{new Date(b.bookingDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>Time:</span>
                      <span className="font-bold">{b.startTime} - {b.endTime}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Pass Ref:</span>
                      <span className="font-mono text-indigo-300">{b.bookingReference}</span>
                    </div>
                  </div>

                  {b.status === 'approved' && (
                    <button
                      onClick={() => {
                        setActiveQRBooking(b);
                        setQrModalOpen(true);
                      }}
                      className="w-full py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-indigo-600/30"
                    >
                      <QrCode className="w-4 h-4" />
                      <span>View Digital QR Pass</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'manage' && (
        <div className="glass-card rounded-3xl p-6 border border-slate-800 space-y-4">
          <h3 className="text-base font-bold text-white">Campus Resource Bookings Queue</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase">
                <tr>
                  <th className="p-3">Resource</th>
                  <th className="p-3">Requested By</th>
                  <th className="p-3">Date & Time</th>
                  <th className="p-3">Purpose</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {allBookings.map((b) => (
                  <tr key={b._id} className="hover:bg-slate-900/50">
                    <td className="p-3 font-bold text-white">{b.resource?.name}</td>
                    <td className="p-3">{b.user?.name}</td>
                    <td className="p-3">{new Date(b.bookingDate).toLocaleDateString()} ({b.startTime}-{b.endTime})</td>
                    <td className="p-3">{b.purpose}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-slate-800">
                        {b.status}
                      </span>
                    </td>
                    <td className="p-3 text-right space-x-2">
                      {b.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleStatusUpdate(b._id, 'approved')}
                            className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(b._id, 'rejected')}
                            className="p-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Booking Form Modal */}
      <Modal isOpen={bookModalOpen} onClose={() => setBookModalOpen(false)} title={`Reserve ${selectedResource?.name}`}>
        <form onSubmit={handleBookingSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Select Booking Date *</label>
            <input
              type="date"
              min={new Date().toISOString().slice(0, 10)}
              value={bookingDate}
              onChange={(e) => handleDateChange(e.target.value)}
              required
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Existing booked slots timeline */}
          {existingSlots.length > 0 && (
            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs space-y-1">
              <span className="font-bold text-amber-400">Existing Reserved Slots for this date:</span>
              <div className="flex flex-wrap gap-2 mt-1">
                {existingSlots.map((s, i) => (
                  <span key={i} className="px-2 py-1 rounded bg-rose-500/10 text-rose-300 border border-rose-500/30 text-[10px] font-mono">
                    {s.startTime} - {s.endTime} ({s.status})
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Start Time *</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">End Time *</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Purpose of Booking *</label>
            <textarea
              rows={2}
              placeholder="e.g. AI project team data collection & GPU model training"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              required
              className="w-full px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Expected Attendees</label>
            <input
              type="number"
              min={1}
              max={selectedResource?.capacity || 100}
              value={attendeeCount}
              onChange={(e) => setAttendeeCount(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30"
          >
            {submitting ? 'Checking conflicts...' : 'Confirm Reservation'}
          </button>
        </form>
      </Modal>

      {/* Create Resource Modal (Admin) */}
      <Modal isOpen={createResModalOpen} onClose={() => setCreateResModalOpen(false)} title="Register Campus Resource">
        <form onSubmit={handleCreateResource} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Resource Name *</label>
            <input
              type="text"
              placeholder="e.g. AI & Robotics Research Lab 4"
              value={newResName}
              onChange={(e) => setNewResName(e.target.value)}
              required
              className="w-full px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Category</label>
              <select
                value={newResCategory}
                onChange={(e) => setNewResCategory(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="Computer Lab">Computer Lab</option>
                <option value="AI Lab">AI Lab</option>
                <option value="Seminar Hall">Seminar Hall</option>
                <option value="Auditorium">Auditorium</option>
                <option value="Conference Room">Conference Room</option>
                <option value="Projector">Projector</option>
                <option value="Camera">Camera</option>
                <option value="Sports Ground">Sports Ground</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Capacity</label>
              <input
                type="number"
                value={newResCapacity}
                onChange={(e) => setNewResCapacity(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Location / Room Number *</label>
            <input
              type="text"
              placeholder="e.g. Science Block, 3rd Floor, Room 310"
              value={newResLocation}
              onChange={(e) => setNewResLocation(e.target.value)}
              required
              className="w-full px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg"
          >
            Create Resource
          </button>
        </form>
      </Modal>

      {/* QR Pass Modal */}
      {activeQRBooking && (
        <QRModal
          isOpen={qrModalOpen}
          onClose={() => setQrModalOpen(false)}
          title="CampusSlot Digital Pass"
          code={activeQRBooking.bookingReference}
          qrValue={`COLLEGEHUB:BOOKING:${activeQRBooking.bookingReference}:${activeQRBooking.resource?._id}:${activeQRBooking.user}`}
          subtitle="Scan this QR pass at campus facility reception to check-in."
          details={[
            { label: 'Resource', value: activeQRBooking.resource?.name },
            { label: 'Location', value: activeQRBooking.resource?.location },
            { label: 'Date', value: new Date(activeQRBooking.bookingDate).toLocaleDateString() },
            { label: 'Time Slot', value: `${activeQRBooking.startTime} - ${activeQRBooking.endTime}` },
            { label: 'Purpose', value: activeQRBooking.purpose },
          ]}
        />
      )}

      {/* QR Check-In Scanner */}
      <QRScannerModal
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        title="Campus Resource Check-In Scanner"
        placeholder="Enter pass reference (e.g. BK-2026-1024)..."
        onVerify={handleCheckInVerify}
      />
    </div>
  );
};

export default CampusSlot;
