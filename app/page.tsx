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
  const positions = Array.isArray(allPositions) ? allPositions.filter(p => p.status === 'OPEN') : [];

  return (
    <div className="min-h-screen">
      <div className="p-4 sm:p-6 max-w-7xl mx-auto">
        {/* Header - Web3 Style */}
        <div className="mb-6 sm:mb-8 relative">
          {/* Glassmorphism header container */}
          <div className="relative backdrop-blur-xl bg-gradient-to-r from-slate-50/90 via-white/90 to-slate-50/90 dark:from-slate-900/90 dark:via-slate-800/90 dark:to-slate-900/90 rounded-2xl border border-slate-300/50 dark:border-slate-700/50 shadow-2xl p-6">
            {/* Animated gradient border effect */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-2xl opacity-20 blur-xl animate-pulse" />

            <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-4">
                {/* Logo/Icon */}
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                  <span className="text-2xl font-bold text-white">Đ</span>
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
                    Trading Dashboard
                  </h1>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Powered by AI • Real-time Analytics</p>
                </div>
              </div>

              <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
                <ThemeToggle />
                <DashboardCustomizer />
                <Link
                  href="/calculators"
                  className="group relative flex-1 sm:flex-none text-center px-4 py-2.5 bg-gradient-to-r from-purple-600 to-purple-700 text-white text-sm rounded-xl hover:from-purple-500 hover:to-purple-600 transition-all duration-300 shadow-lg hover:shadow-purple-500/50 overflow-hidden"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    <span>📊</span>
                    <span className="hidden sm:inline">Calculators</span>
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />
                </Link>
                <Link
                  href="/bot-config"
                  className="group relative flex-1 sm:flex-none text-center px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm rounded-xl hover:from-blue-500 hover:to-blue-600 transition-all duration-300 shadow-lg hover:shadow-blue-500/50 overflow-hidden"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    <span>⚙️</span>
                    <span className="hidden sm:inline">Config</span>
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />
                </Link>
              </div>
            </div>
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
          {/* Header */}
          <div className="relative mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg">
                <span className="text-xl">📊</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-rose-400">
                Performance Analysis
              </h2>
            </div>

            {/* Period Selector */}
            <div className="flex gap-3">
              <button
                onClick={() => setChartPeriod(7)}
                className={`group relative px-4 sm:px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 ${
                  chartPeriod === 7
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/50'
                    : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700/50 border border-slate-700/50'
                }`}
              >
                <span className="relative z-10">7 days</span>
                {chartPeriod === 7 && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700 rounded-xl" />
                )}
              </button>
              <button
                onClick={() => setChartPeriod(30)}
                className={`group relative px-4 sm:px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 ${
                  chartPeriod === 30
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/50'
                    : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700/50 border border-slate-700/50'
                }`}
              >
                <span className="relative z-10">30 days</span>
                {chartPeriod === 30 && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700 rounded-xl" />
                )}
              </button>
            </div>
          </div>

          <PerformanceCharts trades={trades || []} period={chartPeriod} />
        </div>
      )}

      {/* Active positions */}
      {isVisible('activePositions') && (
        <div className="mb-6 sm:mb-8">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
              <span className="text-xl">💼</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-green-400 to-teal-400">
              Active Positions ({positions.length}/2)
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
            {positions.length > 0 ? (
              positions.map((p) => <PositionCard key={p.id} position={p} onClose={() => mutatePositions()} />)
            ) : (
              <div className="col-span-2 relative group">
                {/* Glow effect */}
                <div className="absolute -inset-0.5 rounded-2xl opacity-50 blur-lg bg-gradient-to-r from-blue-500/30 via-purple-500/30 to-pink-500/30" />

                {/* Card */}
                <div className="relative text-center py-16 bg-gradient-to-br from-white/95 via-slate-50/95 to-white/95 dark:from-slate-900/95 dark:via-slate-800/95 dark:to-slate-900/95 backdrop-blur-xl rounded-2xl border border-slate-300/50 dark:border-slate-700/50">
                  <div className="mb-4 text-6xl">🔍</div>
                  <p className="text-slate-700 dark:text-slate-300 text-lg font-medium mb-2">
                    No active positions
                  </p>
                  <p className="text-slate-600 dark:text-slate-400 text-sm">
                    Bot scanning for opportunities...
                  </p>
                  <div className="mt-6 flex justify-center">
                    <div className="flex gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                      <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse delay-75" />
                      <div className="w-2 h-2 rounded-full bg-pink-500 animate-pulse delay-150" />
                    </div>
                  </div>
                </div>
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
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg">
              <span className="text-xl">🎯</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-red-400">
              Top Opportunities
            </h2>
          </div>

          <div className="space-y-4">
            {opportunities && opportunities.length > 0 ? (
              opportunities.slice(0, 5).map((opp) => (
                <OpportunityCard key={opp.marketId} opportunity={opp} />
              ))
            ) : (
              <div className="relative group">
                {/* Glow effect */}
                <div className="absolute -inset-0.5 rounded-2xl opacity-50 blur-lg bg-gradient-to-r from-amber-500/30 via-orange-500/30 to-red-500/30" />

                {/* Card */}
                <div className="relative text-center py-16 bg-gradient-to-br from-white/95 via-slate-50/95 to-white/95 dark:from-slate-900/95 dark:via-slate-800/95 dark:to-slate-900/95 backdrop-blur-xl rounded-2xl border border-slate-300/50 dark:border-slate-700/50">
                  <div className="mb-4 text-6xl">📡</div>
                  <p className="text-slate-700 dark:text-slate-300 text-lg font-medium mb-2">
                    No opportunities scanned yet
                  </p>
                  <p className="text-slate-600 dark:text-slate-400 text-sm">
                    Bot will scan markets every 4 hours
                  </p>
                  <div className="mt-6 flex justify-center">
                    <div className="flex gap-2">
                      <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                      <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse delay-75" />
                      <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse delay-150" />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
    </div>
  );
}
