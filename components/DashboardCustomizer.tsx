'use client';

import { useState } from 'react';
import { useDashboardLayout, type DashboardSection } from '@/lib/hooks/useDashboardLayout';

interface SectionConfig {
  key: DashboardSection;
  label: string;
  icon: string;
  description: string;
}

const SECTIONS: SectionConfig[] = [
  {
    key: 'liveMonitoring',
    label: 'Live Monitoring',
    icon: '📡',
    description: 'Suivi en temps réel des WebSocket et status du bot',
  },
  {
    key: 'stats',
    label: 'Statistiques',
    icon: '📊',
    description: 'Vue d\'ensemble des stats (PnL, positions, volume, win rate)',
  },
  {
    key: 'pnlChart',
    label: 'Graphique PnL',
    icon: '📈',
    description: 'Évolution du profit & loss sur 7 jours',
  },
  {
    key: 'performanceCharts',
    label: 'Analyse de Performance',
    icon: '📉',
    description: 'Graphiques détaillés de performance (7/30 jours)',
  },
  {
    key: 'activePositions',
    label: 'Positions Actives',
    icon: '💼',
    description: 'Liste des positions en cours avec bouton close manuel',
  },
  {
    key: 'tradeHistory',
    label: 'Historique des Trades',
    icon: '📜',
    description: 'Table complète de tous les trades effectués',
  },
  {
    key: 'opportunities',
    label: 'Top Opportunities',
    icon: '🎯',
    description: 'Meilleures opportunités de trading détectées',
  },
];

export default function DashboardCustomizer() {
  const [isOpen, setIsOpen] = useState(false);
  const { layout, toggleSection, resetLayout } = useDashboardLayout();

  return (
    <>
      {/* Button to open customizer */}
      <button
        onClick={() => setIsOpen(true)}
        className="px-3 sm:px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm sm:text-base rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center gap-2"
        title="Personnaliser le dashboard"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
          />
        </svg>
        <span className="hidden sm:inline">Layout</span>
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Personnaliser le Dashboard
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Affiche ou masque les sections selon tes préférences
                  </p>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto flex-1">
              <div className="space-y-3">
                {SECTIONS.map((section) => {
                  const isVisible = layout[section.key] ?? true;
                  return (
                    <div
                      key={section.key}
                      className="flex items-start gap-4 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
                    >
                      <div className="text-3xl mt-1">{section.icon}</div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {section.label}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {section.description}
                        </p>
                      </div>
                      <button
                        onClick={() => toggleSection(section.key)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 ${
                          isVisible
                            ? 'bg-blue-600'
                            : 'bg-gray-200 dark:bg-gray-700'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            isVisible ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <button
                onClick={resetLayout}
                className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Réinitialiser
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Terminé
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
