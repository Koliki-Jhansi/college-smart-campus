import React from 'react';

const StatsCard = ({ title, value, icon: Icon, color = 'indigo', subtitle, trend, onClick }) => {
  const colorMap = {
    indigo: 'from-indigo-500/20 to-indigo-500/5 text-indigo-400 border-indigo-500/20 group-hover:border-indigo-500/50',
    emerald: 'from-emerald-500/20 to-emerald-500/5 text-emerald-400 border-emerald-500/20 group-hover:border-emerald-500/50',
    rose: 'from-rose-500/20 to-rose-500/5 text-rose-400 border-rose-500/20 group-hover:border-rose-500/50',
    amber: 'from-amber-500/20 to-amber-500/5 text-amber-400 border-amber-500/20 group-hover:border-amber-500/50',
    cyan: 'from-cyan-500/20 to-cyan-500/5 text-cyan-400 border-cyan-500/20 group-hover:border-cyan-500/50',
    purple: 'from-purple-500/20 to-purple-500/5 text-purple-400 border-purple-500/20 group-hover:border-purple-500/50',
  };

  const iconBgMap = {
    indigo: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    rose: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    cyan: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  };

  return (
    <div
      onClick={onClick}
      className={`relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br bg-slate-900/90 border transition-all duration-300 group ${
        onClick ? 'cursor-pointer hover:-translate-y-1' : ''
      } ${colorMap[color] || colorMap.indigo}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{title}</p>
          <div className="text-3xl font-extrabold text-white mt-1.5 tracking-tight font-sans">
            {value !== undefined ? value : 0}
          </div>
          {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
        </div>

        {Icon && (
          <div className={`p-3 rounded-xl border ${iconBgMap[color] || iconBgMap.indigo} group-hover:scale-110 transition-transform`}>
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>

      {trend && (
        <div className="mt-3 text-[11px] font-medium text-emerald-400 flex items-center gap-1">
          <span>{trend}</span>
        </div>
      )}
    </div>
  );
};

export { StatsCard };
export default StatsCard;
