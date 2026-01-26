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
  // Préparer les données pour le graphique PnL au fil du temps
  const pnlOverTime = useMemo(() => {
    const closedTrades = trades
      .filter(t => t.status === 'CLOSED' && t.closed_at && t.pnl_eur !== undefined)
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
          volume: trade.position_size_eur,
        });
      }
    });

    return data;
  }, [trades, period]);

  // Préparer les données pour le graphique Win/Loss
  const winLossData = useMemo(() => {
    const closed = trades.filter(t => t.status === 'CLOSED' && t.pnl_eur !== undefined);
    const wins = closed.filter(t => t.pnl_eur! > 0).length;
    const losses = closed.filter(t => t.pnl_eur! <= 0).length;

    return [
      { name: 'Gains', value: wins, color: '#10b981' },
      { name: 'Pertes', value: losses, color: '#ef4444' },
    ];
  }, [trades]);

  // Préparer les données pour le graphique par stratégie
  const strategyPerformance = useMemo(() => {
    const closed = trades.filter(t => t.status === 'CLOSED' && t.pnl_eur !== undefined);

    const holdTrades = closed.filter(t => t.strategy === 'HOLD');
    const flipTrades = closed.filter(t => t.strategy === 'FLIP');

    const holdPnL = holdTrades.reduce((sum, t) => sum + (t.pnl_eur || 0), 0);
    const flipPnL = flipTrades.reduce((sum, t) => sum + (t.pnl_eur || 0), 0);

    const holdWinRate = holdTrades.length > 0
      ? (holdTrades.filter(t => t.pnl_eur! > 0).length / holdTrades.length) * 100
      : 0;

    const flipWinRate = flipTrades.length > 0
      ? (flipTrades.filter(t => t.pnl_eur! > 0).length / flipTrades.length) * 100
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
  }, [trades]);

  const COLORS = ['#10b981', '#ef4444'];

  if (trades.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-bold text-white mb-4">📈 Performance</h2>
        <p className="text-gray-400">Aucune donnée de trading pour le moment.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Graphique PnL Cumulatif */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">
          💰 PnL Cumulatif ({period} jours)
        </h3>
        {pnlOverTime.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={pnlOverTime}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
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
          <p className="text-gray-400 text-center py-8">
            Aucun trade fermé dans les {period} derniers jours
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Graphique Win/Loss */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            🎯 Distribution Gains/Pertes
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
            <p className="text-gray-400 text-center py-8">Aucun trade fermé</p>
          )}
        </div>

        {/* Graphique Performance par Stratégie */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            📊 Performance par Stratégie
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
            <p className="text-gray-400 text-center py-8">Aucun trade fermé</p>
          )}
          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            {strategyPerformance.map(s => (
              <div key={s.strategy} className="bg-gray-700 rounded p-3">
                <p className="text-gray-400">{s.strategy}</p>
                <p className="text-white font-semibold">
                  {s.trades} trade{s.trades > 1 ? 's' : ''}
                </p>
                <p className={s.pnl >= 0 ? 'text-green-400' : 'text-red-400'}>
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
