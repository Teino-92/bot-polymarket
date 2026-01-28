'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { PnLDataPoint } from '@/lib/types';

interface PnLChartProps {
  data: PnLDataPoint[];
}

export function PnLChart({ data }: PnLChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="group relative">
        {/* Glow effect */}
        <div className="absolute -inset-0.5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-lg bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20" />

        {/* Card */}
        <div className="relative bg-gradient-to-br from-white/95 via-slate-50/95 to-white/95 dark:from-slate-900/95 dark:via-slate-800/95 dark:to-slate-900/95 backdrop-blur-xl border border-slate-300/50 dark:border-slate-700/50 rounded-2xl p-4 sm:p-6 shadow-2xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
              <span className="text-xl">📈</span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
              PnL Last 7 Days
            </h3>
          </div>
          <div className="h-[200px] sm:h-[250px] flex items-center justify-center border border-slate-300/30 dark:border-slate-700/30 rounded-xl bg-slate-100/30 dark:bg-slate-800/30">
            <p className="text-slate-600 dark:text-slate-400 text-sm">No data available</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="group relative">
      {/* Glow effect */}
      <div className="absolute -inset-0.5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-lg bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20" />

      {/* Card */}
      <div className="relative bg-gradient-to-br from-white/95 via-slate-50/95 to-white/95 dark:from-slate-900/95 dark:via-slate-800/95 dark:to-slate-900/95 backdrop-blur-xl border border-slate-300/50 dark:border-slate-700/50 rounded-2xl p-4 sm:p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
            <span className="text-xl">📈</span>
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
            PnL Last 7 Days
          </h3>
        </div>

        {/* Chart Container */}
        <div className="relative p-4 rounded-xl bg-slate-100/30 dark:bg-slate-800/30 border border-slate-300/30 dark:border-slate-700/30">
          <ResponsiveContainer width="100%" height={200} className="sm:h-[250px]">
            <LineChart data={data}>
              <defs>
                <linearGradient id="pnlGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                tickFormatter={(val) => {
                  const date = new Date(val);
                  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                }}
                stroke="#475569"
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                tickFormatter={(val) => `${val}€`}
                stroke="#475569"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(15, 23, 42, 0.95)',
                  border: '1px solid rgba(71, 85, 105, 0.5)',
                  borderRadius: '12px',
                  backdropFilter: 'blur(12px)',
                  padding: '12px',
                }}
                labelStyle={{ color: '#cbd5e1', fontWeight: 'bold', marginBottom: '4px' }}
                itemStyle={{ color: '#60a5fa', fontWeight: '600' }}
                formatter={(value: any) => [`${Number(value).toFixed(2)}€`, 'PnL']}
                labelFormatter={(label) => new Date(label).toLocaleDateString()}
              />
              <Line
                type="monotone"
                dataKey="pnl"
                stroke="url(#lineGradient)"
                strokeWidth={3}
                dot={{ fill: '#3b82f6', r: 4, strokeWidth: 2, stroke: '#1e40af' }}
                activeDot={{ r: 6, strokeWidth: 2, stroke: '#60a5fa', fill: '#3b82f6' }}
                fill="url(#pnlGradient)"
              />
              <defs>
                <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="50%" stopColor="#8b5cf6" />
                  <stop offset="100%" stopColor="#ec4899" />
                </linearGradient>
              </defs>
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Shimmer effect */}
        <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
        </div>
      </div>
    </div>
  );
}
