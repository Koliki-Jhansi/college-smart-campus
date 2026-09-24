import React, { useState, useEffect } from 'react';
import { lostFoundApi } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/common/Modal';
import { LoadingState } from '../../components/common/LoadingState';
import EmptyState from '../../components/common/EmptyState';
import {
  SearchCheck,
  Search,
  Plus,
  MapPin,
  Calendar,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Lock,
  ArrowRight,
} from 'lucide-react';

const CampusLost = () => {
  const { user, isAdmin } = useAuth();
  const { addToast } = useToast();

  const [items, setItems] = useState([]);
  const [typeFilter, setTypeFilter] = useState('All'); // 'All', 'lost', 'found'
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Report Item Modal
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportType, setReportType] = useState('lost');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Electronics');
  const [brand, setBrand] = useState('');
  const [color, setColor] = useState('');
  const [location, setLocation] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [secretDetails, setSecretDetails] = useState('');
  const [photo, setPhoto] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Detail / Matches / Claim Modal
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedItemData, setSelectedItemData] = useState(null);
  const [claimProof, setClaimProof] = useState('');
  const [claimMessage, setClaimMessage] = useState('');

  const fetchItems = async () => {
    try {
      setLoading(true);
      const res = await lostFoundApi.getItems({ type: typeFilter, category: categoryFilter, search });
      if (res.data.success) {
        setItems(res.data.items || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [typeFilter, categoryFilter]);

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('type', reportType);
      formData.append('title', title);
      formData.append('description', description);
      formData.append('category', category);
      formData.append('brand', brand);
      formData.append('color', color);
      formData.append('location', location);
      formData.append('date', date);
      formData.append('secretDetails', secretDetails);
      if (photo) formData.append('photo', photo);

      const res = await lostFoundApi.reportItem(formData);
      addToast(res.data.message || 'Reported successfully!', 'success');
      setReportModalOpen(false);
      // Reset form
      setTitle('');
      setDescription('');
      setBrand('');
      setColor('');
      setLocation('');
      setSecretDetails('');
      setPhoto(null);
      fetchItems();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to submit report.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const openItemDetail = async (itemId) => {
    try {
      const res = await lostFoundApi.getItemById(itemId);
      if (res.data.success) {
        setSelectedItemData(res.data);
        setDetailModalOpen(true);
      }
    } catch (err) {
      addToast('Error loading item details.', 'error');
    }
  };

  const handleClaimSubmit = async (e) => {
    e.preventDefault();
    try {
      await lostFoundApi.submitClaim(selectedItemData.item._id, {
        message: claimMessage,
        verificationProof: claimProof,
      });
      addToast('Ownership claim submitted! The reporter will review.', 'success');
      setDetailModalOpen(false);
      setClaimProof('');
      setClaimMessage('');
      fetchItems();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to submit claim.', 'error');
    }
  };

  const handleConfirmReturn = async (claimId) => {
    try {
      await lostFoundApi.confirmReturn(selectedItemData.item._id, { claimId });
      addToast('Item marked as verified and returned!', 'success');
      setDetailModalOpen(false);
      fetchItems();
    } catch (err) {
      addToast('Error confirming return.', 'error');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <SearchCheck className="w-7 h-7 text-indigo-400" />
            <span>CampusLost & Found Registry</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Transparent match-scoring engine for reunited campus items with secure verification
          </p>
        </div>

        <button
          onClick={() => setReportModalOpen(true)}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Report Lost / Found</span>
        </button>
      </div>

      {/* Filter Tabs & Search */}
      <div className="glass-card rounded-3xl p-4 sm:p-5 border border-slate-800 grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="relative sm:col-span-2">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search items, brands, locations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="All">All Items (Lost & Found)</option>
            <option value="lost">Lost Items Only</option>
            <option value="found">Found Items Only</option>
          </select>
        </div>

        <div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="All">All Categories</option>
            <option value="Electronics">Electronics</option>
            <option value="ID Cards & Wallets">ID Cards & Wallets</option>
            <option value="Keys">Keys</option>
            <option value="Books & Stationery">Books & Stationery</option>
            <option value="Clothing & Accessories">Clothing & Accessories</option>
            <option value="Bags">Bags</option>
            <option value="Bottles">Bottles</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>

      {/* Items Feed */}
      {loading ? (
        <LoadingState message="Scanning campus lost & found records..." />
      ) : items.length === 0 ? (
        <EmptyState
          icon={SearchCheck}
          title="No items found"
          description="Have you lost or found personal property on campus? Log it here."
          actionLabel="Report Item"
          onAction={() => setReportModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <div
              key={item._id}
              onClick={() => openItemDetail(item._id)}
              className="glass-card-hover rounded-3xl p-6 border border-slate-800 flex flex-col justify-between cursor-pointer"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`text-[10px] uppercase font-bold px-2.5 py-1 rounded-lg border ${
                      item.type === 'lost'
                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    }`}
                  >
                    {item.type === 'lost' ? 'Lost Item' : 'Found Item'}
                  </span>

                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    {item.status}
                  </span>
                </div>

                <h3 className="text-base font-bold text-white mb-1">{item.title}</h3>
                <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-2">
                  <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{item.location}</span>
                </div>

                <p className="text-xs text-slate-400 line-clamp-2 mb-4">{item.description}</p>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{new Date(item.date).toLocaleDateString()}</span>
                </div>

                <span className="font-bold text-indigo-400">View Matches & Claim →</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Report Modal */}
      <Modal isOpen={reportModalOpen} onClose={() => setReportModalOpen(false)} title="Report Campus Property">
        <form onSubmit={handleReportSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-900 rounded-2xl border border-slate-800">
            <button
              type="button"
              onClick={() => setReportType('lost')}
              className={`py-2 rounded-xl text-xs font-bold transition-all ${
                reportType === 'lost' ? 'bg-rose-600 text-white' : 'text-slate-400'
              }`}
            >
              I Lost Something
            </button>
            <button
              type="button"
              onClick={() => setReportType('found')}
              className={`py-2 rounded-xl text-xs font-bold transition-all ${
                reportType === 'found' ? 'bg-emerald-600 text-white' : 'text-slate-400'
              }`}
            >
              I Found Something
            </button>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Item Title *</label>
            <input
              type="text"
              placeholder="e.g. Black Noise Wireless Earbuds with case"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="Electronics">Electronics</option>
                <option value="ID Cards & Wallets">ID Cards & Wallets</option>
                <option value="Keys">Keys</option>
                <option value="Books & Stationery">Books & Stationery</option>
                <option value="Clothing & Accessories">Clothing & Accessories</option>
                <option value="Bags">Bags</option>
                <option value="Bottles">Bottles</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Brand</label>
              <input
                type="text"
                placeholder="Noise / Apple / Boat"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Color</label>
              <input
                type="text"
                placeholder="Black / Silver"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Location Lost / Found *</label>
              <input
                type="text"
                placeholder="e.g. Near Library 1st floor reading hall"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Date *</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Description *</label>
            <textarea
              rows={2}
              placeholder="Provide context and observable characteristics..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className="w-full px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="p-3.5 rounded-2xl bg-indigo-950/20 border border-indigo-500/30 space-y-1">
            <label className="block text-xs font-bold text-indigo-300 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" />
              <span>Secret Identifying Detail (Protected from public)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Blue scratch on left earbud / Keychain with Pikachu"
              value={secretDetails}
              onChange={(e) => setSecretDetails(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
            />
            <p className="text-[10px] text-slate-400">Used strictly to verify rightful owner before return.</p>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30"
          >
            {submitting ? 'Registering Item...' : 'Submit to Campus Registry'}
          </button>
        </form>
      </Modal>

      {/* Detail, Match Breakdown & Claim Modal */}
      {selectedItemData && (
        <Modal isOpen={detailModalOpen} onClose={() => setDetailModalOpen(false)} title={selectedItemData.item?.title}>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase px-2.5 py-1 rounded bg-indigo-500/10 text-indigo-400">
                {selectedItemData.item?.category}
              </span>
              <span className="text-xs font-bold text-slate-400">Status: {selectedItemData.item?.status}</span>
            </div>

            <p className="text-xs text-slate-300">{selectedItemData.item?.description}</p>
            <div className="text-xs text-slate-400">
              Location: {selectedItemData.item?.location} • Date: {new Date(selectedItemData.item?.date).toLocaleDateString()}
            </div>

            {/* Secret Verification Detail if authorized */}
            {selectedItemData.item?.secretDetails && (
              <div className="p-3 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 text-xs">
                <span className="font-bold text-indigo-300">Protected Verification Note: </span>
                <span className="text-slate-200">{selectedItemData.item.secretDetails}</span>
              </div>
            )}

            {/* Transparent Match Breakdown */}
            {selectedItemData.matches?.length > 0 && (
              <div className="space-y-2 pt-3 border-t border-slate-800">
                <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  <span>Transparent Calculated Matches ({selectedItemData.matches.length})</span>
                </h4>

                <div className="space-y-2">
                  {selectedItemData.matches.map((m, idx) => (
                    <div key={idx} className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-xs space-y-1">
                      <div className="flex justify-between font-bold text-white">
                        <span>{m.item?.title} ({m.item?.type})</span>
                        <span className="text-emerald-400">{m.score}% Match ({m.matchLevel})</span>
                      </div>
                      <div className="text-[11px] text-slate-400">{m.matchDetails?.join(' • ')}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Claim Section */}
            {!selectedItemData.isOwner && selectedItemData.item?.type === 'found' && selectedItemData.item?.status !== 'Returned' && (
              <form onSubmit={handleClaimSubmit} className="pt-3 border-t border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-white">Claim Ownership of this Item</h4>
                <input
                  type="text"
                  placeholder="Describe unique marks or proof of ownership..."
                  value={claimProof}
                  onChange={(e) => setClaimProof(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                />
                <button type="submit" className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md">
                  Submit Ownership Claim
                </button>
              </form>
            )}

            {/* Return Confirmation if Owner */}
            {selectedItemData.isOwner && selectedItemData.item?.claims?.length > 0 && selectedItemData.item?.status !== 'Returned' && (
              <div className="pt-3 border-t border-slate-800 space-y-2">
                <h4 className="text-xs font-bold text-slate-300">Submitted Ownership Claims:</h4>
                {selectedItemData.item.claims.map((claim) => (
                  <div key={claim._id} className="p-3 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-white">{claim.claimedBy?.name}: </span>
                      <span className="text-slate-300">{claim.verificationProof}</span>
                    </div>
                    <button
                      onClick={() => handleConfirmReturn(claim._id)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-bold text-xs"
                    >
                      Verify & Return
                    </button>
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

export default CampusLost;
