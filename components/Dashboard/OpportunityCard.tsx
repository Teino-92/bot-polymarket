'use client';

import type { Opportunity } from '@/lib/types';

interface OpportunityCardProps {
  opportunity: Opportunity;
}

export function OpportunityCard({ opportunity }: OpportunityCardProps) {
  const isGood = opportunity.action !== 'SKIP';

  return (
    <div
      className={`border rounded-lg p-4 ${isGood ? 'bg-white' : 'bg-gray-50 opacity-60'}`}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1">
          <h4 className="font-medium text-sm line-clamp-2">{opportunity.marketName}</h4>
          <p className="text-xs text-gray-500 mt-1">{opportunity.reasoning}</p>
        </div>
        <div className="ml-4">
          <span
            className={`text-xs px-2 py-1 rounded font-semibold whitespace-nowrap ${
              opportunity.action === 'HOLD'
                ? 'bg-purple-100 text-purple-700'
                : opportunity.action === 'FLIP'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-500'
            }`}
          >
            {opportunity.action}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3 text-xs">
        <div>
          <p className="text-gray-500">Spread</p>
          <p className="font-semibold">{(opportunity.spread * 100).toFixed(1)}%</p>
        </div>
        <div>
          <p className="text-gray-500">HVS</p>
          <p
            className={`font-semibold ${opportunity.hvs >= 5 ? 'text-green-600' : 'text-gray-600'}`}
          >
            {opportunity.hvs.toFixed(1)}€
          </p>
        </div>
        <div>
          <p className="text-gray-500">Flip EV</p>
          <p
            className={`font-semibold ${
              opportunity.flipEV >= 3 ? 'text-blue-600' : 'text-gray-600'
            }`}
          >
            {opportunity.flipEV.toFixed(1)}€
          </p>
        </div>
        <div>
          <p className="text-gray-500">Days</p>
          <p className="font-semibold">{opportunity.daysUntilResolution}d</p>
        </div>
      </div>
    </div>
  );
}
