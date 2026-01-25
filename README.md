# 🤖 Polymarket Trading Bot

Bot de trading automatisé pour Polymarket avec dashboard de monitoring en temps réel. Optimisé pour farmer l'airdrop Polymarket tout en générant des profits.

## 📊 Vue d'ensemble

- **Capital initial**: 150€ sur wallet Polygon
- **Stratégie**: Market making intelligent avec décision automatique Hold vs Flip
- **Objectif principal**: Maximiser volume + fréquence de trades (airdrop farming)
- **Objectif secondaire**: Profit target 5-15€/mois
- **Positions simultanées**: Maximum 1-2 marchés actifs

## 🎯 Caractéristiques

### Stratégies de trading automatiques

1. **HOLD Strategy**: Maintenir la position jusqu'à résolution du marché
   - Basée sur le Hold Value Score (HVS)
   - Pour les marchés avec forte conviction

2. **FLIP Strategy**: Market making rapide (acheter/vendre)
   - Basée sur le Flip Expected Value (FlipEV)
   - Maximise le volume pour l'airdrop

3. **SKIP**: Rejeter les opportunités non rentables

### Risk Management

- Position sizing automatique (max 75€ par position)
- Stop-loss à -15%
- Take-profit à +8% (stratégie FLIP uniquement)
- Cooldown de 2h entre trades sur le même marché
- Exposition maximale 90% du capital

### Dashboard temps réel

- PnL total (réalisé + non réalisé)
- Positions actives avec progression stop-loss/take-profit
- Top opportunités avec scores HVS/FlipEV
- Graphique performance 7 jours
- Métriques airdrop (volume, nombre de trades)

## 🏗️ Architecture

```
bot-polymarket/
├── app/
│   ├── page.tsx                    # Dashboard principal
│   ├── api/
│   │   ├── overview/route.ts       # Stats globales
│   │   ├── positions/route.ts      # Positions actives
│   │   ├── history/route.ts        # Historique trades
│   │   ├── opportunities/route.ts  # Top marchés
│   │   └── bot/
│   │       ├── execute/route.ts    # Exécution bot
│   │       └── analyze/route.ts    # Analyse marchés
│   └── layout.tsx
├── components/
│   └── Dashboard/
│       ├── PositionCard.tsx
│       ├── OpportunityCard.tsx
│       ├── StatCard.tsx
│       └── PnLChart.tsx
├── lib/
│   ├── types.ts                    # TypeScript types
│   ├── config.ts                   # Configuration bot
│   ├── supabase.ts                 # Client Supabase
│   ├── calculators/
│   │   ├── hvs-calculator.ts       # Hold Value Score
│   │   └── flip-ev-calculator.ts   # Flip Expected Value
│   └── polymarket/
│       ├── client.ts               # API client (simulation mode)
│       ├── strategy.ts             # Logique décision HOLD/FLIP/SKIP
│       ├── market-selector.ts      # Scanner de marchés
│       └── risk-manager.ts         # Gestion des risques
├── supabase/
│   ├── migrations/
│   │   ├── 001_trades.sql
│   │   ├── 002_positions.sql
│   │   ├── 003_market_scan.sql
│   │   └── 004_bot_config.sql
│   └── functions/
│       └── bot-execute/index.ts    # Cron function
└── README.md
```

## 📐 Formules décisionnelles

### 1. Hold Value Score (HVS)

Détermine si tenir une position jusqu'à résolution est profitable.

```typescript
HVS = (Expected Profit × Win Probability)
    - (Max Loss × Loss Probability)
    - (Opportunity Cost)
    - (Long Term Penalty)
```

**Exemple**:
```
Entry: 0.43 YES
Size: 75€
Win Probability: 0.55
Days: 65

→ HVS = -4.50€ (PAS rentable de hold)
```

### 2. Flip Expected Value (FlipEV)

Calcule le profit attendu en faisant du market making.

```typescript
FlipEV = (Profit per Flip) × (Total Flips)

Où:
- Profit per Flip = Spread × Position Size × Fill Probability
- Total Flips = Flips per Week × Weeks Available
```

**Exemple**:
```
Spread: 4%
Size: 75€
Fill Probability: 0.70
Flips/Week: 2
Days: 65

→ FlipEV = 37.80€ (Très rentable de flip!)
```

### 3. Décision finale

```typescript
if (HVS >= 5€ AND HVS > FlipEV × 1.3)
  → HOLD

else if (FlipEV >= 3€ AND Spread >= 3% AND Days >= 3)
  → FLIP

else
  → SKIP
```

