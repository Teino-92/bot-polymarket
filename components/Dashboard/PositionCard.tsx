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

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 sm:p-4 bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex justify-between items-start mb-2 sm:mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-xs sm:text-sm line-clamp-2 text-gray-900 dark:text-white">{position.market_name}</h3>
          <div className="flex gap-2 mt-1">
            <span
              className={`text-xs px-2 py-0.5 rounded ${
                position.side === 'YES' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}
            >
              {position.side}
            </span>
            <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700">
              {position.strategy}
            </span>
          </div>
        </div>
        <div className="text-right ml-2">
          <div className={`text-base sm:text-lg font-bold ${isProfitable ? 'text-green-600' : 'text-red-600'}`}>
            {isProfitable ? '+' : ''}
            {Number(position.unrealized_pnl_eur).toFixed(2)}€
          </div>
          <div className={`text-[10px] sm:text-xs ${isProfitable ? 'text-green-600' : 'text-red-600'}`}>
            {pnlPercent > 0 ? '+' : ''}
            {pnlPercent.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Prices */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-2 sm:mb-3 text-[10px] sm:text-xs">
        <div>
          <p className="text-gray-500 dark:text-gray-400">Entry</p>
          <p className="font-mono font-semibold text-gray-900 dark:text-white">{Number(position.entry_price).toFixed(3)}</p>
        </div>
        <div>
          <p className="text-gray-500 dark:text-gray-400">Current</p>
          <p className="font-mono font-semibold text-gray-900 dark:text-white">{Number(position.current_price).toFixed(3)}</p>
        </div>
      </div>

      {/* Progress bars */}
      <div className="space-y-2 mb-2 sm:mb-3">
        {/* Stop-loss distance */}
        <div>
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
            <span>Stop-loss</span>
            <span>{Number(position.stop_loss_price).toFixed(3)}</span>
          </div>
          <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-red-500"
              style={{
                width: `${Math.max(0, Math.min(100, stopLossDistance))}%`,
              }}
            />
          </div>
        </div>

        {/* Take-profit (si FLIP) */}
        {position.take_profit_price && (
          <div>
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
              <span>Take-profit</span>
              <span>{Number(position.take_profit_price).toFixed(3)}</span>
            </div>
            <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500"
                style={{
                  width: `${Math.max(0, Math.min(100, takeProfitDistance))}%`,
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mb-2 sm:mb-3">
        <span>{position.days_until_resolution}d until resolution</span>
        <span>Size: {Number(position.position_size_eur).toFixed(0)}€</span>
      </div>

      {/* Close Button */}
      <button
        onClick={async () => {
          if (isClosing) return;
          if (!confirm('Êtes-vous sûr de vouloir fermer cette position manuellement ?')) return;

          setIsClosing(true);
          try {
            const response = await fetch(`/api/positions/${position.id}/close`, {
              method: 'POST',
            });

            if (response.ok) {
              onClose?.();
            } else {
              const error = await response.json();
              alert(`Erreur: ${error.error || 'Impossible de fermer la position'}`);
            }
          } catch (error) {
            alert('Erreur réseau');
          } finally {
            setIsClosing(false);
          }
        }}
        disabled={isClosing}
        className={`w-full py-2 rounded-lg font-semibold text-xs sm:text-sm transition-all ${
          isClosing
            ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
            : 'bg-red-600 hover:bg-red-700 text-white active:scale-95'
        }`}
      >
        {isClosing ? 'Fermeture...' : '🔴 Fermer la position'}
      </button>
    </div>
  );
}
