'use client';

import { useState } from 'react';
import useSWR from 'swr';
import ManualControls from '@/components/ManualControls';
import ThemeToggle from '@/components/ThemeToggle';
import Link from 'next/link';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function BotConfigPage() {
  const { data: config, mutate: mutateConfig } = useSWR<any>('/api/bot/config', fetcher, {
    refreshInterval: 10000, // 10s
  });

  // Handlers pour les contrôles manuels
  const handleScan = async () => {
    try {
      // Appeler /api/bot/execute au lieu de /api/bot/scan pour trader automatiquement
      const response = await fetch('/api/bot/execute', { method: 'POST' });
      const result = await response.json();
      if (result.status === 'position_opened' || result.status === 'idle' || result.status === 'no_opportunities') {
        mutateConfig();
      }
      return result;
    } catch (error) {
      console.error('Scan error:', error);
      return { success: false, error: String(error) };
    }
  };

  const handleTogglePause = async () => {
    try {
      const response = await fetch('/api/bot/config/pause', { method: 'POST' });
      const result = await response.json();
      if (result.success) {
        mutateConfig();
      }
      return result;
    } catch (error) {
      console.error('Toggle pause error:', error);
      return { success: false, error: String(error) };
    }
  };

  const handleUpdateConfig = async (updates: any) => {
    try {
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
    } catch (error) {
      console.error('Update config error:', error);
      return { success: false, error: String(error) };
    }
  };

  return (
    <div className="min-h-screen">
      <div className="p-4 sm:p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8 relative">
          {/* Glassmorphism header container */}
          <div className="relative backdrop-blur-xl bg-gradient-to-r from-slate-50/90 via-white/90 to-slate-50/90 dark:from-slate-900/90 dark:via-slate-800/90 dark:to-slate-900/90 rounded-2xl border border-slate-300/50 dark:border-slate-700/50 shadow-2xl p-6">
            {/* Animated gradient border effect */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-2xl opacity-20 blur-xl animate-pulse" />

            <div className="relative">
              {/* Navigation */}
              <div className="flex justify-between items-center mb-6">
                <Link
                  href="/"
                  className="group flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-200/50 dark:bg-slate-800/50 hover:bg-slate-300/50 dark:hover:bg-slate-700/50 border border-slate-300/50 dark:border-slate-700/50 transition-all duration-300 hover:scale-105"
                >
                  <span className="text-blue-600 dark:text-blue-400">←</span>
                  <span className="text-slate-700 dark:text-slate-300 font-medium">Dashboard</span>
                </Link>
                <ThemeToggle />
              </div>

              {/* Title */}
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg">
                  <span className="text-2xl">⚙️</span>
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-rose-400">
                    Bot Configuration
                  </h1>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Manage trading bot settings and controls</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Manual Controls */}
        {config ? (
          <ManualControls
            config={config}
            onScan={handleScan}
            onTogglePause={handleTogglePause}
            onUpdateConfig={handleUpdateConfig}
          />
        ) : (
          <div className="group relative">
            <div className="absolute -inset-0.5 rounded-2xl opacity-50 blur-lg bg-gradient-to-r from-blue-500/30 via-purple-500/30 to-pink-500/30" />
            <div className="relative bg-gradient-to-br from-slate-50/95 via-white/95 to-slate-50/95 dark:from-slate-900/95 dark:via-slate-800/95 dark:to-slate-900/95 backdrop-blur-xl rounded-2xl border border-slate-300/50 dark:border-slate-700/50 p-8 text-center">
              <div className="animate-spin w-12 h-12 mx-auto mb-4 border-4 border-slate-300 dark:border-slate-700 border-t-blue-500 rounded-full"></div>
              <p className="text-slate-600 dark:text-slate-400">Loading configuration...</p>
            </div>
          </div>
        )}

        {/* Info section */}
        <div className="mt-6 sm:mt-8 group relative">
          {/* Glow effect */}
          <div className="absolute -inset-0.5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-lg bg-gradient-to-r from-blue-500/20 via-cyan-500/20 to-blue-500/20" />

          {/* Card */}
          <div className="relative bg-gradient-to-br from-blue-50/95 via-cyan-50/95 to-blue-50/95 dark:from-blue-900/20 dark:via-cyan-900/20 dark:to-blue-900/20 backdrop-blur-xl border border-blue-200/50 dark:border-blue-800/50 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg">
                <span className="text-xl">ℹ️</span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-600 dark:from-blue-400 dark:via-cyan-400 dark:to-blue-400">
                Configuration Information
              </h2>
            </div>

            <div className="space-y-3 text-sm text-slate-700 dark:text-slate-300">
              <div className="flex gap-3">
                <span className="text-blue-600 dark:text-blue-400 font-bold">•</span>
                <p>
                  <strong className="text-blue-700 dark:text-blue-300">Scan Now:</strong> Launch an immediate market analysis and open positions if opportunities are found.
                </p>
              </div>
              <div className="flex gap-3">
                <span className="text-blue-600 dark:text-blue-400 font-bold">•</span>
                <p>
                  <strong className="text-blue-700 dark:text-blue-300">Pause/Resume:</strong> Pause the bot to prevent opening new positions. Existing positions remain active.
                </p>
              </div>
              <div className="flex gap-3">
                <span className="text-blue-600 dark:text-blue-400 font-bold">•</span>
                <p>
                  <strong className="text-blue-700 dark:text-blue-300">Advanced Settings:</strong> Adjust trading thresholds (HVS, FlipEV, stop-loss, take-profit) to customize strategy.
                </p>
              </div>
              <div className="flex gap-3">
                <span className="text-blue-600 dark:text-blue-400 font-bold">•</span>
                <p>
                  <strong className="text-blue-700 dark:text-blue-300">Modifications:</strong> All changes are saved immediately to the database and applied on the next scan.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
