'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { PnLDataPoint } from '@/lib/types';

interface PnLChartProps {
  data: PnLDataPoint[];
}

export function PnLChart({ data }: PnLChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg font-bold mb-4">PnL Last 7 Days</h3>
        <div className="h-[250px] flex items-center justify-center text-gray-500">
          No data available
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border rounded-lg p-6">
      <h3 className="text-lg font-bold mb-4">PnL Last 7 Days</h3>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12 }}
            tickFormatter={(val) => {
              const date = new Date(val);
              return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            }}
          />
          <YAxis tick={{ fontSize: 12 }} tickFormatter={(val) => `${val}€`} />
          <Tooltip
            formatter={(value: any) => [`${Number(value).toFixed(2)}€`, 'PnL']}
            labelFormatter={(label) => new Date(label).toLocaleDateString()}
          />
          <Line
            type="monotone"
            dataKey="pnl"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
