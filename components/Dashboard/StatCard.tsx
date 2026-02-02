'use client';

interface StatCardProps {
  label: string;
  value: string | number;
  change?: number;
  subtext?: string;
  color?: 'green' | 'red' | 'blue' | 'gray';
}

export function StatCard({ label, value, change, subtext, color = 'gray' }: StatCardProps) {
  const gradientClasses = {
    green: 'from-emerald-500/20 via-green-500/20 to-teal-500/20',
    red: 'from-red-500/20 via-orange-500/20 to-pink-500/20',
    blue: 'from-blue-500/20 via-indigo-500/20 to-purple-500/20',
    gray: 'from-slate-500/20 via-gray-500/20 to-slate-500/20',
  };

  const textGradients = {
    green: 'from-emerald-400 via-green-400 to-teal-400',
    red: 'from-red-400 via-orange-400 to-pink-400',
    blue: 'from-blue-400 via-indigo-400 to-purple-400',
    gray: 'from-slate-300 via-gray-300 to-slate-300',
  };

  const borderGlow = {
    green: 'border-emerald-500/30',
    red: 'border-red-500/30',
    blue: 'border-blue-500/30',
    gray: 'border-slate-500/30',
  };

  return (
    <div className="group relative">
      {/* Glow effect on hover */}
      <div className={`absolute -inset-0.5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-lg bg-gradient-to-br ${gradientClasses[color]}`} />

      {/* Card */}
      <div className={`relative bg-gradient-to-br from-white/95 via-slate-50/95 to-white/95 dark:from-slate-900/95 dark:via-slate-800/95 dark:to-slate-900/95 backdrop-blur-xl border ${borderGlow[color]} rounded-2xl p-4 sm:p-5 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-[1.02]`}>
        {/* Label */}
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium mb-2 uppercase tracking-wide">{label}</p>

        {/* Value with gradient text */}
        <div className="mb-1">
          <p className={`text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r ${textGradients[color]} mb-2`}>
            {value}
          </p>
          {change !== undefined && (
            <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg ${
              change >= 0
                ? 'bg-emerald-500/20 text-emerald-400'
                : 'bg-red-500/20 text-red-400'
            }`}>
              <span className="text-sm">{change >= 0 ? '▲' : '▼'}</span>
              <span className="text-xs font-bold">
                {change >= 0 ? '+' : ''}{change.toFixed(2)}€
              </span>
            </div>
          )}
        </div>

        {/* Subtext */}
        {subtext && (
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            {subtext}
          </p>
        )}

        {/* Shimmer effect */}
        <div className="absolute inset-0 rounded-2xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
        </div>
      </div>
    </div>
  );
}
