'use client';

import { useState } from 'react';

export default function PositionSizingCalculator() {
  const [bankroll, setBankroll] = useState<string>('1000');
  const [riskPercent, setRiskPercent] = useState<string>('2');
  const [entryPrice, setEntryPrice] = useState<string>('0.50');
  const [stopLoss, setStopLoss] = useState<string>('0.40');
  const [side, setSide] = useState<'YES' | 'NO'>('YES');

  const calculate = () => {
    const bank = parseFloat(bankroll);
    const risk = parseFloat(riskPercent) / 100;
    const entry = parseFloat(entryPrice);
    const sl = parseFloat(stopLoss);

    // Amount willing to risk
    const riskAmount = bank * risk;

    // Price difference (risk per unit)
    let riskPerUnit: number;
    if (side === 'YES') {
      riskPerUnit = entry - sl;
    } else {
      riskPerUnit = sl - entry;
    }

    // Position size in shares
    const positionSize = riskPerUnit > 0 ? riskAmount / riskPerUnit : 0;

    // Total capital needed
    const capitalNeeded = positionSize * entry;

    return {
      riskAmount: riskAmount.toFixed(2),
      riskPerUnit: riskPerUnit.toFixed(3),
      positionSize: positionSize.toFixed(2),
      capitalNeeded: capitalNeeded.toFixed(2),
      isValid: riskPerUnit > 0 && capitalNeeded <= bank,
    };
  };

  const result = calculate();

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 sm:p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          💰 Position Sizing Calculator
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Calcule la taille de position optimale basée sur ton capital et le risque que tu veux prendre.
          <br />
          <span className="text-xs text-blue-600 dark:text-blue-400">
            💡 Golden rule: Never risk more than 1-2% of your capital per trade
          </span>
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
              Total Bankroll (€)
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

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Risk per Trade (%)
            </label>
            <div className="relative">
              <input
                type="number"
                value={riskPercent}
                onChange={(e) => setRiskPercent(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="2"
                min="0.1"
                max="10"
                step="0.1"
              />
              <div className="absolute right-12 top-2">
                {parseFloat(riskPercent) <= 2 ? (
                  <span className="text-green-600 dark:text-green-400 text-sm">✓</span>
                ) : parseFloat(riskPercent) <= 5 ? (
                  <span className="text-yellow-600 dark:text-yellow-400 text-sm">⚠️</span>
                ) : (
                  <span className="text-red-600 dark:text-red-400 text-sm">❌</span>
                )}
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              % of your capital you're willing to lose on this trade
            </p>
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
              Prix d'entrée prévu
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
              Stop-loss price
            </p>
          </div>
        </div>

        {/* Results */}
        <div className="space-y-4">
          {result.isValid ? (
            <>
              <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-3">
                  📊 Taille de Position Recommendede
                </h3>

                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                      Amount to Risk
                    </p>
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                      {result.riskAmount}€
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {riskPercent}% de {bankroll}€
                    </p>
                  </div>

                  <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                      Risk per Unit
                    </p>
                    <p className="text-lg font-mono text-gray-900 dark:text-white">
                      {result.riskPerUnit}€
                    </p>
                  </div>

                  <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                      Position Size (Shares)
                    </p>
                    <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                      {result.positionSize}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                      Required Capital
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {result.capitalNeeded}€
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {((parseFloat(result.capitalNeeded) / parseFloat(bankroll)) * 100).toFixed(1)}% of your bankroll
                    </p>
                  </div>
                </div>
              </div>

              {/* Risk Level Indicator */}
              <div
                className={`rounded-lg p-4 ${
                  parseFloat(riskPercent) <= 2
                    ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                    : parseFloat(riskPercent) <= 5
                    ? 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'
                    : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                }`}
              >
                <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Risk Level
                </h4>
                {parseFloat(riskPercent) <= 2 ? (
                  <p className="text-sm text-green-600 dark:text-green-400">
                    ✓ Conservative - Excellent for capital preservation
                  </p>
                ) : parseFloat(riskPercent) <= 5 ? (
                  <p className="text-sm text-yellow-600 dark:text-yellow-400">
                    ⚠️ Moderate - Watch out for losing streaks
                  </p>
                ) : (
                  <p className="text-sm text-red-600 dark:text-red-400">
                    ❌ Aggressive - High risk of large loss
                  </p>
                )}
              </div>
            </>
          ) : (
            <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-red-900 dark:text-red-300 mb-2">
                ⚠️ Invalid Configuration
              </h3>
              <p className="text-sm text-red-600 dark:text-red-400">
                {parseFloat(result.capitalNeeded) > parseFloat(bankroll)
                  ? "Le capital requis dépasse ton bankroll. Réduis ton risque ou ajuste tes prix."
                  : "Vérifie que ton stop-loss est cohérent avec ton entry price."}
              </p>
            </div>
          )}

          {/* Guide */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
            <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
              📚 Guide Position Sizing
            </h4>
            <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
              <p>• 1% risk = Ultra conservateur (drawdown minimal)</p>
              <p>• 2% risk = Standard recommandé pour la plupart</p>
              <p>• 3-5% risk = Agressif (expérience requise)</p>
              <p>• 5%+ risk = Très risqué (déconseillé)</p>
            </div>
          </div>

          {/* Example Scenarios */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
            <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
              💡 Impact de Série de Losses
            </h4>
            <div className="text-xs text-gray-600 dark:text-gray-400 space-y-2">
              <div>
                <p className="font-semibold">Avec 2% risk:</p>
                <p>5 pertes consécutives = -9.6% du capital</p>
              </div>
              <div>
                <p className="font-semibold">Avec 5% risk:</p>
                <p>5 pertes consécutives = -22.6% du capital</p>
              </div>
              <div>
                <p className="font-semibold">Avec 10% risk:</p>
                <p>5 pertes consécutives = -41% du capital</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
