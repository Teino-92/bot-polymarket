'use client';

import { useState } from 'react';
import type { Position } from '@/lib/types';

interface PositionCardProps {
  position: Position;
  onClose?: () => void;
}

export function PositionCard({ position, onClose }: PositionCardProps) {
  const [isClosing, setIsClosing] = useState(false);
  const pnlPercent = ((Number(position.current_price) - Number(position.entry_price)) / Number(position.entry_price)) * 100;
  const isProfitable = Number(position.unrealized_pnl_eur) >= 0;

  // Calculate stop-loss distance (percentage)
  const stopLossDistance = position.side === 'YES'
    ? ((Number(position.current_price) - Number(position.stop_loss_price)) / (Number(position.entry_price) - Number(position.stop_loss_price))) * 100
    : ((Number(position.stop_loss_price) - Number(position.current_price)) / (Number(position.stop_loss_price) - Number(position.entry_price))) * 100;

  // Calculate take-profit distance (percentage) if applicable
  const takeProfitDistance = position.take_profit_price
    ? position.side === 'YES'
      ? ((Number(position.current_price) - Number(position.entry_price)) / (Number(position.take_profit_price) - Number(position.entry_price))) * 100
      : ((Number(position.entry_price) - Number(position.current_price)) / (Number(position.entry_price) - Number(position.take_profit_price))) * 100
    : 0;

  const currentProbability = (Number(position.current_price) * 100).toFixed(0);

  return (
    <div className="group relative">
      {/* Glow effect */}
      <div className={`absolute -inset-0.5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl ${
        isProfitable
          ? 'bg-gradient-to-r from-emerald-500/50 via-green-500/50 to-teal-500/50'
          : 'bg-gradient-to-r from-red-500/50 via-orange-500/50 to-pink-500/50'
      }`}></div>

      {/* Card */}
      <div className="relative bg-gradient-to-br from-white/95 via-slate-50/95 to-white/95 dark:from-slate-900/95 dark:via-slate-800/95 dark:to-slate-900/95 backdrop-blur-xl rounded-2xl p-5 border border-slate-300/50 dark:border-slate-700/50 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-[1.01]">
        {/* Icon + Badge */}
        <div className="absolute top-3 left-3 flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-lg">
            {position.market_name.slice(0, 3).toUpperCase()}
          </div>
        </div>

        {/* Top Right: Badges */}
        <div className="absolute top-3 right-3 flex gap-2">
          <span className={`px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm ${
            position.side === 'YES'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
          }`}>
            {position.side}
          </span>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 backdrop-blur-sm">
            {position.strategy}
          </span>
        </div>

        {/* Market Name with Link */}
        <div className="mt-14 mb-4">
          <a
            href={`https://polymarket.com/search?q=${encodeURIComponent(position.market_name)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="group/link inline-block"
          >
            <h3 className="text-slate-900 dark:text-white font-bold text-base line-clamp-2 leading-tight group-hover/link:text-blue-600 dark:group-hover/link:text-blue-400 transition-colors">
              {position.market_name}
            </h3>
            <div className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400 mt-1 group-hover/link:text-blue-600 dark:group-hover/link:text-blue-400 transition-colors">
              <span>Search on Polymarket</span>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </a>
        </div>

        {/* Probability Indicator - Polymarket style */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-600 dark:text-slate-400 text-sm font-medium">
              {position.side === 'YES' ? 'UP' : 'DOWN'}
            </span>
            <div className="flex items-baseline gap-2">
              <span className={`text-3xl font-bold ${
                isProfitable ? 'text-emerald-400' : 'text-slate-300'
              }`}>
                {currentProbability}%
              </span>
              <span className="text-xs font-medium">chance</span>
            </div>
            <div className={`flex items-center gap-1 px-2 py-1 rounded-lg ${
              isProfitable
                ? 'bg-emerald-500/20 text-emerald-400'
                : 'bg-red-500/20 text-red-400'
            }`}>
              <span className="text-lg">{isProfitable ? '▲' : '▼'}</span>
              <span className="text-sm font-bold">
                {Math.abs(pnlPercent).toFixed(1)}%
              </span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="relative h-2 bg-slate-700/50 rounded-full overflow-hidden">
            <div
              className={`absolute h-full rounded-full transition-all duration-500 ${
                position.side === 'YES'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                  : 'bg-gradient-to-r from-rose-500 to-orange-400'
              }`}
              style={{ width: `${currentProbability}%` }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
          </div>
        </div>

        {/* PnL Display */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-slate-100/50 dark:bg-slate-800/50 border border-slate-300/50 dark:border-slate-700/50 mb-4">
          <div>
            <p className="text-slate-600 dark:text-slate-400 text-xs font-medium mb-1">Unrealized PnL</p>
            <p className={`text-2xl font-bold ${
              isProfitable ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
            }`}>
              {isProfitable ? '+' : ''}{Number(position.unrealized_pnl_eur).toFixed(2)}€
            </p>
          </div>
          <div className="text-right">
            <p className="text-slate-600 dark:text-slate-400 text-xs font-medium mb-1">Position Size</p>
            <p className="text-lg font-bold text-slate-900 dark:text-white">
              {Number(position.position_size_eur).toFixed(0)}€
            </p>
          </div>
        </div>

        {/* Price Details Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="p-3 rounded-xl bg-slate-100/30 dark:bg-slate-800/30 border border-slate-300/30 dark:border-slate-700/30">
            <p className="text-slate-600 dark:text-slate-400 text-xs mb-1">Entry Price</p>
            <p className="text-slate-900 dark:text-white font-mono font-bold text-sm">
              {(Number(position.entry_price) * 100).toFixed(1)}%
            </p>
          </div>
          <div className="p-3 rounded-xl bg-slate-100/30 dark:bg-slate-800/30 border border-slate-300/30 dark:border-slate-700/30">
            <p className="text-slate-600 dark:text-slate-400 text-xs mb-1">Current Price</p>
            <p className="text-slate-900 dark:text-white font-mono font-bold text-sm">
              {(Number(position.current_price) * 100).toFixed(1)}%
            </p>
          </div>
        </div>

        {/* Risk Levels */}
        <div className="space-y-3 mb-4">
          {/* Stop-loss */}
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30">
            <div className="flex justify-between items-center mb-2">
              <span className="text-red-400 text-xs font-bold">⛔ STOP-LOSS</span>
              <span className="text-red-300 font-mono text-xs">
                {(Number(position.stop_loss_price) * 100).toFixed(1)}%
              </span>
            </div>
            <div className="h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-red-600 to-red-400 rounded-full transition-all duration-500"
                style={{ width: `${Math.max(0, Math.min(100, stopLossDistance))}%` }}
              />
            </div>
          </div>

          {/* Take-profit (if FLIP) */}
          {position.take_profit_price && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
              <div className="flex justify-between items-center mb-2">
                <span className="text-emerald-400 text-xs font-bold">🎯 TAKE-PROFIT</span>
                <span className="text-emerald-300 font-mono text-xs">
                  {(Number(position.take_profit_price) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full transition-all duration-500"
                  style={{ width: `${Math.max(0, Math.min(100, takeProfitDistance))}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="flex justify-between items-center text-xs text-slate-600 dark:text-slate-400 mb-4 px-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <span>{position.days_until_resolution} days until resolution</span>
          </div>
          <a
            href={`https://polymarket.com/search?q=${encodeURIComponent(position.market_name)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 hover:text-blue-500 dark:hover:text-blue-400 transition-colors cursor-pointer"
            title="Search on Polymarket"
          >
            <span>📊</span>
            <span className="font-mono">{position.id.slice(0, 8)}</span>
          </a>
        </div>

        {/* Close Button */}
        <button
          onClick={async () => {
            if (isClosing) return;
            if (!confirm('Are you sure you want to close this position manually?')) return;

            setIsClosing(true);
            try {
              const response = await fetch(`/api/positions/${position.id}/close`, {
                method: 'POST',
              });

              if (response.ok) {
                onClose?.();
              } else {
                const error = await response.json();
                alert(`Error: ${error.error || 'Unable to close position'}`);
              }
            } catch (error) {
              alert('Network error');
            } finally {
              setIsClosing(false);
            }
          }}
          disabled={isClosing}
          className={`w-full py-3 rounded-xl font-bold text-sm transition-all duration-300 ${
            isClosing
              ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-lg hover:shadow-red-500/50 active:scale-95'
          }`}
        >
          {isClosing ? (
            <span className="flex items-center justify-center gap-2">
              <span className="animate-spin">⟳</span>
              Closing...
            </span>
          ) : (
            '🔴 Close Position'
          )}
        </button>
      </div>
    </div>
  );
}
