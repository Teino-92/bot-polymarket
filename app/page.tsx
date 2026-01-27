'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { StatCard } from '@/components/Dashboard/StatCard';
import { PositionCard } from '@/components/Dashboard/PositionCard';
import { OpportunityCard } from '@/components/Dashboard/OpportunityCard';
import { PnLChart } from '@/components/Dashboard/PnLChart';
import PerformanceCharts from '@/components/PerformanceCharts';
import TradeHistory from '@/components/TradeHistory';
import LiveMonitoring from '@/components/LiveMonitoring';
import ThemeToggle from '@/components/ThemeToggle';
import DashboardCustomizer from '@/components/DashboardCustomizer';
import { useDashboardLayout } from '@/lib/hooks/useDashboardLayout';
import Link from 'next/link';
import type { DashboardOverview, Position, Opportunity } from '@/lib/types';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function Dashboard() {
  const [chartPeriod, setChartPeriod] = useState<7 | 30>(7);
  const { isVisible } = useDashboardLayout();

  const { data: overview } = useSWR<DashboardOverview>('/api/overview', fetcher, {
    refreshInterval: 30000, // 30s
  });

  const { data: allPositions, mutate: mutatePositions } = useSWR<Position[]>('/api/positions', fetcher, {
    refreshInterval: 10000, // 10s
  });

  const { data: opportunities } = useSWR<Opportunity[]>('/api/opportunities', fetcher, {
    refreshInterval: 60000, // 1min
  });

  const { data: trades } = useSWR<any[]>('/api/trades', fetcher, {
    refreshInterval: 30000, // 30s
  });

  const { data: config } = useSWR<any>('/api/bot/config', fetcher, {
    refreshInterval: 10000, // 10s
  });

  // Filter only OPEN positions
  const positions = allPositions?.filter(p => p.status === 'OPEN') || [];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="p-4 sm:p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          </div>
          <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
            <ThemeToggle />
            <DashboardCustomizer />
            <Link
              href="/calculators"
              className="flex-1 sm:flex-none text-center px-3 sm:px-4 py-2 bg-purple-600 text-white text-sm sm:text-base rounded-lg hover:bg-purple-700 transition-colors"
            >
              📊 Calculators
            </Link>
            <Link
              href="/bot-config"
              className="flex-1 sm:flex-none text-center px-3 sm:px-4 py-2 bg-blue-600 text-white text-sm sm:text-base rounded-lg hover:bg-blue-700 transition-colors"
            >
              Configuration
            </Link>
          </div>
        </div>

      {/* Live Monitoring */}
      {isVisible('liveMonitoring') && (
        <div className="mb-6 sm:mb-8">
          <LiveMonitoring isPaused={config?.isPaused} />
        </div>
      )}

      {/* Stats overview */}
      {isVisible('stats') && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <StatCard
            label="Total PnL"
            value={overview ? `${overview.totalPnL}€` : '...'}
            change={overview?.pnlChange24h}
            color={overview && overview.totalPnL >= 0 ? 'green' : 'red'}
          />
          <StatCard
            label="Active Positions"
            value={positions.length}
            subtext="Max: 2"
            color="blue"
          />
          <StatCard
            label="Airdrop Volume"
            value={overview ? `${overview.volumeTraded}€` : '...'}
            subtext={overview ? `${overview.tradesCount} trades` : undefined}
            color="blue"
          />
          <StatCard
            label="Win Rate"
            value={overview ? `${overview.winRate}%` : '...'}
            subtext={overview ? `${overview.closedTrades} closed` : undefined}
            color="gray"
          />
        </div>
      )}

      {/* PnL Chart */}
      {isVisible('pnlChart') && (
        <div className="mb-6 sm:mb-8">
          <PnLChart data={overview?.pnlHistory7d || []} />
        </div>
      )}

      {/* Advanced Performance Charts */}
      {isVisible('performanceCharts') && (
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 mb-4">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">📊 Analyse de Performance</h2>
            <div className="flex gap-2 w-full sm:w-auto">
              <button
                onClick={() => setChartPeriod(7)}
                className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded text-sm sm:text-base ${
                  chartPeriod === 7
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                7 jours
              </button>
              <button
                onClick={() => setChartPeriod(30)}
                className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded text-sm sm:text-base ${
                  chartPeriod === 30
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                30 jours
              </button>
            </div>
          </div>
          <PerformanceCharts trades={trades || []} period={chartPeriod} />
        </div>
      )}

      {/* Active positions */}
      {isVisible('activePositions') && (
        <div className="mb-6 sm:mb-8">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">
            Active Positions ({positions.length}/2)
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
            {positions.length > 0 ? (
              positions.map((p) => <PositionCard key={p.id} position={p} onClose={() => mutatePositions()} />)
            ) : (
              <div className="col-span-2 text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <p className="text-gray-500 dark:text-gray-400">
                  No active positions. Bot scanning for opportunities...
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Trade History */}
      {isVisible('tradeHistory') && (
        <div className="mb-6 sm:mb-8">
          <TradeHistory trades={trades || []} />
        </div>
      )}

      {/* Top opportunities */}
      {isVisible('opportunities') && (
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">Top Opportunities</h2>
          <div className="space-y-3">
            {opportunities && opportunities.length > 0 ? (
              opportunities.slice(0, 5).map((opp) => (
                <OpportunityCard key={opp.marketId} opportunity={opp} />
              ))
            ) : (
              <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <p className="text-gray-500 dark:text-gray-400">No opportunities scanned yet</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
    </div>
  );
}
