import React from 'react';
import { Sparkles } from 'lucide-react';

const EmptyState = ({
  icon: Icon = Sparkles,
  title = 'No items found',
  description = 'There is currently no data to display here.',
  actionLabel,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-10 sm:p-14 text-center rounded-3xl bg-slate-900/40 border border-dashed border-slate-800 my-6">
      <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4 shadow-lg shadow-indigo-500/5">
        <Icon className="w-8 h-8" />
      </div>
      <h4 className="text-lg font-bold text-white mb-1.5">{title}</h4>
      <p className="text-sm text-slate-400 max-w-sm mb-6">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export { EmptyState };
export default EmptyState;
