# 🚀 Guide de Setup Rapide

## Étapes de configuration

### 1. Configuration Supabase (OBLIGATOIRE)

#### A. Créer un projet Supabase

1. Aller sur [supabase.com](https://supabase.com)
2. Créer un nouveau projet
3. Noter les credentials:
   - Project URL: `https://xxx.supabase.co`
   - Anon Key: `eyJ...`
   - Service Role Key: `eyJ...`

#### B. Exécuter les migrations

Dans le dashboard Supabase → SQL Editor, exécuter dans l'ordre:

```sql
-- 1. Copier/coller le contenu de supabase/migrations/001_trades.sql
-- 2. Copier/coller le contenu de supabase/migrations/002_positions.sql
-- 3. Copier/coller le contenu de supabase/migrations/003_market_scan.sql
-- 4. Copier/coller le contenu de supabase/migrations/004_bot_config.sql
```

#### C. Configurer le Cron Job (optionnel pour démarrer)

Supabase Dashboard → Database → Cron Jobs → Create a new cron job:

```
Name: bot-execute
Schedule: 0 */4 * * *
Function: bot-execute
```

### 2. Variables d'environnement

Créer le fichier `.env.local`:

```bash
# Copier depuis .env.local.example
cp .env.local.example .env.local
```

Éditer `.env.local` avec vos vraies valeurs:

```env
# Supabase (OBLIGATOIRE)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxxxx
SUPABASE_SERVICE_ROLE_KEY=eyJxxxxx

# Wallet Polygon (PAS OBLIGATOIRE en mode simulation)
WALLET_PRIVATE_KEY=0x...

# Polymarket (PAS OBLIGATOIRE en mode simulation)
POLYMARKET_API_KEY=xxx
POLYMARKET_CLOB_URL=https://clob.polymarket.com

# Mode (TOUJOURS true au départ)
SIMULATION_MODE=true
```

### 3. Démarrer le projet

```bash
# Installer les dépendances
npm install

# Démarrer en mode dev
npm run dev
```

Ouvrir http://localhost:3000

## 🧪 Tester le bot (Mode Simulation)

### Test 1: Vérifier les calculateurs

```bash
# Tester HVS
npx ts-node lib/calculators/hvs-calculator.ts

# Tester FlipEV
npx ts-node lib/calculators/flip-ev-calculator.ts
```

Output attendu:
```
🧮 Testing HVS Calculator

Example 1 (Should be unprofitable):
  Entry: 0.43, Size: 75€, Win Prob: 0.55, Days: 65
  → HVS: -4.50€
  → Recommendation: SKIP/FLIP ❌
```

### Test 2: Analyser les marchés

```bash
# Via API
curl -X POST http://localhost:3000/api/bot/analyze
```

Expected response:
```json
{
  "success": true,
  "scanned": 6,
  "topOpportunity": {
    "marketName": "Will Apple announce AR glasses...",
    "action": "FLIP",
    "flipEV": 18.5,
    "hvs": 3.2
  }
}
```

### Test 3: Exécuter le bot (simulation)

```bash
curl -X POST http://localhost:3000/api/bot/execute
```

Expected response:
```json
{
  "status": "position_opened",
  "market": "Will Apple announce AR glasses...",
  "strategy": "FLIP",
  "size": 75,
  "txHash": "0xsimulated..."
}
```

### Test 4: Vérifier le dashboard

1. Ouvrir http://localhost:3000
2. Vérifier que les positions s'affichent
3. Vérifier que les opportunités sont listées

## ✅ Checklist avant déploiement production

### En mode simulation (testing)

- [ ] Variables Supabase configurées
- [ ] Migrations SQL exécutées
- [ ] Dashboard accessible et fonctionnel
- [ ] Test API `/bot/analyze` réussi
- [ ] Test API `/bot/execute` réussi
- [ ] Positions créées visibles dans Supabase
- [ ] Calculateurs HVS/FlipEV testés

### Avant mode REAL (DANGER)

- [ ] Testé en simulation pendant 7+ jours
- [ ] Formules HVS/FlipEV vérifiées
- [ ] Risk management validé (stop-loss fonctionne)
- [ ] Wallet Polygon avec exactement 150€
- [ ] Private key dans Supabase Vault (PAS .env!)
- [ ] Commencer avec `maxPositions: 1`
- [ ] Plan de monitoring actif

## 🐛 Problèmes courants

### "Failed to fetch from Supabase"

**Cause**: Variables d'environnement incorrectes

**Solution**:
```bash
# Vérifier .env.local
cat .env.local

# Vérifier que les clés sont correctes dans Supabase Dashboard
# Settings → API
```

### "No opportunities found"

**Cause**: Mode simulation utilise seulement 6 marchés mockés

**Solution**: Normal en simulation. Les filtres peuvent éliminer certains marchés.

```typescript
// Ajuster les filtres dans lib/config.ts si nécessaire
marketFilters: {
  minLiquidityUsd: 5000,  // Réduire de 10000 à 5000
  minSpread: 0.02,        // Réduire de 0.03 à 0.02
  // ...
}
```

### Dashboard affiche "No data"

**Cause**: Aucune position créée encore

**Solution**:
```bash
# Exécuter le bot une fois
curl -X POST http://localhost:3000/api/bot/execute

# Rafraîchir le dashboard
```

### Erreur TypeScript "Cannot find module"

**Cause**: Import paths incorrects

**Solution**:
```bash
# Vérifier tsconfig.json
cat tsconfig.json

# S'assurer que paths est configuré:
"paths": {
  "@/*": ["./*"]
}
```

## 📊 Données de test (Simulation)

En mode simulation, le bot utilise 6 marchés mockés:

1. **Apple AR glasses** (Tech)
   - Spread: 5.2% ✅
   - Liquidity: $45k ✅
   - Days: 120
   - → **FLIP** (FlipEV: ~18€)

2. **France Eurovision** (Entertainment)
   - Spread: 2.0% ⚠️
   - Liquidity: $28k ✅
   - Days: 85
   - → **SKIP** (Spread trop serré)

3. **Bitcoin $150k** (Crypto)
   - Category: crypto ❌
   - → **SKIP** (Catégorie exclue)

4. **Tesla $300** (Business)
   - Spread: 6.0% ✅
   - Liquidity: $67k ✅
   - Days: 45
   - → **FLIP** (FlipEV: ~15€)

5. **Virginia Election** (Politics)
   - Spread: 4.0% ✅
   - Liquidity: $89k ✅
   - Days: 95
   - → **FLIP** (FlipEV: ~28€)

6. **GPT-5 Release** (Tech)
   - Spread: 5.0% ✅
   - Liquidity: $112k ✅
   - Days: 155
   - → **FLIP** (FlipEV: ~42€) ⭐ **MEILLEUR**

## 🔄 Workflow typique

1. **Le bot s'exécute** (cron 4h ou manuel)
2. **Monitoring positions** (check stop-loss/take-profit)
3. **Scan marchés** (top 100 depuis Polymarket)
4. **Filtre marchés** (liquidité, spread, catégories)
5. **Calcul HVS/FlipEV** (pour chaque marché)
6. **Décision stratégie** (HOLD/FLIP/SKIP)
7. **Risk check** (max positions, exposition, cooldown)
8. **Place ordre** (simulation ou réel)
9. **Enregistre position** (DB Supabase)
10. **Dashboard update** (temps réel via SWR)

## 📱 Monitoring

### Logs du bot

```bash
# Terminal 1: Dev server
npm run dev

# Terminal 2: Watch logs
tail -f .next/server/app/api/bot/execute/route.js
```

### Supabase Dashboard

1. **Table Viewer** → positions (voir positions actives)
2. **Table Viewer** → trades (historique complet)
3. **Table Viewer** → market_scan (derniers scans)

### Dashboard Web

- **Stats globales**: PnL, volume, win rate
- **Positions actives**: Prix, PnL, stop-loss
- **Opportunités**: Top 5 marchés
- **Graphique**: Performance 7 jours

## 🚀 Déploiement Production

### Option 1: Vercel + Supabase

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Configurer variables d'environnement dans Vercel Dashboard
# Activer Cron Jobs (Vercel Pro requis)
```

### Option 2: Railway + Supabase

```bash
# Install Railway CLI
npm i -g @railway/cli

# Deploy
railway up

# Configurer variables dans Railway Dashboard
```

### Configuration Cron (Production)

Utiliser Supabase Edge Functions avec Cron:

```bash
# Deploy edge function
supabase functions deploy bot-execute

# Configurer cron dans Supabase Dashboard
# Database → Cron Jobs → Add new cron job
```

## 💡 Tips

1. **Toujours démarrer en simulation**: `SIMULATION_MODE=true`
2. **Tester pendant 1 semaine** avant réel
3. **Commencer petit**: `maxPositions: 1` puis augmenter
4. **Monitor activement**: Premier jour, vérifier toutes les 4h
5. **Backup données**: Export Supabase régulièrement
6. **Git ignore .env**: Ne jamais commit les clés privées

## 📚 Ressources

- [Polymarket Docs](https://docs.polymarket.com)
- [Supabase Docs](https://supabase.com/docs)
- [Next.js Docs](https://nextjs.org/docs)
- [Viem Docs](https://viem.sh)
