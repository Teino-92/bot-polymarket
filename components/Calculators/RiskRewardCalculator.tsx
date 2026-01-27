'use client';

import { useState } from 'react';

export default function RiskRewardCalculator() {
  const [entryPrice, setEntryPrice] = useState<string>('0.50');
  const [stopLoss, setStopLoss] = useState<string>('0.40');
  const [takeProfit, setTakeProfit] = useState<string>('0.70');
  const [positionSize, setPositionSize] = useState<string>('100');
  const [side, setSide] = useState<'YES' | 'NO'>('YES');

  const calculate = () => {
    const entry = parseFloat(entryPrice);
    const sl = parseFloat(stopLoss);
    const tp = parseFloat(takeProfit);
    const size = parseFloat(positionSize);

    let risk: number;
    let reward: number;

    if (side === 'YES') {
      risk = (entry - sl) * size;
      reward = (tp - entry) * size;
    } else {
      risk = (sl - entry) * size;
      reward = (entry - tp) * size;
    }

    const ratio = risk > 0 ? reward / risk : 0;

    // Break-even win rate needed
    const breakEvenWinRate = risk > 0 ? (risk / (risk + reward)) * 100 : 0;

    return {
      risk: risk.toFixed(2),
      reward: reward.toFixed(2),
      ratio: ratio.toFixed(2),
      breakEvenWinRate: breakEvenWinRate.toFixed(1),
      isGood: ratio >= 2, // R:R >= 2:1 est considéré bon
    };
  };

  const result = calculate();

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 sm:p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          ⚖️ Risk/Reward Calculator
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Calcule le ratio risque/récompense de ton trade. Un bon trade a généralement un R:R ≥ 2:1.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Inputs */}
        <div className="space-y-4">
          {/* Side Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Position Side
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setSide('YES')}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                  side === 'YES'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                YES
              </button>
              <button
                onClick={() => setSide('NO')}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                  side === 'NO'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                NO
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Entry Price
            </label>
            <input
              type="number"
              value={entryPrice}
              onChange={(e) => setEntryPrice(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0.50"
              min="0"
              max="1"
              step="0.01"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Prix d'entrée prévu (0-1)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Stop-Loss Price
            </label>
            <input
              type="number"
              value={stopLoss}
              onChange={(e) => setStopLoss(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="0.40"
              min="0"
              max="1"
              step="0.01"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Prix où tu couperas ta perte
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Take-Profit Price
            </label>
            <input
              type="number"
              value={takeProfit}
              onChange={(e) => setTakeProfit(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="0.70"
              min="0"
              max="1"
              step="0.01"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Prix où tu prendras ton profit
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Position Size (€)
            </label>
            <input
              type="number"
              value={positionSize}
              onChange={(e) => setPositionSize(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="100"
              min="0"
              step="10"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Taille de la position en euros
            </p>
          </div>
        </div>

        {/* Results */}
        <div className="space-y-4">
          <div
            className={`border-2 rounded-lg p-4 ${
              result.isGood
                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
            }`}
          >
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
              📊 Résultats
            </h3>

            <div className="space-y-4">
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Risque Maximum</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {result.risk}€
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Récompense Potentielle</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {result.reward}€
                </p>
              </div>

              <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Ratio R:R</p>
                <p
                  className={`text-3xl font-bold ${
                    result.isGood
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-yellow-600 dark:text-yellow-400'
                  }`}
                >
                  1:{result.ratio}
                </p>
                {result.isGood ? (
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                    ✓ Excellent ratio risque/récompense
                  </p>
                ) : (
                  <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                    ⚠️ Ratio faible. Vise au moins 1:2
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                  Win Rate Nécessaire (Break-even)
                </p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {result.breakEvenWinRate}%
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  Tu dois gagner au moins {result.breakEvenWinRate}% du temps pour être profitable
                </p>
              </div>
            </div>
          </div>

          {/* Guide */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
            <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
              📚 Guide R:R
            </h4>
            <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
              <p>• 1:3 ou plus = Excellent (33% win rate suffit)</p>
              <p>• 1:2 = Bon (50% win rate nécessaire)</p>
              <p>• 1:1 = Neutre (éviter, breakeven difficile)</p>
              <p>• Moins de 1:1 = Mauvais (éviter absolument)</p>
            </div>
          </div>

          {/* Visual representation */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
            <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-3">
              📈 Visualisation
            </h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-16 text-xs text-gray-600 dark:text-gray-400">Entry:</div>
                <div className="flex-1 h-2 bg-blue-200 dark:bg-blue-800 rounded relative">
                  <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-4 bg-blue-600"></div>
                </div>
                <div className="w-16 text-xs text-right font-mono text-gray-900 dark:text-white">
                  {entryPrice}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-16 text-xs text-red-600 dark:text-red-400">SL:</div>
                <div className="flex-1 h-2 bg-red-200 dark:bg-red-800 rounded relative">
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-4 bg-red-600"></div>
                </div>
                <div className="w-16 text-xs text-right font-mono text-red-600 dark:text-red-400">
                  {stopLoss}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-16 text-xs text-green-600 dark:text-green-400">TP:</div>
                <div className="flex-1 h-2 bg-green-200 dark:bg-green-800 rounded relative">
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-4 bg-green-600"></div>
                </div>
                <div className="w-16 text-xs text-right font-mono text-green-600 dark:text-green-400">
                  {takeProfit}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
