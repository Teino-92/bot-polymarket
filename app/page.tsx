'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { StatCard } from '@/components/Dashboard/StatCard';
import { PositionCard } from '@/components/Dashboard/PositionCard';
import { OpportunityCard } from '@/components/Dashboard/OpportunityCard';
import { PnLChart } from '@/components/Dashboard/PnLChart';
import PerformanceCharts from '@/components/PerformanceCharts';
import TradeHistory from '@/components/TradeHistory';
import ManualControls from '@/components/ManualControls';
import LiveMonitoring from '@/components/LiveMonitoring';
import type { DashboardOverview, Position, Opportunity } from '@/lib/types';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function Dashboard() {
  const [chartPeriod, setChartPeriod] = useState<7 | 30>(7);

  const { data: overview } = useSWR<DashboardOverview>('/api/overview', fetcher, {
    refreshInterval: 30000, // 30s
  });

  const { data: positions } = useSWR<Position[]>('/api/positions', fetcher, {
    refreshInterval: 10000, // 10s
  });

  const { data: opportunities } = useSWR<Opportunity[]>('/api/opportunities', fetcher, {
    refreshInterval: 60000, // 1min
  });

  const { data: trades } = useSWR<any[]>('/api/trades', fetcher, {
    refreshInterval: 30000, // 30s
  });

  const { data: config, mutate: mutateConfig } = useSWR<any>('/api/bot/config', fetcher, {
    refreshInterval: 10000, // 10s
  });

  // Handlers pour les contrôles manuels
  const handleScan = async () => {
    const response = await fetch('/api/bot/scan', { method: 'POST' });
    const result = await response.json();
    if (result.success) {
      // Rafraîchir les données
      mutateConfig();
    }
    return result;
  };

  const handleTogglePause = async () => {
    const response = await fetch('/api/bot/config/pause', { method: 'POST' });
    const result = await response.json();
    if (result.success) {
      mutateConfig();
    }
    return result;
  };

  const handleUpdateConfig = async (updates: any) => {
    const response = await fetch('/api/bot/config', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    const result = await response.json();
    if (result.success) {
      mutateConfig();
    }
    return result;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Polymarket Bot Dashboard</h1>
        <p className="text-gray-500">Capital: 150€ | Max positions: 2</p>
      </div>

      {/* Live Monitoring */}
      <div className="mb-8">
        <LiveMonitoring isPaused={config?.isPaused} />
      </div>

      {/* Stats overview */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Total PnL"
          value={overview ? `${overview.totalPnL}€` : '...'}
          change={overview?.pnlChange24h}
          color={overview && overview.totalPnL >= 0 ? 'green' : 'red'}
        />
        <StatCard
          label="Active Positions"
          value={positions?.length || 0}
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

      {/* PnL Chart */}
      <div className="mb-8">
        <PnLChart data={overview?.pnlHistory7d || []} />
      </div>

      {/* Advanced Performance Charts */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">📊 Analyse de Performance</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setChartPeriod(7)}
              className={`px-4 py-2 rounded ${
                chartPeriod === 7
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              7 jours
            </button>
            <button
              onClick={() => setChartPeriod(30)}
              className={`px-4 py-2 rounded ${
                chartPeriod === 30
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              30 jours
            </button>
          </div>
        </div>
        <PerformanceCharts trades={trades || []} period={chartPeriod} />
      </div>

      {/* Manual Controls */}
      {config && (
        <div className="mb-8">
          <ManualControls
            config={config}
            onScan={handleScan}
            onTogglePause={handleTogglePause}
            onUpdateConfig={handleUpdateConfig}
          />
        </div>
      )}

      {/* Active positions */}
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4">
          Active Positions ({positions?.length || 0}/2)
        </h2>
        <div className="grid grid-cols-2 gap-4">
          {positions && positions.length > 0 ? (
            positions.map((p) => <PositionCard key={p.id} position={p} />)
          ) : (
            <div className="col-span-2 text-center py-12 bg-gray-50 rounded-lg border">
              <p className="text-gray-500">
                No active positions. Bot scanning for opportunities...
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Trade History */}
      <div className="mb-8">
        <TradeHistory trades={trades || []} />
      </div>

      {/* Top opportunities */}
      <div>
        <h2 className="text-xl font-bold mb-4">Top Opportunities</h2>
        <div className="space-y-3">
          {opportunities && opportunities.length > 0 ? (
            opportunities.slice(0, 5).map((opp) => (
              <OpportunityCard key={opp.marketId} opportunity={opp} />
            ))
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg border">
              <p className="text-gray-500">No opportunities scanned yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
