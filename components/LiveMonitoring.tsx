'use client';

import { useState, useEffect } from 'react';

interface LiveMonitoringProps {
  isPaused?: boolean;
}

export default function LiveMonitoring({ isPaused = false }: LiveMonitoringProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [websocketStatus, setWebsocketStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [lastPriceUpdate, setLastPriceUpdate] = useState<Date | null>(null);

  // Mettre à jour l'heure toutes les secondes
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
        // Essayer de ping le service WebSocket (Railway)
        const wsUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL;

        // Si pas d'URL configurée, on considère offline
        if (!wsUrl) {
          setWebsocketStatus('offline');
          return;
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(`${wsUrl}/health`, {
          signal: controller.signal
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

    // Premier check après 1 seconde pour éviter les problèmes au chargement
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
      nextTime: nextCron.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
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

    if (hours > 0) return `il y a ${hours}h`;
    if (minutes > 0) return `il y a ${minutes}min`;
    return `il y a ${seconds}s`;
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h2 className="text-xl font-bold text-white mb-6">🔴 Monitoring Temps Réel</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Statut global */}
        <div className="bg-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Statut Système</span>
            <span className={`text-2xl ${isPaused ? '⏸️' : '🟢'}`}>
              {isPaused ? '⏸️' : '🟢'}
            </span>
          </div>
          <div className="text-white font-bold">
            {isPaused ? 'En Pause' : 'Actif'}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            {currentTime.toLocaleTimeString('fr-FR')}
          </div>
        </div>

        {/* WebSocket Status */}
        <div className="bg-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">WebSocket</span>
            <span className="text-2xl">
              {websocketStatus === 'checking' && '🟡'}
              {websocketStatus === 'online' && '🟢'}
              {websocketStatus === 'offline' && '🔴'}
            </span>
          </div>
          <div className="text-white font-bold">
            {websocketStatus === 'checking' && 'Vérification...'}
            {websocketStatus === 'online' && 'Connecté'}
            {websocketStatus === 'offline' && 'Déconnecté'}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            {lastPriceUpdate ? formatTimeSince(lastPriceUpdate) : 'Aucune donnée'}
          </div>
        </div>

        {/* Prochain Cron */}
        <div className="bg-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Prochain Scan</span>
            <span className="text-2xl">⏰</span>
          </div>
          <div className="text-white font-bold">
            {nextCron.text}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            à {nextCron.nextTime}
          </div>
          {/* Barre de progression */}
          <div className="mt-3 bg-gray-600 rounded-full h-2 overflow-hidden">
            <div
              className="bg-blue-500 h-full transition-all duration-1000"
              style={{ width: `${nextCron.percent}%` }}
            />
          </div>
        </div>

        {/* Dernière mise à jour */}
        <div className="bg-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Dernière Activité</span>
            <span className="text-2xl">📊</span>
          </div>
          <div className="text-white font-bold">
            {lastPriceUpdate ? (
              <>Prix mis à jour</>
            ) : (
              <>En attente</>
            )}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            {lastPriceUpdate ? formatTimeSince(lastPriceUpdate) : 'Aucune donnée'}
          </div>
        </div>
      </div>

      {/* Alertes système */}
      <div className="mt-6 space-y-2">
        {isPaused && (
          <div className="flex items-center gap-2 px-4 py-2 bg-yellow-900/30 border border-yellow-600 rounded text-yellow-400 text-sm">
            <span>⚠️</span>
            <span>Bot en pause - Aucun trade ne sera ouvert automatiquement</span>
          </div>
        )}

        {websocketStatus === 'offline' && (
          <div className="flex items-center gap-2 px-4 py-2 bg-red-900/30 border border-red-600 rounded text-red-400 text-sm">
            <span>🔴</span>
            <span>WebSocket déconnecté - Les stop-loss/take-profit ne sont pas surveillés en temps réel</span>
          </div>
        )}

        {websocketStatus === 'online' && !isPaused && (
          <div className="flex items-center gap-2 px-4 py-2 bg-green-900/30 border border-green-600 rounded text-green-400 text-sm">
            <span>✅</span>
            <span>Tout fonctionne correctement - Le bot surveille les marchés en temps réel</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="mt-6 p-4 bg-gray-700/50 rounded text-sm text-gray-400">
        <p className="mb-2">
          <strong className="text-white">Cycle de scan:</strong> Toutes les 4 heures (00:00, 04:00, 08:00, 12:00, 16:00, 20:00)
        </p>
        <p>
          <strong className="text-white">Monitoring:</strong> Les positions ouvertes sont surveillées en continu par le WebSocket service
        </p>
      </div>
    </div>
  );
}
