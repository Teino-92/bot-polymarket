'use client';

import { useState } from 'react';

export default function FlipBreakevenCalculator() {
  const [buyPrice, setBuyPrice] = useState<string>('0.40');
  const [positionSize, setPositionSize] = useState<string>('100');
  const [side, setSide] = useState<'YES' | 'NO'>('YES');
  const [targetProfit, setTargetProfit] = useState<string>('10');

  const calculate = () => {
    const buy = parseFloat(buyPrice);
    const size = parseFloat(positionSize);
    const profit = parseFloat(targetProfit);

    // Cost total
    const totalCost = buy * size;

    // To break even after flip
    let breakevenPrice: number;
    let targetProfitPrice: number;

    if (side === 'YES') {
      // Si j'achète YES à 0.40 et flip vers NO
      // Je dois vendre NO à un prix où je récupère mon investissement
      // Cost = 0.40 * 100 = 40€
      // Pour breakeven sur NO: sell_price * 100 = 40€ => sell_price = 0.40
      // Donc breakeven_no = 1 - buy_yes = 0.60
      breakevenPrice = 1 - buy;

      // Pour profit target
      targetProfitPrice = 1 - buy - (profit / size);
    } else {
      // Si j'achète NO à 0.60 et flip vers YES
      breakevenPrice = 1 - buy;
      targetProfitPrice = 1 - buy + (profit / size);
    }

    // Prix minimum/maximum acceptable
    const minAcceptablePrice = side === 'YES' ? breakevenPrice : 0;
    const maxAcceptablePrice = side === 'YES' ? 1 : breakevenPrice;

    return {
      totalCost: totalCost.toFixed(2),
      breakevenPrice: breakevenPrice.toFixed(3),
      targetProfitPrice: targetProfitPrice.toFixed(3),
      minAcceptablePrice: minAcceptablePrice.toFixed(3),
      maxAcceptablePrice: maxAcceptablePrice.toFixed(3),
      isValidTarget: side === 'YES'
        ? targetProfitPrice >= 0 && targetProfitPrice <= 1
        : targetProfitPrice >= 0 && targetProfitPrice <= 1,
    };
  };

  const result = calculate();

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 sm:p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          🔄 Flip Breakeven Calculator
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Calcule à quel prix tu dois vendre après un flip pour être breakeven ou profitable.
          <br />
          <span className="text-xs text-purple-600 dark:text-purple-400">
            💡 FLIP Strategy: Acheter un côté puis revendre l'autre côté quand les odds changent
          </span>
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Inputs */}
        <div className="space-y-4">
          {/* Side Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Initial Side Bought
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
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              The side you bought initially
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Initial Purchase Price
            </label>
            <input
              type="number"
              value={buyPrice}
              onChange={(e) => setBuyPrice(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0.40"
              min="0"
              max="1"
              step="0.01"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Price at which you bought {side}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Taille de Position (€)
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
              Amount initially invested
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Target Profit (€)
            </label>
            <input
              type="number"
              value={targetProfit}
              onChange={(e) => setTargetProfit(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="10"
              min="0"
              step="1"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Profit you want to make on the flip
            </p>
          </div>

          {/* Example Scenario */}
          <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-3">
            <h4 className="text-xs font-semibold text-purple-900 dark:text-purple-300 mb-2">
              📖 Scenario
            </h4>
            <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
              <p>1️⃣ Tu achètes <span className="font-semibold">{side}</span> à <span className="font-semibold">{buyPrice}</span></p>
              <p>2️⃣ Les odds changent en ta faveur</p>
              <p>3️⃣ Tu veux flip vers <span className="font-semibold">{side === 'YES' ? 'NO' : 'YES'}</span></p>
              <p>4️⃣ À quel prix vendre pour être profitable?</p>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-3">
              📊 Prix de Vente (côté {side === 'YES' ? 'NO' : 'YES'})
            </h3>

            <div className="space-y-4">
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Initial Total Cost</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {result.totalCost}€
                </p>
              </div>

              <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                  Breakeven Price 💰
                </p>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {result.breakevenPrice}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  Vends {side === 'YES' ? 'NO' : 'YES'} à ce prix pour récupérer ton investissement
                </p>
              </div>

              {result.isValidTarget && (
                <div className="pt-3 border-t border-gray-200 dark:border-gray-700 bg-green-50 dark:bg-green-900/20 -mx-4 px-4 pb-4 rounded-b-lg">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                    Price for {targetProfit}€ profit 🎯
                  </p>
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                    {result.targetProfitPrice}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    Vends {side === 'YES' ? 'NO' : 'YES'} à ce prix ou mieux
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Trading Range */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
            <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-3">
              📈 Trading Zone
            </h4>

            <div className="space-y-3">
              <div className="relative h-8 bg-gradient-to-r from-red-200 via-yellow-200 to-green-200 dark:from-red-900 dark:via-yellow-900 dark:to-green-900 rounded">
                {/* Breakeven marker */}
                <div
                  className="absolute top-0 bottom-0 w-1 bg-blue-600"
                  style={{ left: `${parseFloat(result.breakevenPrice) * 100}%` }}
                >
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-semibold text-blue-600 dark:text-blue-400 whitespace-nowrap">
                    {result.breakevenPrice}
                  </div>
                  <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-blue-600 dark:text-blue-400">
                    BE
                  </div>
                </div>

                {/* Target profit marker */}
                {result.isValidTarget && (
                  <div
                    className="absolute top-0 bottom-0 w-1 bg-green-600"
                    style={{ left: `${Math.max(0, Math.min(100, parseFloat(result.targetProfitPrice) * 100))}%` }}
                  >
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-semibold text-green-600 dark:text-green-400 whitespace-nowrap">
                      {result.targetProfitPrice}
                    </div>
                    <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-green-600 dark:text-green-400">
                      TARGET
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mt-8">
                <span>0.00</span>
                <span>0.50</span>
                <span>1.00</span>
              </div>

              <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1 pt-2 border-t border-gray-200 dark:border-gray-700">
                <p className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-red-400"></span>
                  Zone rouge = Perte
                </p>
                <p className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-yellow-400"></span>
                  Zone jaune = Faible profit
                </p>
                <p className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-green-400"></span>
                  Zone verte = Bon profit
                </p>
              </div>
            </div>
          </div>

          {/* Example Trades */}
          <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
            <h4 className="text-xs font-semibold text-purple-900 dark:text-purple-300 mb-2">
              💡 Exemples de Flip
            </h4>
            <div className="text-xs text-gray-600 dark:text-gray-400 space-y-2">
              <div className="flex justify-between items-center py-1 border-b border-purple-200 dark:border-purple-700">
                <span>Vente à {result.breakevenPrice}</span>
                <span className="font-semibold text-gray-900 dark:text-white">0.00€</span>
              </div>
              {side === 'YES' ? (
                <>
                  <div className="flex justify-between items-center py-1 border-b border-purple-200 dark:border-purple-700">
                    <span>Vente à {(parseFloat(result.breakevenPrice) + 0.05).toFixed(3)}</span>
                    <span className="font-semibold text-green-600 dark:text-green-400">
                      +{(parseFloat(positionSize) * 0.05).toFixed(2)}€
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span>Vente à {(parseFloat(result.breakevenPrice) + 0.10).toFixed(3)}</span>
                    <span className="font-semibold text-green-600 dark:text-green-400">
                      +{(parseFloat(positionSize) * 0.10).toFixed(2)}€
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between items-center py-1 border-b border-purple-200 dark:border-purple-700">
                    <span>Vente à {(parseFloat(result.breakevenPrice) - 0.05).toFixed(3)}</span>
                    <span className="font-semibold text-green-600 dark:text-green-400">
                      +{(parseFloat(positionSize) * 0.05).toFixed(2)}€
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span>Vente à {(parseFloat(result.breakevenPrice) - 0.10).toFixed(3)}</span>
                    <span className="font-semibold text-green-600 dark:text-green-400">
                      +{(parseFloat(positionSize) * 0.10).toFixed(2)}€
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
