'use client';

interface StatCardProps {
  label: string;
  value: string | number;
  change?: number;
  subtext?: string;
  color?: 'green' | 'red' | 'blue' | 'gray';
}

export function StatCard({ label, value, change, subtext, color = 'gray' }: StatCardProps) {
  const colorClasses = {
    green: 'text-green-600 bg-green-50',
    red: 'text-red-600 bg-red-50',
    blue: 'text-blue-600 bg-blue-50',
    gray: 'text-gray-600 bg-gray-50',
  };

  return (
    <div className="bg-white border rounded-lg p-4 shadow-sm">
      <p className="text-sm text-gray-500 mb-1">{label}</p>
      <div className="flex items-baseline gap-2">
        <p className={`text-2xl font-bold ${colorClasses[color].split(' ')[0]}`}>{value}</p>
        {change !== undefined && (
          <span
            className={`text-xs font-semibold ${
              change >= 0 ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {change >= 0 ? '+' : ''}
            {change.toFixed(2)}€
          </span>
        )}
      </div>
      {subtext && <p className="text-xs text-gray-500 mt-1">{subtext}</p>}
    </div>
  );
}
