'use client';

import type { Position } from '@/lib/types';

interface PositionCardProps {
  position: Position;
}

export function PositionCard({ position }: PositionCardProps) {
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
    <div className="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-sm line-clamp-2">{position.market_name}</h3>
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
          <div className={`text-lg font-bold ${isProfitable ? 'text-green-600' : 'text-red-600'}`}>
            {isProfitable ? '+' : ''}
            {Number(position.unrealized_pnl_eur).toFixed(2)}€
          </div>
          <div className={`text-xs ${isProfitable ? 'text-green-600' : 'text-red-600'}`}>
            {pnlPercent > 0 ? '+' : ''}
            {pnlPercent.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Prices */}
      <div className="grid grid-cols-2 gap-4 mb-3 text-xs">
        <div>
          <p className="text-gray-500">Entry</p>
          <p className="font-mono font-semibold">{Number(position.entry_price).toFixed(3)}</p>
        </div>
        <div>
          <p className="text-gray-500">Current</p>
          <p className="font-mono font-semibold">{Number(position.current_price).toFixed(3)}</p>
        </div>
      </div>

      {/* Progress bars */}
      <div className="space-y-2 mb-3">
        {/* Stop-loss distance */}
        <div>
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Stop-loss</span>
            <span>{Number(position.stop_loss_price).toFixed(3)}</span>
          </div>
          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
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
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Take-profit</span>
              <span>{Number(position.take_profit_price).toFixed(3)}</span>
            </div>
            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
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
      <div className="flex justify-between text-xs text-gray-500">
        <span>{position.days_until_resolution}d until resolution</span>
        <span>Size: {Number(position.position_size_eur).toFixed(0)}€</span>
      </div>
    </div>
  );
}