## 🚀 Installation

### 1. Prérequis

- Node.js 18+
- Compte Supabase
- Wallet Polygon avec 150€
- (Optionnel) Clé API Polymarket

### 2. Cloner le projet

```bash
git clone <repo-url>
cd bot-polymarket
npm install
```

### 3. Configuration Supabase

1. Créer un nouveau projet sur [supabase.com](https://supabase.com)
2. Exécuter les migrations SQL dans l'ordre:
   - `supabase/migrations/001_trades.sql`
   - `supabase/migrations/002_positions.sql`
   - `supabase/migrations/003_market_scan.sql`
   - `supabase/migrations/004_bot_config.sql`

3. Configurer le cron job (Supabase Dashboard → Database → Cron Jobs):
   ```
   Schedule: 0 */4 * * *  (toutes les 4 heures)
   Function: bot-execute
   ```

### 4. Variables d'environnement

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Wallet Polygon (STOCKER DANS SUPABASE VAULT EN PRODUCTION!)
WALLET_PRIVATE_KEY=0x...

# Polymarket
POLYMARKET_API_KEY=xxx
POLYMARKET_CLOB_URL=https://clob.polymarket.com

# Mode (TOUJOURS démarrer en simulation!)
SIMULATION_MODE=true
```

### 5. Démarrer le projet

```bash
# Mode développement
npm run dev

# Build production
npm run build
npm start
```

Dashboard accessible sur: `http://localhost:3000`

## 🎮 Mode Simulation

**CRITICAL**: Le bot démarre TOUJOURS en mode simulation par défaut.

### En mode simulation

- ✅ Toutes les analyses fonctionnent (HVS, FlipEV, scanning)
- ✅ Positions sont enregistrées en DB
- ✅ Dashboard affiche les données
- ❌ AUCUN ordre réel placé sur Polymarket
- ❌ AUCUNE transaction blockchain

### Logs simulation

```
🎮 [SIMULATION] Would place order:
   Market: Will Apple announce AR glasses...
   Side: YES
   Price: 0.38
   Size: 75€

Order ID: sim-1738000920123
TX Hash: 0xsimulated8a7f2b3
```

## 🔴 Passer en mode REAL (DANGER)

### Safety checklist OBLIGATOIRE

Avant de passer `SIMULATION_MODE=false`:

1. [ ] Tester le bot en simulation pendant au moins 7 jours
2. [ ] Vérifier que les formules HVS/FlipEV donnent des résultats cohérents
3. [ ] Confirmer que le risk management fonctionne (stop-loss, take-profit)
4. [ ] Wallet Polygon contient exactement 150€ (pas plus!)
5. [ ] Private key stockée dans Supabase Vault (PAS .env.local!)
6. [ ] Commencer avec `maxPositions: 1` au lieu de 2
7. [ ] Monitorer la première position manuellement

### Activation mode réel

```bash
# Dans .env
SIMULATION_MODE=false
```

### Surveillance post-activation

- Vérifier le dashboard toutes les 4 heures (à chaque exécution cron)
- Surveiller les transactions Polygon: https://polygonscan.com
- Vérifier solde wallet régulièrement
- Si problème: `SIMULATION_MODE=true` immédiatement

## 📊 Utilisation

### Déclencher une analyse manuelle

```bash
curl -X POST http://localhost:3000/api/bot/analyze
```

### Déclencher une exécution manuelle

```bash
curl -X POST http://localhost:3000/api/bot/execute
```

### Voir les positions actives

```
GET /api/positions
```

### Voir l'historique

```
GET /api/history?limit=50
```

## 🧪 Tester les calculateurs

Les calculateurs incluent des tests intégrés:

```bash
# Tester HVS Calculator
ts-node lib/calculators/hvs-calculator.ts

# Tester FlipEV Calculator
ts-node lib/calculators/flip-ev-calculator.ts
```

Output attendu:
```
🧮 Testing HVS Calculator

Example 1 (Should be unprofitable):
  Entry: 0.43, Size: 75€, Win Prob: 0.55, Days: 65
  → HVS: -4.50€
  → Recommendation: SKIP/FLIP ❌

Example 2 (Should be profitable):
  Entry: 0.25, Size: 75€, Win Prob: 0.70, Days: 20
  → HVS: 28.75€
  → Recommendation: HOLD ✅
```

## ⚙️ Configuration avancée

Tous les paramètres sont dans `lib/config.ts`:

```typescript
export const BOT_CONFIG = {
  // Capital & positions
  totalCapitalEur: 150,
  maxPositions: 2,
  maxPositionSizeEur: 75,
  maxTotalExposure: 0.90,

  // Thresholds
  minHVSForHold: 5,        // € minimum pour HOLD
  minFlipEV: 3,            // € minimum pour FLIP

  // Risk management
  stopLossPercent: 0.15,   // 15%
  takeProfitPercent: 0.08, // 8%
  cooldownMinutes: 120,    // 2h

  // Market filters
  marketFilters: {
    minLiquidityUsd: 10000,
    minSpread: 0.03,
    maxSpread: 0.15,
    minDaysUntilResolution: 2,
    maxDaysUntilResolution: 90,
    excludeCategories: ['crypto', 'sports'],
    preferCategories: ['politics', 'entertainment', 'tech']
  }
};
```

## 📈 Exemple de workflow complet

1. **Cron se déclenche** (toutes les 4h)
   ```
   [12:00] Bot execution started
   [12:00] Active positions: 1/2
   ```

2. **Monitoring positions**
   ```
   Position #1: "Apple VR headset"
   Entry: 0.38, Current: 0.42 (+10.5%)
   Take-profit: 0.410 ✅ TRIGGERED
   → Closing position... PnL: +7.88€
   ```

3. **Scan marchés**
   ```
   [12:01] Fetching top 100 markets...
   [12:01] Found 23 viable markets
   ```

4. **Analyse top opportunité**
   ```
   Market: "Will Apple announce VR headset..."
   Entry: 0.38 YES
   Spread: 5.2%
   HVS: 3.2€ ❌
   FlipEV: 18.5€ ✅
   → RECOMMENDATION: FLIP
   ```

5. **Risk checks**
   ```
   ✅ Active positions: 1 < 2
   ✅ Total exposure: 75€ < 135€
   ✅ No cooldown active
   ```

6. **Placement ordre**
   ```
   [SIMULATION] Placing order:
   Market: "Apple VR headset"
   Side: YES, Price: 0.38, Size: 75€
   Stop-loss: 0.323, Take-profit: 0.410

   ✅ Position opened
   ```

## 🔒 Sécurité

### CRITICAL: Private Key

**JAMAIS** commit la private key dans git:

```bash
# .gitignore contient déjà:
.env
```

En production, stocker dans Supabase Vault:
```sql
-- Supabase Dashboard → Settings → Vault
INSERT INTO vault.secrets (name, secret)
VALUES ('wallet_private_key', '0x...');
```

### Mode simulation par défaut

Le bot refuse de démarrer en mode réel sans confirmation explicite:

```typescript
if (this.simulationMode) {
  console.log('🎮 [POLYMARKET] Running in SIMULATION mode');
} else {
  console.log('⚠️  [POLYMARKET] Running in REAL TRADING mode');
}
```

## 🐛 Troubleshooting

### Le bot ne trouve aucune opportunité

- Vérifier `marketFilters` dans `config.ts` (peut-être trop restrictifs)
- En mode simulation, seulement 6 marchés mockés disponibles
- Vérifier les logs: `npm run dev` et regarder console

### Erreur "Max positions reached"

- Normal si 2 positions actives
- Attendre qu'une position se ferme (stop-loss ou take-profit)
- Ou fermer manuellement une position dans Supabase

### Dashboard affiche "No data"

- Lancer une analyse: `POST /api/bot/analyze`
- Vérifier connexion Supabase (clés dans `.env.local`)
- Vérifier migrations SQL exécutées

### Calculs HVS/FlipEV semblent incorrects

- Tester les calculateurs: `ts-node lib/calculators/hvs-calculator.ts`
- Vérifier paramètres dans `config.ts`
- Comparer avec exemples dans cette doc

## 🚧 Améliorations futures (hors scope v1)

- [ ] WebSocket Polymarket pour prix temps réel
- [ ] Multi-wallet support (diversifier airdrop)
- [ ] Machine learning pour win probability
- [ ] Auto-rebalance entre marchés corrélés
- [ ] Telegram alerts
- [ ] Backtesting historique

## 📝 License

MIT

## ⚠️ Disclaimer

Ce bot est fourni à titre éducatif. Trading de marchés prédictifs comporte des risques. Utilisez à vos propres risques. Toujours démarrer en mode SIMULATION.
