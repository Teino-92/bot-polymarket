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
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 sm:p-4 shadow-sm">
      <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-1">{label}</p>
      <div className="flex items-baseline gap-1 sm:gap-2">
        <p className={`text-xl sm:text-2xl font-bold ${colorClasses[color].split(' ')[0]} dark:text-gray-100`}>{value}</p>
        {change !== undefined && (
          <span
            className={`text-xs font-semibold ${
              change >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
            }`}
          >
            {change >= 0 ? '+' : ''}
            {change.toFixed(2)}€
          </span>
        )}
      </div>
      {subtext && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{subtext}</p>}
    </div>
  );
}
