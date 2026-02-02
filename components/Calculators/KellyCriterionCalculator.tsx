'use client';

import { useState } from 'react';

export default function KellyCriterionCalculator() {
  const [winRate, setWinRate] = useState<string>('55');
  const [avgWin, setAvgWin] = useState<string>('10');
  const [avgLoss, setAvgLoss] = useState<string>('8');
  const [bankroll, setBankroll] = useState<string>('1000');

  const calculate = () => {
    const w = parseFloat(winRate) / 100; // Win probability
    const l = 1 - w; // Loss probability
    const b = parseFloat(avgWin) / parseFloat(avgLoss); // Win/Loss ratio

    // Kelly Formula: f* = (bp - q) / b
    // where p = win probability, q = loss probability, b = win/loss ratio
    const kellyPercent = ((b * w - l) / b) * 100;

    // Half-Kelly (plus conservateur)
    const halfKelly = kellyPercent / 2;

    // Position size in EUR
    const bank = parseFloat(bankroll);
    const fullKellySize = (kellyPercent / 100) * bank;
    const halfKellySize = (halfKelly / 100) * bank;

    return {
      kellyPercent: kellyPercent.toFixed(2),
      halfKelly: halfKelly.toFixed(2),
      fullKellySize: fullKellySize.toFixed(2),
      halfKellySize: halfKellySize.toFixed(2),
      isValid: kellyPercent > 0,
    };
  };

  const result = calculate();

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 sm:p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          🎯 Kelly Criterion Calculator
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Calculates the optimal position size to maximize long-term capital growth.
          <br />
          <span className="text-xs text-yellow-600 dark:text-yellow-400">
            ⚠️ Recommendation: Use Half-Kelly (50%) to reduce volatility
          </span>
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Inputs */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Win Rate (%)
            </label>
            <input
              type="number"
              value={winRate}
              onChange={(e) => setWinRate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="55"
              min="0"
              max="100"
              step="0.1"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Historical winning trades percentage
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Average Win (€)
            </label>
            <input
              type="number"
              value={avgWin}
              onChange={(e) => setAvgWin(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="10"
              min="0"
              step="0.1"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Average profit per winning trade
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Average Loss (€)
            </label>
            <input
              type="number"
              value={avgLoss}
              onChange={(e) => setAvgLoss(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="8"
              min="0"
              step="0.1"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Average loss per losing trade (positive value)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Bankroll Total (€)
            </label>
            <input
              type="number"
              value={bankroll}
              onChange={(e) => setBankroll(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="1000"
              min="0"
              step="10"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Your total trading capital
            </p>
          </div>
        </div>

        {/* Results */}
        <div className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-3">
              📊 Results
            </h3>

            {result.isValid ? (
              <>
                <div className="mb-4">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Full Kelly</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {result.kellyPercent}%
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {result.fullKellySize}€ par trade
                  </p>
                </div>

                <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1 flex items-center gap-1">
                    Half Kelly <span className="text-green-600 dark:text-green-400">✓ Recommended</span>
                  </p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {result.halfKelly}%
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {result.halfKellySize}€ par trade
                  </p>
                </div>

                <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1 border-t border-gray-200 dark:border-gray-700 pt-3">
                  <p>• Full Kelly maximise la croissance mais avec haute volatilité</p>
                  <p>• Half Kelly réduit le risque de drawdown tout en gardant une bonne croissance</p>
                  <p>• Ne jamais dépasser Full Kelly (risque de ruine)</p>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-red-600 dark:text-red-400 font-semibold mb-2">
                  ⚠️ Edge Négatif
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Ton avantage statistique est négatif. Kelly Criterion recommande de ne PAS trader dans ces conditions.
                  Améliore ton win rate ou ton ratio gain/perte.
                </p>
              </div>
            )}
          </div>

          {/* Formula Explanation */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
            <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
              📐 Formule
            </h4>
            <code className="text-xs text-gray-600 dark:text-gray-400 block mb-2">
              f* = (bp - q) / b
            </code>
            <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
              <p>• b = Win/Loss ratio ({(parseFloat(avgWin) / parseFloat(avgLoss)).toFixed(2)})</p>
              <p>• p = Win probability ({(parseFloat(winRate) / 100).toFixed(2)})</p>
              <p>• q = Loss probability ({(1 - parseFloat(winRate) / 100).toFixed(2)})</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
