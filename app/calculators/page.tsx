'use client';

import { useState } from 'react';
import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';
import KellyCriterionCalculator from '@/components/Calculators/KellyCriterionCalculator';
import RiskRewardCalculator from '@/components/Calculators/RiskRewardCalculator';
import PositionSizingCalculator from '@/components/Calculators/PositionSizingCalculator';
import FlipBreakevenCalculator from '@/components/Calculators/FlipBreakevenCalculator';

export default function CalculatorsPage() {
  const [activeTab, setActiveTab] = useState<'kelly' | 'risk' | 'position' | 'flip'>('kelly');

  const tabs = [
    { id: 'kelly' as const, label: 'Kelly Criterion', icon: '🎯' },
    { id: 'risk' as const, label: 'Risk/Reward', icon: '⚖️' },
    { id: 'position' as const, label: 'Position Sizing', icon: '💰' },
    { id: 'flip' as const, label: 'Flip Breakeven', icon: '🔄' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="p-4 sm:p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              Trading Calculators
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Outils pour optimiser tes positions et gérer le risque
            </p>
          </div>
          <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
            <ThemeToggle />
            <Link
              href="/"
              className="flex-1 sm:flex-none text-center px-3 sm:px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white text-sm sm:text-base rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              ← Dashboard
            </Link>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 overflow-x-auto">
          <div className="flex gap-2 min-w-max sm:min-w-0">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2.5 rounded-lg font-medium text-sm transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Calculator Content */}
        <div>
          {activeTab === 'kelly' && <KellyCriterionCalculator />}
          {activeTab === 'risk' && <RiskRewardCalculator />}
          {activeTab === 'position' && <PositionSizingCalculator />}
          {activeTab === 'flip' && <FlipBreakevenCalculator />}
        </div>
      </div>
    </div>
  );
}
