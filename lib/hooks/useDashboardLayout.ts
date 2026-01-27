import { useState, useEffect } from 'react';

export type DashboardSection =
  | 'liveMonitoring'
  | 'stats'
  | 'pnlChart'
  | 'performanceCharts'
  | 'activePositions'
  | 'tradeHistory'
  | 'opportunities';

export interface DashboardLayout {
  [key: string]: boolean;
}

const DEFAULT_LAYOUT: DashboardLayout = {
  liveMonitoring: true,
  stats: true,
  pnlChart: true,
  performanceCharts: true,
  activePositions: true,
  tradeHistory: true,
  opportunities: true,
};

const STORAGE_KEY = 'dashboard-layout';

export function useDashboardLayout() {
  const [layout, setLayout] = useState<DashboardLayout>(DEFAULT_LAYOUT);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setLayout({ ...DEFAULT_LAYOUT, ...parsed });
      } catch (e) {
        console.error('Failed to parse dashboard layout:', e);
      }
    }
    setIsLoaded(true);
  }, []);

  // Save to localStorage when layout changes
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
    }
  }, [layout, isLoaded]);

  const toggleSection = (section: DashboardSection) => {
    setLayout((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const resetLayout = () => {
    setLayout(DEFAULT_LAYOUT);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_LAYOUT));
  };

  const isVisible = (section: DashboardSection) => {
    return layout[section] ?? true;
  };

  return {
    layout,
    isVisible,
    toggleSection,
    resetLayout,
    isLoaded,
  };
}
