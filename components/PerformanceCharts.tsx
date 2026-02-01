'use client';

import { useMemo } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface Trade {
  id: string;
  market_name: string;
  strategy: 'HOLD' | 'FLIP';
  side: 'YES' | 'NO';
  entry_price: number;
  exit_price?: number;
  position_size_eur: number;
  pnl_eur?: number;
  status: 'OPEN' | 'CLOSED';
  opened_at: string;
  closed_at?: string;
}

interface PerformanceChartsProps {
  trades: Trade[];
  period?: 7 | 30;
}

export default function PerformanceCharts({ trades, period = 7 }: PerformanceChartsProps) {
  // Ensure trades is always an array
  const safeTrades = Array.isArray(trades) ? trades : [];

  // Préparer les données pour le graphique PnL au fil du temps
  const pnlOverTime = useMemo(() => {
    if (!safeTrades || safeTrades.length === 0) return [];

    const closedTrades = safeTrades
      .filter(t => t.status === 'CLOSED' && t.closed_at && t.pnl_eur !== undefined && t.pnl_eur !== null)
      .sort((a, b) => new Date(a.closed_at!).getTime() - new Date(b.closed_at!).getTime());

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - period);

    let cumulativePnL = 0;
    const data: { date: string; pnl: number; cumulative: number; volume: number }[] = [];

    closedTrades.forEach(trade => {
      const tradeDate = new Date(trade.closed_at!);
      if (tradeDate >= cutoffDate) {
        cumulativePnL += trade.pnl_eur!;
        data.push({
          date: tradeDate.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
          pnl: trade.pnl_eur!,
          cumulative: cumulativePnL,
          volume: trade.position_size_eur || 0,
        });
      }
    });

    return data;
  }, [safeTrades, period]);

  // Préparer les données pour le graphique Win/Loss
  const winLossData = useMemo(() => {
    if (!safeTrades || safeTrades.length === 0) return [];

    const closed = safeTrades.filter(t => t.status === 'CLOSED' && t.pnl_eur !== undefined && t.pnl_eur !== null);
    const wins = closed.filter(t => t.pnl_eur! > 0).length;
    const losses = closed.filter(t => t.pnl_eur! <= 0).length;

    return [
      { name: 'Gains', value: wins, color: '#10b981' },
      { name: 'Pertes', value: losses, color: '#ef4444' },
    ];
  }, [safeTrades]);

  // Préparer les données pour le graphique par stratégie
  const strategyPerformance = useMemo(() => {
    if (!safeTrades || safeTrades.length === 0) return [];

    const closed = safeTrades.filter(t => t.status === 'CLOSED' && t.pnl_eur !== undefined && t.pnl_eur !== null);

    const holdTrades = closed.filter(t => t.strategy === 'HOLD');
    const flipTrades = closed.filter(t => t.strategy === 'FLIP');

    const holdPnL = holdTrades.reduce((sum, t) => sum + (t.pnl_eur || 0), 0);
    const flipPnL = flipTrades.reduce((sum, t) => sum + (t.pnl_eur || 0), 0);

    const holdWinRate = holdTrades.length > 0
      ? (holdTrades.filter(t => (t.pnl_eur || 0) > 0).length / holdTrades.length) * 100
      : 0;

    const flipWinRate = flipTrades.length > 0
      ? (flipTrades.filter(t => (t.pnl_eur || 0) > 0).length / flipTrades.length) * 100
      : 0;

    return [
      {
        strategy: 'HOLD',
        pnl: holdPnL,
        winRate: holdWinRate,
        trades: holdTrades.length,
      },
      {
        strategy: 'FLIP',
        pnl: flipPnL,
        winRate: flipWinRate,
        trades: flipTrades.length,
      },
    ];
  }, [safeTrades]);

  const COLORS = ['#10b981', '#ef4444'];

  if (safeTrades.length === 0) {
    return (
      <div className="bg-gradient-to-br from-white/95 via-slate-50/95 to-white/95 dark:from-slate-900/95 dark:via-slate-800/95 dark:to-slate-900/95 backdrop-blur-xl border border-slate-300/50 dark:border-slate-700/50 rounded-2xl p-6 shadow-2xl">
        <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 mb-4">📈 Performance</h2>
        <p className="text-slate-600 dark:text-slate-400">No trading data available yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Graphique PnL Cumulatif */}
      <div className="bg-gradient-to-br from-white/95 via-slate-50/95 to-white/95 dark:from-slate-900/95 dark:via-slate-800/95 dark:to-slate-900/95 backdrop-blur-xl border border-slate-300/50 dark:border-slate-700/50 rounded-2xl p-6 shadow-2xl">
        <h3 className="text-lg font-semibold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-green-400 to-teal-400 mb-4">
          💰 Cumulative PnL ({period} days)
        </h3>
        {pnlOverTime.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={pnlOverTime}>
              <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" className="dark:stroke-slate-700" />
              <XAxis dataKey="date" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '0.5rem',
                }}
                labelStyle={{ color: '#f3f4f6' }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="cumulative"
                name="PnL Cumulatif (€)"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ fill: '#10b981' }}
              />
              <Line
                type="monotone"
                dataKey="pnl"
                name="PnL par trade (€)"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ fill: '#3b82f6' }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-slate-600 dark:text-slate-400 text-center py-8">
            No closed trades in the last {period} days
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Graphique Win/Loss */}
        <div className="bg-gradient-to-br from-white/95 via-slate-50/95 to-white/95 dark:from-slate-900/95 dark:via-slate-800/95 dark:to-slate-900/95 backdrop-blur-xl border border-slate-300/50 dark:border-slate-700/50 rounded-2xl p-6 shadow-2xl">
          <h3 className="text-lg font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 mb-4">
            🎯 Win/Loss Distribution
          </h3>
          {winLossData.some(d => d.value > 0) ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={winLossData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {winLossData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '0.5rem',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-slate-600 dark:text-slate-400 text-center py-8">No closed trades</p>
          )}
        </div>

        {/* Graphique Performance par Stratégie */}
        <div className="bg-gradient-to-br from-white/95 via-slate-50/95 to-white/95 dark:from-slate-900/95 dark:via-slate-800/95 dark:to-slate-900/95 backdrop-blur-xl border border-slate-300/50 dark:border-slate-700/50 rounded-2xl p-6 shadow-2xl">
          <h3 className="text-lg font-semibold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-rose-400 mb-4">
            📊 Performance by Strategy
          </h3>
          {strategyPerformance.some(s => s.trades > 0) ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={strategyPerformance}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="strategy" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '0.5rem',
                  }}
                  labelStyle={{ color: '#f3f4f6' }}
                />
                <Legend />
                <Bar dataKey="pnl" name="PnL (€)" fill="#10b981" />
                <Bar dataKey="winRate" name="Win Rate (%)" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-slate-600 dark:text-slate-400 text-center py-8">No closed trades</p>
          )}
          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            {strategyPerformance.map(s => (
              <div key={s.strategy} className="bg-slate-100 dark:bg-slate-800 rounded-xl p-3 border border-slate-300/50 dark:border-slate-700/50">
                <p className="text-slate-600 dark:text-slate-400">{s.strategy}</p>
                <p className="text-slate-900 dark:text-white font-semibold">
                  {s.trades} trade{s.trades > 1 ? 's' : ''}
                </p>
                <p className={s.pnl >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                  {s.pnl >= 0 ? '+' : ''}{s.pnl.toFixed(2)}€
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
