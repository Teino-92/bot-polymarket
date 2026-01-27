'use client';

import type { Opportunity } from '@/lib/types';

interface OpportunityCardProps {
  opportunity: Opportunity;
}

export function OpportunityCard({ opportunity }: OpportunityCardProps) {
  const isGood = opportunity.action !== 'SKIP';

  return (
    <div
      className={`border border-gray-200 dark:border-gray-700 rounded-lg p-3 sm:p-4 ${
        isGood ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-700 opacity-60'
      }`}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1">
          <h4 className="font-medium text-xs sm:text-sm line-clamp-2 text-gray-900 dark:text-white">{opportunity.marketName}</h4>
          <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mt-1">{opportunity.reasoning}</p>
        </div>
        <div className="ml-2 sm:ml-4">
          <span
            className={`text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded font-semibold whitespace-nowrap ${
              opportunity.action === 'HOLD'
                ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                : opportunity.action === 'FLIP'
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
            }`}
          >
            {opportunity.action}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 text-[10px] sm:text-xs">
        <div>
          <p className="text-gray-500 dark:text-gray-400">Spread</p>
          <p className="font-semibold text-gray-900 dark:text-white">{(opportunity.spread * 100).toFixed(1)}%</p>
        </div>
        <div>
          <p className="text-gray-500 dark:text-gray-400">HVS</p>
          <p
            className={`font-semibold ${
              opportunity.hvs >= 5
                ? 'text-green-600 dark:text-green-400'
                : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            {opportunity.hvs.toFixed(1)}€
          </p>
        </div>
        <div>
          <p className="text-gray-500 dark:text-gray-400">Flip EV</p>
          <p
            className={`font-semibold ${
              opportunity.flipEV >= 3
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            {opportunity.flipEV.toFixed(1)}€
          </p>
        </div>
        <div>
          <p className="text-gray-500 dark:text-gray-400">Days</p>
          <p className="font-semibold text-gray-900 dark:text-white">{opportunity.daysUntilResolution}d</p>
        </div>
      </div>
    </div>
  );
}
