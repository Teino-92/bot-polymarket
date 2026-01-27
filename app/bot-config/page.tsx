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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header avec navigation */}
        <div className="mb-8">
          <div className="flex justify-between items-start mb-4">
            <Link href="/" className="text-blue-600 dark:text-blue-400 hover:underline inline-block">
              ← Retour au Dashboard
            </Link>
            <ThemeToggle />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Configuration du Bot</h1>
          <p className="text-gray-500 dark:text-gray-400">Gérer les paramètres et contrôles du bot de trading</p>
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
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
            <p className="text-gray-500 dark:text-gray-400">Chargement de la configuration...</p>
          </div>
        )}

        {/* Info section */}
        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
            ℹ️ Informations sur la configuration
          </h2>
          <div className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
            <p>
              • <strong>Scanner maintenant :</strong> Lance une analyse immédiate des marchés et ouvre des positions si des opportunités sont trouvées.
            </p>
            <p>
              • <strong>Pause/Reprendre :</strong> Met le bot en pause pour empêcher l'ouverture de nouvelles positions. Les positions existantes restent actives.
            </p>
            <p>
              • <strong>Réglages avancés :</strong> Ajuste les seuils de trading (HVS, FlipEV, stop-loss, take-profit) pour personnaliser la stratégie.
            </p>
            <p>
              • <strong>Modifications :</strong> Toutes les modifications sont sauvegardées immédiatement dans la base de données et prises en compte lors du prochain scan.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
