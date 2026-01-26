'use client';

import { useState } from 'react';

interface BotConfig {
  minHVSForHold: number;
  minFlipEV: number;
  stopLossPercent: number;
  takeProfitPercent: number;
  maxPositions: number;
  maxPositionSizeEur: number;
  isPaused: boolean;
}

interface ManualControlsProps {
  config: BotConfig;
  onScan: () => Promise<void>;
  onTogglePause: () => Promise<void>;
  onUpdateConfig: (config: Partial<BotConfig>) => Promise<void>;
}

export default function ManualControls({
  config,
  onScan,
  onTogglePause,
  onUpdateConfig,
}: ManualControlsProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [isTogglingPause, setIsTogglingPause] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // États locaux pour les inputs
  const [minHVS, setMinHVS] = useState(config.minHVSForHold);
  const [minFlipEV, setMinFlipEV] = useState(config.minFlipEV);
  const [stopLoss, setStopLoss] = useState(config.stopLossPercent * 100);
  const [takeProfit, setTakeProfit] = useState(config.takeProfitPercent * 100);
  const [maxPositions, setMaxPositions] = useState(config.maxPositions);
  const [maxPositionSize, setMaxPositionSize] = useState(config.maxPositionSizeEur);

  const handleScan = async () => {
    setIsScanning(true);
    try {
      await onScan();
    } finally {
      setIsScanning(false);
    }
  };

  const handleTogglePause = async () => {
    setIsTogglingPause(true);
    try {
      await onTogglePause();
    } finally {
      setIsTogglingPause(false);
    }
  };

  const handleSaveConfig = async () => {
    setIsSaving(true);
    try {
      await onUpdateConfig({
        minHVSForHold: minHVS,
        minFlipEV: minFlipEV,
        stopLossPercent: stopLoss / 100,
        takeProfitPercent: takeProfit / 100,
        maxPositions,
        maxPositionSizeEur: maxPositionSize,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges =
    minHVS !== config.minHVSForHold ||
    minFlipEV !== config.minFlipEV ||
    stopLoss !== config.stopLossPercent * 100 ||
    takeProfit !== config.takeProfitPercent * 100 ||
    maxPositions !== config.maxPositions ||
    maxPositionSize !== config.maxPositionSizeEur;

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h2 className="text-xl font-bold text-white mb-6">⚙️ Contrôles Manuels</h2>

      {/* Actions rapides */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Bouton Scan */}
        <button
          onClick={handleScan}
          disabled={isScanning || config.isPaused}
          className={`flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
            isScanning || config.isPaused
              ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95'
          }`}
        >
          {isScanning ? (
            <>
              <span className="animate-spin">🔄</span>
              Scan en cours...
            </>
          ) : (
            <>
              <span>🔍</span>
              Scanner maintenant
            </>
          )}
        </button>

        {/* Bouton Pause/Resume */}
        <button
          onClick={handleTogglePause}
          disabled={isTogglingPause}
          className={`flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
            config.isPaused
              ? 'bg-green-600 text-white hover:bg-green-700 active:scale-95'
              : 'bg-yellow-600 text-white hover:bg-yellow-700 active:scale-95'
          }`}
        >
          {isTogglingPause ? (
            <>
              <span className="animate-spin">🔄</span>
              Changement...
            </>
          ) : config.isPaused ? (
            <>
              <span>▶️</span>
              Reprendre le bot
            </>
          ) : (
            <>
              <span>⏸️</span>
              Mettre en pause
            </>
          )}
        </button>
      </div>

      {/* Statut */}
      {config.isPaused && (
        <div className="mb-6 p-4 bg-yellow-900/30 border border-yellow-600 rounded-lg">
          <p className="text-yellow-400 text-sm">
            ⚠️ <strong>Bot en pause</strong> - Aucune nouvelle position ne sera ouverte
          </p>
        </div>
      )}

      {/* Réglages avancés */}
      <div className="border-t border-gray-700 pt-6">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2 text-white hover:text-blue-400 transition-colors mb-4"
        >
          <span className={`transform transition-transform ${showAdvanced ? 'rotate-90' : ''}`}>
            ▶
          </span>
          <span className="font-semibold">Réglages avancés</span>
        </button>

        {showAdvanced && (
          <div className="space-y-6">
            {/* Stratégie HOLD */}
            <div className="bg-gray-700 rounded-lg p-4">
              <h3 className="text-white font-semibold mb-3">💎 Stratégie HOLD</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-300 mb-1">
                    HVS Minimum (€)
                  </label>
                  <input
                    type="number"
                    value={minHVS}
                    onChange={(e) => setMinHVS(parseFloat(e.target.value))}
                    step="0.5"
                    className="w-full px-3 py-2 bg-gray-600 text-white rounded border border-gray-500 focus:border-blue-500 focus:outline-none"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Score minimum pour ouvrir une position HOLD
                  </p>
                </div>
              </div>
            </div>

            {/* Stratégie FLIP */}
            <div className="bg-gray-700 rounded-lg p-4">
              <h3 className="text-white font-semibold mb-3">🔄 Stratégie FLIP</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-300 mb-1">
                    FlipEV Minimum (€)
                  </label>
                  <input
                    type="number"
                    value={minFlipEV}
                    onChange={(e) => setMinFlipEV(parseFloat(e.target.value))}
                    step="0.5"
                    className="w-full px-3 py-2 bg-gray-600 text-white rounded border border-gray-500 focus:border-blue-500 focus:outline-none"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    EV minimum pour ouvrir une position FLIP
                  </p>
                </div>
              </div>
            </div>

            {/* Risk Management */}
            <div className="bg-gray-700 rounded-lg p-4">
              <h3 className="text-white font-semibold mb-3">🛡️ Gestion du Risque</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-300 mb-1">
                    Stop-Loss (%)
                  </label>
                  <input
                    type="number"
                    value={stopLoss}
                    onChange={(e) => setStopLoss(parseFloat(e.target.value))}
                    step="1"
                    min="5"
                    max="50"
                    className="w-full px-3 py-2 bg-gray-600 text-white rounded border border-gray-500 focus:border-blue-500 focus:outline-none"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Perte maximale avant sortie automatique
                  </p>
                </div>

                <div>
                  <label className="block text-sm text-gray-300 mb-1">
                    Take-Profit (%)
                  </label>
                  <input
                    type="number"
                    value={takeProfit}
                    onChange={(e) => setTakeProfit(parseFloat(e.target.value))}
                    step="1"
                    min="3"
                    max="50"
                    className="w-full px-3 py-2 bg-gray-600 text-white rounded border border-gray-500 focus:border-blue-500 focus:outline-none"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Gain cible pour sortie automatique (FLIP uniquement)
                  </p>
                </div>
              </div>
            </div>

            {/* Position Sizing */}
            <div className="bg-gray-700 rounded-lg p-4">
              <h3 className="text-white font-semibold mb-3">💰 Taille des Positions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-300 mb-1">
                    Positions Max
                  </label>
                  <input
                    type="number"
                    value={maxPositions}
                    onChange={(e) => setMaxPositions(parseInt(e.target.value))}
                    min="1"
                    max="5"
                    className="w-full px-3 py-2 bg-gray-600 text-white rounded border border-gray-500 focus:border-blue-500 focus:outline-none"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Nombre maximum de positions simultanées
                  </p>
                </div>

                <div>
                  <label className="block text-sm text-gray-300 mb-1">
                    Taille Max par Position (€)
                  </label>
                  <input
                    type="number"
                    value={maxPositionSize}
                    onChange={(e) => setMaxPositionSize(parseFloat(e.target.value))}
                    step="5"
                    min="10"
                    max="150"
                    className="w-full px-3 py-2 bg-gray-600 text-white rounded border border-gray-500 focus:border-blue-500 focus:outline-none"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Capital maximum par trade
                  </p>
                </div>
              </div>
            </div>

            {/* Bouton Sauvegarder */}
            {hasChanges && (
              <button
                onClick={handleSaveConfig}
                disabled={isSaving}
                className={`w-full px-6 py-3 rounded-lg font-semibold transition-all ${
                  isSaving
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700 active:scale-95'
                }`}
              >
                {isSaving ? (
                  <>
                    <span className="animate-spin">🔄</span> Sauvegarde...
                  </>
                ) : (
                  <>💾 Sauvegarder les modifications</>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
