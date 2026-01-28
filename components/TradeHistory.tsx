'use client';

import { useState, useMemo } from 'react';

interface Trade {
  id: string;
  market_name: string;
  strategy: 'HOLD' | 'FLIP';
  side: 'YES' | 'NO';
  entry_price: number;
  exit_price?: number;
  position_size_eur: number;
  pnl_eur?: number;
  status: 'OPEN' | 'CLOSED';
  opened_at: string;
  closed_at?: string;
  stop_loss?: number;
  take_profit?: number;
}

interface TradeHistoryProps {
  trades: Trade[];
}

type FilterStatus = 'all' | 'OPEN' | 'CLOSED';
type FilterStrategy = 'all' | 'HOLD' | 'FLIP';
type FilterSide = 'all' | 'YES' | 'NO';
type FilterPnL = 'all' | 'profit' | 'loss';

export default function TradeHistory({ trades }: TradeHistoryProps) {
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [filterStrategy, setFilterStrategy] = useState<FilterStrategy>('all');
  const [filterSide, setFilterSide] = useState<FilterSide>('all');
  const [filterPnL, setFilterPnL] = useState<FilterPnL>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'pnl'>('date');

  // Filtrer et trier les trades
  const filteredTrades = useMemo(() => {
    let filtered = [...trades];

    // Filtre par statut
    if (filterStatus !== 'all') {
      filtered = filtered.filter(t => t.status === filterStatus);
    }

    // Filtre par stratégie
    if (filterStrategy !== 'all') {
      filtered = filtered.filter(t => t.strategy === filterStrategy);
    }

    // Filtre par side
    if (filterSide !== 'all') {
      filtered = filtered.filter(t => t.side === filterSide);
    }

    // Filtre par PnL
    if (filterPnL === 'profit') {
      filtered = filtered.filter(t => t.pnl_eur !== undefined && t.pnl_eur > 0);
    } else if (filterPnL === 'loss') {
      filtered = filtered.filter(t => t.pnl_eur !== undefined && t.pnl_eur <= 0);
    }

    // Recherche par nom de marché
    if (searchTerm) {
      filtered = filtered.filter(t =>
        t.market_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Tri
    if (sortBy === 'date') {
      filtered.sort((a, b) =>
        new Date(b.opened_at).getTime() - new Date(a.opened_at).getTime()
      );
    } else if (sortBy === 'pnl') {
      filtered.sort((a, b) => (b.pnl_eur || 0) - (a.pnl_eur || 0));
    }

    return filtered;
  }, [trades, filterStatus, filterStrategy, filterSide, filterPnL, searchTerm, sortBy]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const calculateDuration = (openedAt: string, closedAt?: string) => {
    const start = new Date(openedAt).getTime();
    const end = closedAt ? new Date(closedAt).getTime() : Date.now();
    const diffHours = Math.floor((end - start) / (1000 * 60 * 60));
    const days = Math.floor(diffHours / 24);
    const hours = diffHours % 24;

    if (days > 0) return `${days}j ${hours}h`;
    return `${hours}h`;
  };

  return (
    <div className="group relative">
      {/* Glow effect */}
      <div className="absolute -inset-0.5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-lg bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20" />

      {/* Card */}
      <div className="relative bg-gradient-to-br from-white/95 via-slate-50/95 to-white/95 dark:from-slate-900/95 dark:via-slate-800/95 dark:to-slate-900/95 backdrop-blur-xl border border-slate-300/50 dark:border-slate-700/50 rounded-2xl p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
            <span className="text-xl">📜</span>
          </div>
          <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
            Trade History
          </h2>
        </div>

      {/* Filtres */}
      <div className="mb-6 space-y-4">
        {/* Barre de recherche */}
        <input
          type="text"
          placeholder="🔍 Search market..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl border border-slate-300 dark:border-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        />

        {/* Filtres rapides */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Statut */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
            className="px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl border border-slate-300 dark:border-slate-700 focus:border-blue-500 focus:outline-none"
          >
            <option value="all">📊 Tous les statuts</option>
            <option value="OPEN">🟢 Ouverts</option>
            <option value="CLOSED">🔴 Fermés</option>
          </select>

          {/* Stratégie */}
          <select
            value={filterStrategy}
            onChange={(e) => setFilterStrategy(e.target.value as FilterStrategy)}
            className="px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
          >
            <option value="all">🎯 Toutes stratégies</option>
            <option value="HOLD">💎 HOLD</option>
            <option value="FLIP">🔄 FLIP</option>
          </select>

          {/* Side */}
          <select
            value={filterSide}
            onChange={(e) => setFilterSide(e.target.value as FilterSide)}
            className="px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
          >
            <option value="all">⚖️ Tous les côtés</option>
            <option value="YES">✅ YES</option>
            <option value="NO">❌ NO</option>
          </select>

          {/* PnL */}
          <select
            value={filterPnL}
            onChange={(e) => setFilterPnL(e.target.value as FilterPnL)}
            className="px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
          >
            <option value="all">💰 Tous les PnL</option>
            <option value="profit">📈 Profits uniquement</option>
            <option value="loss">📉 Pertes uniquement</option>
          </select>
        </div>

        {/* Tri */}
        <div className="flex gap-3">
          <button
            onClick={() => setSortBy('date')}
            className={`px-4 py-2 rounded-xl font-medium transition-all ${
              sortBy === 'date'
                ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700'
            }`}
          >
            📅 Sort by date
          </button>
          <button
            onClick={() => setSortBy('pnl')}
            className={`px-4 py-2 rounded-xl font-medium transition-all ${
              sortBy === 'pnl'
                ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700'
            }`}
          >
            💰 Sort by PnL
          </button>
        </div>
      </div>

      {/* Résultats */}
      <div className="text-sm text-slate-600 dark:text-slate-400 mb-4">
        {filteredTrades.length} trade{filteredTrades.length > 1 ? 's' : ''} found
      </div>

      {/* Tableau */}
      <div className="overflow-x-auto">
        {filteredTrades.length > 0 ? (
          <table className="w-full text-sm text-left text-slate-700 dark:text-slate-300">
            <thead className="text-xs uppercase bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3">Marché</th>
                <th className="px-4 py-3">Stratégie</th>
                <th className="px-4 py-3">Side</th>
                <th className="px-4 py-3">Prix Entrée</th>
                <th className="px-4 py-3">Prix Sortie</th>
                <th className="px-4 py-3">Taille</th>
                <th className="px-4 py-3">PnL</th>
                <th className="px-4 py-3">Durée</th>
                <th className="px-4 py-3">Date Ouverture</th>
              </tr>
            </thead>
            <tbody>
              {filteredTrades.map((trade) => (
                <tr key={trade.id} className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800/50">
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${
                        trade.status === 'OPEN'
                          ? 'bg-green-900 text-green-300'
                          : 'bg-gray-600 text-gray-300'
                      }`}
                    >
                      {trade.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 max-w-xs truncate" title={trade.market_name}>
                    {trade.market_name}
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-semibold">
                      {trade.strategy === 'HOLD' ? '💎' : '🔄'} {trade.strategy}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={trade.side === 'YES' ? 'text-green-400' : 'text-red-400'}>
                      {trade.side}
                    </span>
                  </td>
                  <td className="px-4 py-3">{((trade.entry_price || 0) * 100).toFixed(1)}%</td>
                  <td className="px-4 py-3">
                    {trade.exit_price ? `${(trade.exit_price * 100).toFixed(1)}%` : '-'}
                  </td>
                  <td className="px-4 py-3">{(trade.position_size_eur || 0).toFixed(2)}€</td>
                  <td className="px-4 py-3">
                    {trade.pnl_eur !== undefined && trade.pnl_eur !== null ? (
                      <span className={trade.pnl_eur >= 0 ? 'text-green-400' : 'text-red-400'}>
                        {trade.pnl_eur >= 0 ? '+' : ''}
                        {trade.pnl_eur.toFixed(2)}€
                        <span className="text-xs ml-1">
                          ({((trade.pnl_eur / (trade.position_size_eur || 1)) * 100).toFixed(1)}%)
                        </span>
                      </span>
                    ) : (
                      <span className="text-gray-500">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {calculateDuration(trade.opened_at, trade.closed_at)}
                  </td>
                  <td className="px-4 py-3 text-xs">{formatDate(trade.opened_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-12 text-slate-600 dark:text-slate-400">
            <p>No trades match the selected filters</p>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
