import React, { useState } from 'react';
import Modal from '../common/Modal';
import { Scan, CheckCircle2, AlertCircle } from 'lucide-react';

export const QRScannerModal = ({ isOpen, onClose, title, onVerify, placeholder = 'Paste QR string or Ticket/Booking Reference...' }) => {
  const [inputCode, setInputCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    if (!inputCode.trim()) return;

    setError('');
    setResult(null);
    setLoading(true);

    try {
      const res = await onVerify(inputCode.trim());
      setResult(res);
      setInputCode('');
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed. Please check the code.');
    } finally {
      setLoading(false);
    }
  };

  const handleModalClose = () => {
    setInputCode('');
    setResult(null);
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleModalClose} title={title || 'QR Check-In Scanner'} maxWidth="max-w-md">
      <div className="space-y-4">
        {/* Scanner Simulation Header */}
        <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col items-center justify-center text-center relative overflow-hidden">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-3 animate-pulse">
            <Scan className="w-8 h-8" />
          </div>
          <p className="text-xs text-slate-400 max-w-xs">
            Scan using optical scanner or enter the digital ticket/pass code below to confirm check-in.
          </p>
        </div>

        {/* Form Input */}
        <form onSubmit={handleVerifySubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Pass / Ticket Code</label>
            <input
              type="text"
              placeholder={placeholder}
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              autoFocus
            />
          </div>

          <button
            type="submit"
            disabled={loading || !inputCode.trim()}
            className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 transition-all"
          >
            {loading ? 'Verifying Ticket...' : 'Verify & Confirm Check-In'}
          </button>
        </form>

        {/* Success Alert */}
        {result && (
          <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 text-xs flex items-start gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold">{result.message || 'Check-In Confirmed!'}</div>
              {result.registration && (
                <div className="mt-1 text-slate-300">
                  Attendee: {result.registration.user?.name} — Status: Attended
                </div>
              )}
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="p-4 rounded-2xl bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold">Check-In Failed</div>
              <div className="mt-0.5 text-rose-300">{error}</div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
