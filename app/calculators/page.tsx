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
    <div className="min-h-screen">
      <div className="p-4 sm:p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8 relative">
          {/* Glassmorphism header container */}
          <div className="relative backdrop-blur-xl bg-gradient-to-r from-slate-50/90 via-white/90 to-slate-50/90 dark:from-slate-900/90 dark:via-slate-800/90 dark:to-slate-900/90 rounded-2xl border border-slate-300/50 dark:border-slate-700/50 shadow-2xl p-6">
            {/* Animated gradient border effect */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 rounded-2xl opacity-20 blur-xl animate-pulse" />

            <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
                  <span className="text-2xl">📊</span>
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400">
                    Trading Calculators
                  </h1>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    Tools to optimize positions and manage risk
                  </p>
                </div>
              </div>

              <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
                <ThemeToggle />
                <Link
                  href="/"
                  className="group relative flex-1 sm:flex-none text-center px-4 py-2.5 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 text-slate-700 dark:text-white text-sm rounded-xl hover:from-slate-300 hover:to-slate-400 dark:hover:from-slate-600 dark:hover:to-slate-700 transition-all duration-300 shadow-lg overflow-hidden"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    <span>←</span>
                    <span className="hidden sm:inline">Dashboard</span>
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 overflow-x-auto">
          <div className="flex gap-2 sm:gap-3 min-w-max sm:min-w-0 p-2 bg-slate-100/50 dark:bg-slate-900/50 backdrop-blur-sm rounded-2xl border border-slate-300/50 dark:border-slate-700/50">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`group relative px-4 sm:px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-500/50'
                    : 'bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700/50 border border-slate-300/50 dark:border-slate-700/50'
                }`}
              >
                <span className="relative z-10">
                  {tab.icon} {tab.label}
                </span>
                {activeTab === tab.id && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700 rounded-xl" />
                )}
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
