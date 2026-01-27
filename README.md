# 🤖 Polymarket Trading Bot

Bot de trading automatisé pour Polymarket avec dashboard de monitoring en temps réel. Authentification sécurisée par wallet et interface PWA mobile-friendly.

![Dashboard](https://img.shields.io/badge/Status-Production%20Ready-brightgreen) ![Mode](https://img.shields.io/badge/Mode-Simulation-blue) ![Security](https://img.shields.io/badge/Auth-Wallet%20Signature-orange)

## 📊 Vue d'ensemble

- **Authentification**: Signature cryptographique avec votre wallet Polygon (aucun mot de passe)
- **Capital**: Gérez votre capital de trading sur Polygon
- **Stratégie**: Market making intelligent (HOLD vs FLIP)
- **Dashboard**: Interface web temps réel avec dark mode
- **Mobile**: PWA installable, fonctionne hors ligne

---

## 🚀 Installation Rapide (5 minutes)

### 1️⃣ Cloner et installer

```bash
git clone https://github.com/votre-repo/bot-polymarket
cd bot-polymarket
npm install
```

### 2️⃣ Configurer Supabase

1. Créer un compte sur [supabase.com](https://supabase.com)
2. Créer un nouveau projet
3. Dans **SQL Editor**, exécuter les migrations dans l'ordre:
   - `supabase/migrations/001_trades.sql`
   - `supabase/migrations/002_positions.sql`
   - `supabase/migrations/003_market_scan.sql`
   - `supabase/migrations/004_bot_config.sql`

### 3️⃣ Variables d'environnement

Créer `.env.local`:

```bash
# Supabase (obligatoire)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Wallet autorisé (votre adresse Polygon)
AUTHORIZED_WALLET_ADDRESS=0x...

# Mode simulation (recommandé au début)
SIMULATION_MODE=true

# WebSocket Railway (optionnel)
NEXT_PUBLIC_WEBSOCKET_URL=wss://your-service.railway.app

# Telegram (optionnel)
TELEGRAM_BOT_TOKEN=123456:ABC...
TELEGRAM_CHAT_ID=123456789
```

### 4️⃣ Démarrer

```bash
npm run dev
```

Ouvrir **http://localhost:3000/login** et connecter votre wallet!

---

## 🔐 Authentification par Wallet

### Comment ça marche

1. **Pas de mot de passe** - Utilisez votre wallet Polygon (MetaMask, Rabby, etc.)
2. **Signature cryptographique** - Vous signez un message pour prouver que vous possédez le wallet
3. **Aucun gas fee** - Signature hors-chaîne, aucune transaction blockchain
4. **Session 24h** - Reste connecté pendant 24 heures

### Première connexion

1. Aller sur `/login`
2. Cliquer "Connect Wallet"
3. Signer le message dans votre wallet
4. Accès au dashboard si vous êtes le wallet autorisé

### Sécurité

- ✅ Seul le wallet dans `AUTHORIZED_WALLET_ADDRESS` peut se connecter
- ✅ Session sécurisée avec cookies HttpOnly
- ✅ Protection CSRF avec nonce unique
- ✅ Vérification de signature côté serveur (viem)

---

## 📱 Déploiement

### Option 1: Vercel (Recommandé)

```bash
# Installer Vercel CLI
npm i -g vercel

# Se connecter
vercel login

# Déployer
vercel --prod

# Configurer les variables d'environnement
# Vercel Dashboard → Settings → Environment Variables
```

**Important**: Ajouter toutes les variables de `.env.local` dans Vercel.

### Option 2: Railway (WebSocket inclus)

Railway est recommandé si vous voulez le service WebSocket.

```bash
# Installer Railway CLI
npm i -g @railway/cli

# Se connecter
railway login

# Déployer
railway up

# Configurer les variables
# Railway Dashboard → Variables
```

### Configuration du WebSocket (Railway)

Le WebSocket permet le monitoring temps réel des positions:

1. **Créer un nouveau service Railway** pour le WebSocket:
   ```bash
   cd websocket-service
   railway up
   ```

2. **Récupérer l'URL**:
   ```
   wss://your-service.railway.app
   ```

3. **Ajouter à `.env.local`**:
   ```bash
   NEXT_PUBLIC_WEBSOCKET_URL=wss://your-service.railway.app
   ```

---

## 🤖 Configuration Telegram (Optionnel)

Recevez des notifications sur vos trades!

### 1. Créer un bot Telegram

1. Parler à [@BotFather](https://t.me/botfather)
2. Envoyer `/newbot`
3. Suivre les instructions
4. Récupérer le **token**

### 2. Obtenir votre Chat ID

1. Parler à [@userinfobot](https://t.me/userinfobot)
2. Récupérer votre **ID**

### 3. Configurer

```bash
TELEGRAM_BOT_TOKEN=123456:ABC-def1234ghIkl-zyx57W2v1u123ew11
TELEGRAM_CHAT_ID=123456789
```

### 4. Tester

```bash
curl -X POST http://localhost:3000/api/telegram/test
```

Vous devriez recevoir un message "Bot Telegram configuré ✅"!

---

## 🎯 Fonctionnalités

### Dashboard

- **Stats globales**: PnL total, positions actives, win rate, volume
- **Positions actives**: Prix entry/current, PnL, stop-loss/take-profit
- **Opportunités**: Top 5 marchés analysés avec scores
- **Graphiques**: Performance 7/30 jours
- **Dark mode**: Toggle automatique

### Stratégies de trading

**HOLD Strategy**: Maintenir jusqu'à résolution
- Score: Hold Value Score (HVS)
- Pour marchés avec forte conviction

**FLIP Strategy**: Market making rapide
- Score: Flip Expected Value (FlipEV)
- Maximise le volume (airdrop farming)

**SKIP**: Rejeter les opportunités non rentables

### Risk Management

- Position max: 75€ par position
- Stop-loss: -15%
- Take-profit: +8% (FLIP)
- Cooldown: 2h entre trades
- Exposition max: 90% du capital

---

## 🎮 Mode Simulation vs Réel

### Mode Simulation (par défaut)

```bash
SIMULATION_MODE=true
```

- ✅ Toutes les analyses fonctionnent
- ✅ Dashboard pleinement fonctionnel
- ✅ Positions enregistrées en DB
- ❌ **AUCUN ordre réel** sur Polymarket
- ❌ **AUCUNE transaction** blockchain

**Parfait pour**: Tester le bot sans risque

### Mode Réel (DANGER)

```bash
SIMULATION_MODE=false
```

⚠️ **Checklist obligatoire avant activation**:

- [ ] Testé en simulation pendant 7+ jours
- [ ] Formules HVS/FlipEV validées
- [ ] Risk management vérifié
- [ ] Wallet Polygon avec capital exact
- [ ] Private key stockée de manière sécurisée
- [ ] Monitoring actif prévu

---

## 📐 Calculateurs

### Hold Value Score (HVS)

Détermine si tenir une position est rentable:

```
HVS = (Expected Profit × Win Probability)
    - (Max Loss × Loss Probability)
    - (Opportunity Cost)
    - (Long Term Penalty)
```

**Seuil**: HVS > 5€ → HOLD recommandé

### Flip Expected Value (FlipEV)

Calcule le profit attendu en market making:

```
FlipEV = (Spread × Size × Fill Probability) × (Flips/Week × Weeks)
```

**Seuil**: FlipEV > 3€ → FLIP recommandé

### Tester les calculateurs

```bash
npm run test:calculators
```

---

## 🏗️ Architecture

```
bot-polymarket/
├── app/
│   ├── page.tsx                    # Dashboard principal
│   ├── login/page.tsx              # Authentification wallet
│   ├── bot-config/page.tsx         # Configuration bot
│   ├── calculators/page.tsx        # Outils de calcul
│   └── api/
│       ├── auth/wallet/route.ts    # Auth signature
│       ├── overview/route.ts       # Stats globales
│       ├── positions/route.ts      # Positions actives
│       ├── history/route.ts        # Historique
│       ├── opportunities/route.ts  # Top marchés
│       └── bot/
│           ├── execute/route.ts    # Exécution bot
│           ├── scan/route.ts       # Scan marchés
│           └── config/route.ts     # Config dynamique
├── components/
│   └── Dashboard/
│       ├── PositionCard.tsx
│       ├── OpportunityCard.tsx
│       ├── StatCard.tsx
│       └── PnLChart.tsx
├── lib/
│   ├── auth.ts                     # Gestion auth
│   ├── crypto-auth.ts              # Signature vérification
│   ├── supabase.ts                 # Client DB
│   ├── calculators/
│   │   ├── hvs-calculator.ts       # HVS
│   │   └── flip-ev-calculator.ts   # FlipEV
│   └── polymarket/
│       ├── client.ts               # API wrapper
│       ├── strategy.ts             # Décisions
│       ├── market-selector.ts      # Filtres
│       └── risk-manager.ts         # Risk management
└── supabase/
    └── migrations/                 # SQL migrations
```

---

## 🔧 Configuration Avancée

### Paramètres du bot

Fichier `lib/config.ts`:

```typescript
export const BOT_CONFIG = {
  // Capital & positions
  totalCapitalEur: 150,
  maxPositions: 2,
  maxPositionSizeEur: 75,
  maxTotalExposure: 0.90,

  // Thresholds décision
  minHVSForHold: 5,        // € minimum pour HOLD
  minFlipEV: 3,            // € minimum pour FLIP

  // Risk management
  stopLossPercent: 0.15,   // 15%
  takeProfitPercent: 0.08, // 8%
  cooldownMinutes: 120,    // 2h

  // Filtres marchés
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

### Base de données (Supabase)

**Tables créées**:
- `trades` - Historique complet des trades
- `positions` - Positions actives
- `market_scan` - Résultats des scans
- `bot_config` - Configuration dynamique

**Accès**: Supabase Dashboard → Table Editor

---

## 🐛 Troubleshooting

### Erreur "Invalid signature"

**Cause**: Message signé différent de celui vérifié

**Solution**:
1. Vider le cache du navigateur
2. Tester en mode incognito
3. Vérifier que `AUTHORIZED_WALLET_ADDRESS` correspond à votre wallet

### Dashboard affiche "Unauthorized"

**Cause**: Vous n'êtes pas connecté ou session expirée

**Solution**:
1. Aller sur `/login`
2. Reconnecter votre wallet
3. Vérifier `AUTHORIZED_WALLET_ADDRESS` dans `.env.local`

### WebSocket déconnecté

**Cause**: Service Railway non déployé ou URL incorrecte

**Solution**:
1. Vérifier `NEXT_PUBLIC_WEBSOCKET_URL` dans `.env.local`
2. Vérifier que le service Railway est actif
3. Tester l'URL: `wscat -c wss://your-service.railway.app`

### "No opportunities found"

**Cause**: Mode simulation utilise marchés mockés

**Solution**: Normal en simulation (6 marchés test uniquement)

### Telegram ne reçoit rien

**Cause**: Token ou Chat ID incorrect

**Solution**:
1. Vérifier le token avec BotFather
2. Vérifier le Chat ID avec userinfobot
3. Tester: `POST /api/telegram/test`

---

## 📊 API Endpoints

### Publics (nécessitent authentification)

```bash
# Stats globales
GET /api/overview

# Positions actives
GET /api/positions

# Historique des trades
GET /api/history?limit=50

# Top opportunités
GET /api/opportunities

# Configuration bot
GET /api/bot/config
POST /api/bot/config
```

### Protégés (admin)

```bash
# Scan marchés
POST /api/bot/scan

# Analyse marchés
POST /api/bot/analyze

# Exécuter bot
POST /api/bot/execute

# Fermer position
POST /api/positions/[id]/close
```

---

## 🚦 Commandes Utiles

```bash
# Développement
npm run dev                  # Démarrer dev server

# Tests
npm run test:calculators     # Tester HVS & FlipEV

# Production
npm run build                # Build production
npm start                    # Démarrer en production

# Déploiement
vercel --prod                # Déployer sur Vercel
railway up                   # Déployer sur Railway
```

---

## 🔒 Sécurité

### ✅ Protections en place

- **Authentification wallet** - Signature cryptographique SIWE
- **Session sécurisée** - Cookies HttpOnly, 24h expiration
- **Middleware protection** - Toutes les routes protégées sauf `/login`
- **Variables sensibles** - Jamais committées (`.gitignore`)
- **Mode simulation** - Par défaut, aucun ordre réel
- **Rate limiting** - Cooldown entre trades

### ⚠️ Bonnes pratiques

1. **Jamais commit** les private keys
2. **Utiliser** le mode simulation d'abord
3. **Tester** pendant 7+ jours avant mode réel
4. **Monitorer** activement les premières semaines
5. **Backup** Supabase régulièrement

---

## 📚 Ressources

- [Polymarket Docs](https://docs.polymarket.com)
- [Supabase Docs](https://supabase.com/docs)
- [Vercel Docs](https://vercel.com/docs)
- [Railway Docs](https://docs.railway.app)
- [Next.js Docs](https://nextjs.org/docs)
- [Viem Docs](https://viem.sh)

---

## 📝 License

MIT

---

## ⚠️ Disclaimer

Ce bot est fourni à titre éducatif. Le trading de marchés prédictifs comporte des risques. Utilisez à vos propres risques. Toujours démarrer en mode SIMULATION.

---

## 🎉 Support

Des questions? Ouvrez une issue sur GitHub!

**Happy Trading! 🚀**
