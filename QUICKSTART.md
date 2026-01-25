# ⚡ Quickstart Guide - Polymarket Trading Bot

Démarrage rapide du bot en 5 minutes (mode simulation).

## 🎯 Setup minimal (SANS Supabase)

Pour tester les calculateurs uniquement :

```bash
# 1. Installer les dépendances
npm install

# 2. Tester les calculateurs
npm run test:calculators
```

**Résultat attendu** : Tous les tests passent ✅

## 🚀 Setup complet (AVEC Supabase)

### Étape 1: Configuration Supabase (5 min)

1. Créer un compte sur [supabase.com](https://supabase.com)
2. Créer un nouveau projet
3. Aller dans **Settings** → **API**
4. Copier:
   - Project URL
   - `anon` public key
   - `service_role` secret key

### Étape 2: Variables d'environnement

Éditer `.env.local` (déjà créé):

```bash
# Remplacer avec VOS clés Supabase
NEXT_PUBLIC_SUPABASE_URL=https://VOTRE-PROJET.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJVOTRE_CLE_ANON
SUPABASE_SERVICE_ROLE_KEY=eyJVOTRE_CLE_SERVICE

# Laisser ces valeurs (mode simulation)
SIMULATION_MODE=true
WALLET_PRIVATE_KEY=0x0000000000000000000000000000000000000000000000000000000000000000
```

### Étape 3: Créer les tables Supabase

Dans Supabase Dashboard → **SQL Editor**, exécuter **dans l'ordre**:

1. Copier/coller `supabase/migrations/001_trades.sql` → Run
2. Copier/coller `supabase/migrations/002_positions.sql` → Run
3. Copier/coller `supabase/migrations/003_market_scan.sql` → Run
4. Copier/coller `supabase/migrations/004_bot_config.sql` → Run

### Étape 4: Ajouter des données de démo (optionnel)

```bash
npm run seed:demo
```

### Étape 5: Démarrer le dashboard

```bash
npm run dev
```

Ouvrir http://localhost:3000

## 🧪 Tester le bot

### Test 1: Analyser les marchés

```bash
curl -X POST http://localhost:3000/api/bot/analyze
```

**Résultat attendu**:
```json
{
  "success": true,
  "scanned": 6,
  "topOpportunity": {
    "marketName": "Will OpenAI release GPT-5...",
    "action": "FLIP",
    "flipEV": 42.8,
    "hvs": 4.8
  }
}
```

### Test 2: Exécuter le bot (simulation)

```bash
curl -X POST http://localhost:3000/api/bot/execute
```

**Résultat attendu**:
```json
{
  "status": "position_opened",
  "market": "Will OpenAI release GPT-5...",
  "strategy": "FLIP",
  "size": 75,
  "flipEV": 42.8,
  "txHash": "0xsimulated..."
}
```

### Test 3: Voir les positions

```bash
curl http://localhost:3000/api/positions
```

**Résultat attendu**: Array avec positions actives

### Test 4: Dashboard

Ouvrir http://localhost:3000 et vérifier:
- ✅ Stats overview (PnL, positions, volume)
- ✅ Positions actives (si bot exécuté)
- ✅ Top opportunities
- ✅ Graphique PnL 7 jours

## 📊 Comprendre les résultats

### HVS (Hold Value Score)

**Positif** (>5€) → HOLD recommandé
**Négatif** (<5€) → FLIP ou SKIP

Exemple test:
```
Entry: 0.25, Win Prob: 70%, Days: 20
→ HVS: 29.25€ ✅ (HOLD profitable)
```

### FlipEV (Flip Expected Value)

**Élevé** (>3€) → FLIP recommandé
**Bas** (<3€) → SKIP

Exemple test:
```
Spread: 5.2%, Days: 120, Liquidity: $45k
→ FlipEV: 106.97€ ✅ (FLIP très profitable)
```

### Décision finale

Le bot compare HVS vs FlipEV :

1. **HOLD**: HVS > 5€ ET HVS >> FlipEV
2. **FLIP**: FlipEV > 3€ ET Spread > 3%
3. **SKIP**: Aucun critère rempli

## 🎮 Mode Simulation

**PAR DÉFAUT**, le bot est en mode simulation:

```typescript
SIMULATION_MODE=true  ← Aucun ordre réel placé
```

En mode simulation:
- ✅ Toutes les analyses fonctionnent
- ✅ Marchés mockés disponibles (6 marchés de test)
- ✅ Positions enregistrées en DB
- ✅ Dashboard fonctionne
- ❌ **AUCUN** ordre réel sur Polymarket
- ❌ **AUCUNE** transaction blockchain

Logs simulation:
```
🎮 [POLYMARKET] Running in SIMULATION mode
🎮 [SIMULATION] Would place order: {...}
Order ID: sim-1738000920123
TX Hash: 0xsimulated8a7f2b3
```

## 📁 Structure du projet

```
bot-polymarket/
├── app/                    # Next.js app
│   ├── page.tsx           # Dashboard
│   └── api/               # API routes
├── lib/                    # Core logic
│   ├── calculators/       # HVS & FlipEV
│   ├── polymarket/        # Bot logic
│   ├── config.ts          # Configuration
│   └── types.ts           # TypeScript types
├── components/            # React components
├── supabase/              # Database
│   └── migrations/        # SQL migrations
└── scripts/               # Utility scripts
```

## 🛠️ Commandes disponibles

```bash
# Développement
npm run dev                  # Démarrer Next.js dev server

# Tests
npm run test:calculators     # Tester HVS & FlipEV

# Database
npm run seed:demo            # Ajouter données de démo

# Production
npm run build                # Build pour production
npm start                    # Démarrer en production
```

## ⚠️ Troubleshooting

### "Failed to fetch from Supabase"

→ Vérifier les clés dans `.env.local`
→ Vérifier que les migrations SQL sont exécutées

### "No opportunities found"

→ Normal en mode simulation (6 marchés seulement)
→ Certains sont filtrés (catégorie crypto exclue)

### Dashboard vide

→ Exécuter: `npm run seed:demo`
→ Ou exécuter: `POST /api/bot/execute`

### TypeScript errors

→ Vérifier: `npm install`
→ Vérifier: fichiers dans `lib/` et `app/`

## 🎯 Prochaines étapes

1. **Tester en simulation** pendant 7+ jours
2. **Analyser les résultats** (HVS, FlipEV, décisions)
3. **Ajuster la config** (`lib/config.ts`)
4. **Lire SETUP.md** pour déploiement production
5. **(DANGER)** Passer en mode réel (lire README.md d'abord!)

## 📚 Documentation

- **README.md** : Documentation complète
- **SETUP.md** : Guide détaillé de setup
- **QUICKSTART.md** : Ce fichier (démarrage rapide)

## 💡 Tips

1. **Toujours démarrer en simulation**
2. **Tester les calculateurs** (`npm run test:calculators`)
3. **Monitorer le dashboard** (http://localhost:3000)
4. **Lire les logs** dans la console
5. **Ne jamais commit .env.local** (déjà dans .gitignore)

## ✅ Checklist démarrage

- [ ] `npm install` exécuté
- [ ] `.env.local` configuré avec clés Supabase
- [ ] Migrations SQL exécutées dans Supabase
- [ ] `npm run test:calculators` passe ✅
- [ ] `npm run dev` fonctionne
- [ ] Dashboard accessible (http://localhost:3000)
- [ ] `POST /api/bot/execute` fonctionne
- [ ] Position créée visible dans dashboard

**Durée totale**: ~10-15 minutes

---

🚀 **Prêt à démarrer !** Exécutez `npm run dev` et visitez http://localhost:3000
