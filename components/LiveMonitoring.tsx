'use client';

import { useState, useEffect } from 'react';

interface LiveMonitoringProps {
  isPaused?: boolean;
}

export default function LiveMonitoring({ isPaused = false }: LiveMonitoringProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [websocketStatus, setWebsocketStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [lastPriceUpdate, setLastPriceUpdate] = useState<Date | null>(null);
  const [mounted, setMounted] = useState(false);

  // Mount check for hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  // Mettre à day l'hour toutes les seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Vérifier le statut du WebSocket
  useEffect(() => {
    const checkWebSocket = async () => {
      try {
        // Use Vercel API proxy to avoid Mixed Content issues (HTTPS -> HTTP)
        // This also bypasses browser cache issues
        const healthUrl = '/api/websocket/health';

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(healthUrl, {
          signal: controller.signal,
          cache: 'no-cache', // Force fresh data, bypass Service Worker cache
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          setWebsocketStatus('online');
          const data = await response.json();
          if (data.lastUpdate) {
            setLastPriceUpdate(new Date(data.lastUpdate));
          }
        } else {
          setWebsocketStatus('offline');
        }
      } catch (error) {
        setWebsocketStatus('offline');
      }
    };

    // Premier check après 1 second pour éviter les problèmes au chargement
    const initialTimeout = setTimeout(() => {
      checkWebSocket();
    }, 1000);

    // Puis vérifier toutes les 30s
    const interval = setInterval(checkWebSocket, 30000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, []);

  // Calculer le temps jusqu'au prochain cron (toutes les 4h : 00:00, 04:00, 08:00, 12:00, 16:00, 20:00)
  const getNextCronTime = () => {
    const now = currentTime;
    const hours = now.getHours();
    const nextCronHour = Math.ceil((hours + 1) / 4) * 4; // Prochain multiple de 4
    const nextCron = new Date(now);
    nextCron.setHours(nextCronHour % 24, 0, 0, 0);

    if (nextCronHour >= 24) {
      nextCron.setDate(nextCron.getDate() + 1);
    }

    const diff = nextCron.getTime() - now.getTime();
    const hours_left = Math.floor(diff / (1000 * 60 * 60));
    const minutes_left = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds_left = Math.floor((diff % (1000 * 60)) / 1000);

    return {
      text: `${hours_left}h ${minutes_left}m ${seconds_left}s`,
      nextTime: nextCron.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      percent: ((4 * 60 * 60 * 1000 - diff) / (4 * 60 * 60 * 1000)) * 100,
    };
  };

  const nextCron = getNextCronTime();

  const formatTimeSince = (date: Date | null) => {
    if (!date) return '-';
    const diff = currentTime.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) return `ago ${hours}h`;
    if (minutes > 0) return `ago ${minutes}min`;
    return `ago ${seconds}s`;
  };

  return (
    <div className="group relative">
      {/* Glow effect */}
      <div className="absolute -inset-0.5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-lg bg-gradient-to-r from-red-500/20 via-orange-500/20 to-red-500/20" />

      {/* Card */}
      <div className="relative bg-gradient-to-br from-white/95 via-slate-50/95 to-white/95 dark:from-slate-900/95 dark:via-slate-800/95 dark:to-slate-900/95 backdrop-blur-xl border border-slate-300/50 dark:border-slate-700/50 rounded-2xl p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center shadow-lg">
            <span className="text-xl">🔴</span>
          </div>
          <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-orange-400 to-red-400">
            Live Monitoring
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Statut global */}
          <div className="bg-slate-100/50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-300/50 dark:border-slate-700/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-600 dark:text-slate-400 text-sm">System Status</span>
            <span className={`text-2xl ${isPaused ? '⏸️' : '🟢'}`}>
              {isPaused ? '⏸️' : '🟢'}
            </span>
          </div>
          <div className="text-slate-900 dark:text-white font-bold">
            {isPaused ? 'Paused' : 'Active'}
          </div>
          <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            {mounted ? currentTime.toLocaleTimeString('en-US') : '--:--:--'}
          </div>
        </div>

        {/* WebSocket Status */}
        <div className="bg-slate-100/50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-300/50 dark:border-slate-700/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-600 dark:text-slate-400 text-sm">WebSocket</span>
            <span className="text-2xl">
              {websocketStatus === 'checking' && '🟡'}
              {websocketStatus === 'online' && '🟢'}
              {websocketStatus === 'offline' && '🔴'}
            </span>
          </div>
          <div className="text-slate-900 dark:text-white font-bold">
            {websocketStatus === 'checking' && 'Checking...'}
            {websocketStatus === 'online' && 'Connected'}
            {websocketStatus === 'offline' && 'Disconnected'}
          </div>
          <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            {lastPriceUpdate ? formatTimeSince(lastPriceUpdate) : 'No data'}
          </div>
        </div>

        {/* Next Cron */}
        <div className="bg-slate-100/50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-300/50 dark:border-slate-700/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-600 dark:text-slate-400 text-sm">Next Scan</span>
            <span className="text-2xl">⏰</span>
          </div>
          <div className="text-slate-900 dark:text-white font-bold">
            {nextCron.text}
          </div>
          <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            at {nextCron.nextTime}
          </div>
          {/* Barre de progression */}
          <div className="mt-3 bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
            {mounted && (
              <div
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-full transition-all duration-1000"
                style={{ width: `${nextCron.percent}%` }}
              />
            )}
          </div>
        </div>

        {/* Last update */}
        <div className="bg-slate-100/50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-300/50 dark:border-slate-700/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-600 dark:text-slate-400 text-sm">Last Activity</span>
            <span className="text-2xl">📊</span>
          </div>
          <div className="text-slate-900 dark:text-white font-bold">
            {lastPriceUpdate ? (
              <>Price updated</>
            ) : (
              <>Waiting</>
            )}
          </div>
          <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            {lastPriceUpdate ? formatTimeSince(lastPriceUpdate) : 'No data'}
          </div>
        </div>
      </div>
      </div>

      {/* Alertes système */}
      <div className="mt-6 space-y-2">
        {isPaused && (
          <div className="flex items-center gap-2 px-4 py-3 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-600 rounded-xl text-yellow-700 dark:text-yellow-400 text-sm backdrop-blur-sm">
            <span>⚠️</span>
            <span>Bot paused - No trades will be opened automatically</span>
          </div>
        )}

        {websocketStatus === 'offline' && (
          <div className="flex items-center gap-2 px-4 py-3 bg-red-50 dark:bg-red-900/30 border border-red-300 dark:border-red-600 rounded-xl text-red-700 dark:text-red-400 text-sm backdrop-blur-sm">
            <span>🔴</span>
            <span>WebSocket disconnected - Stop-loss/take-profit are not monitored in real-time</span>
          </div>
        )}
      </div>
    </div>
  );
}
