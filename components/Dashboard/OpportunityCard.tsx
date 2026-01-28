'use client';

import type { Opportunity } from '@/lib/types';

interface OpportunityCardProps {
  opportunity: Opportunity;
}

export function OpportunityCard({ opportunity }: OpportunityCardProps) {
  const isGood = opportunity.action !== 'SKIP';

  const actionConfig = {
    HOLD: {
      gradient: 'from-purple-500/20 via-violet-500/20 to-fuchsia-500/20',
      textColor: 'text-purple-300',
      borderColor: 'border-purple-500/30',
      bgColor: 'bg-purple-500/20',
      icon: '🎯',
    },
    FLIP: {
      gradient: 'from-blue-500/20 via-cyan-500/20 to-sky-500/20',
      textColor: 'text-blue-300',
      borderColor: 'border-blue-500/30',
      bgColor: 'bg-blue-500/20',
      icon: '⚡',
    },
    SKIP: {
      gradient: 'from-slate-500/10 via-gray-500/10 to-slate-500/10',
      textColor: 'text-slate-400',
      borderColor: 'border-slate-600/30',
      bgColor: 'bg-slate-500/10',
      icon: '⏸️',
    },
  };

  const config = actionConfig[opportunity.action as keyof typeof actionConfig];

  return (
    <div className={`group relative ${!isGood && 'opacity-50'}`}>
      {/* Glow effect */}
      {isGood && (
        <div className={`absolute -inset-0.5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-lg bg-gradient-to-r ${config.gradient}`} />
      )}

      {/* Card */}
      <div className={`relative bg-gradient-to-br from-white/95 via-slate-50/95 to-white/95 dark:from-slate-900/95 dark:via-slate-800/95 dark:to-slate-900/95 backdrop-blur-xl border ${config.borderColor} rounded-2xl p-4 sm:p-5 shadow-xl hover:shadow-2xl transition-all duration-300 ${isGood && 'hover:scale-[1.01]'}`}>
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <div className="flex items-start gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs shadow-lg shrink-0">
                {opportunity.marketName.slice(0, 2).toUpperCase()}
              </div>
              <h4 className="font-bold text-sm sm:text-base line-clamp-2 text-slate-900 dark:text-white leading-tight">
                {opportunity.marketName}
              </h4>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 italic">
              {opportunity.reasoning}
            </p>
          </div>

          {/* Action Badge */}
          <div className="ml-3 sm:ml-4">
            <span className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-bold whitespace-nowrap backdrop-blur-sm ${config.bgColor} ${config.textColor} border ${config.borderColor}`}>
              <span>{config.icon}</span>
              {opportunity.action}
            </span>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {/* Spread */}
          <div className="p-3 rounded-xl bg-slate-100/50 dark:bg-slate-800/50 border border-slate-300/30 dark:border-slate-700/30">
            <p className="text-slate-600 dark:text-slate-400 text-xs font-medium mb-1">Spread</p>
            <p className="font-mono font-bold text-slate-900 dark:text-white text-sm">
              {(opportunity.spread * 100).toFixed(1)}%
            </p>
          </div>

          {/* HVS */}
          <div className="p-3 rounded-xl bg-slate-100/50 dark:bg-slate-800/50 border border-slate-300/30 dark:border-slate-700/30">
            <p className="text-slate-600 dark:text-slate-400 text-xs font-medium mb-1">HVS</p>
            <p className={`font-mono font-bold text-sm ${
              opportunity.hvs >= 5 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400'
            }`}>
              {opportunity.hvs.toFixed(1)}€
            </p>
          </div>

          {/* Flip EV */}
          <div className="p-3 rounded-xl bg-slate-100/50 dark:bg-slate-800/50 border border-slate-300/30 dark:border-slate-700/30">
            <p className="text-slate-600 dark:text-slate-400 text-xs font-medium mb-1">Flip EV</p>
            <p className={`font-mono font-bold text-sm ${
              opportunity.flipEV >= 3 ? 'text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400'
            }`}>
              {opportunity.flipEV.toFixed(1)}€
            </p>
          </div>

          {/* Days */}
          <div className="p-3 rounded-xl bg-slate-100/50 dark:bg-slate-800/50 border border-slate-300/30 dark:border-slate-700/30">
            <p className="text-slate-600 dark:text-slate-400 text-xs font-medium mb-1">Days</p>
            <p className="font-mono font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              {opportunity.daysUntilResolution}d
            </p>
          </div>
        </div>

        {/* Shimmer effect */}
        {isGood && (
          <div className="absolute inset-0 rounded-2xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
          </div>
        )}
      </div>
    </div>
  );
}
