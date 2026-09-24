import React from 'react';
import Modal from '../common/Modal';
import { QRCodeSVG } from 'qrcode.react';
import { Download, CheckCircle2, Ticket } from 'lucide-react';

export const QRModal = ({ isOpen, onClose, title, code, qrValue, subtitle, details = [] }) => {
  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title || 'Digital QR Pass'} maxWidth="max-w-md">
      <div className="flex flex-col items-center text-center p-2">
        {/* QR Code Canvas */}
        <div className="p-4 bg-white rounded-3xl shadow-xl border-4 border-indigo-500/20 mb-4">
          <QRCodeSVG value={qrValue || code || 'COLLEGEHUB'} size={200} level="H" includeMargin={true} />
        </div>

        {code && (
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 font-mono font-bold text-sm mb-2">
            <Ticket className="w-4 h-4" />
            <span>{code}</span>
          </div>
        )}

        {subtitle && <p className="text-xs text-slate-400 mb-4">{subtitle}</p>}

        {details.length > 0 && (
          <div className="w-full bg-slate-900/80 rounded-2xl p-4 border border-slate-800 text-left space-y-2 text-xs">
            {details.map((d, i) => (
              <div key={i} className="flex justify-between">
                <span className="text-slate-400">{d.label}:</span>
                <span className="font-semibold text-slate-200">{d.value}</span>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 w-full">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm transition-all"
          >
            Close Pass
          </button>
        </div>
      </div>
    </Modal>
  );
};
