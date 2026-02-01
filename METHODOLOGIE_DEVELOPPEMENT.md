# 📋 Méthodologie de Développement - Bot Polymarket

## 🎯 Principe Fondamental

**TOUJOURS consulter les fichiers .md à la racine du projet avant toute implémentation.**

Cette méthodologie garantit la cohérence, la sécurité et l'efficacité de toutes les modifications apportées au projet.

---

## 📚 Documentation de Référence

### Fichiers de Documentation Principaux

1. **README.md** - Vue d'ensemble du projet
   - Architecture globale
   - Features principales
   - Commandes utiles
   - Coûts et ressources

2. **SETUP.md** - Configuration locale
   - Prérequis techniques
   - Installation des dépendances
   - Configuration Supabase
   - Variables d'environnement
   - Workflow de développement

3. **DEPLOYMENT.md** - Déploiement EC2
   - Architecture de production avec EC2
   - Configuration AWS
   - Docker deployment
   - Monitoring et maintenance
   - Coûts (~$0-15/mois)

4. **DEPLOYMENT_RAILWAY.md** - Déploiement Railway/Render
   - Architecture de production avec Railway/Render
   - Alternative gratuite à EC2
   - Configuration simplifiée
   - Coûts ($0-5/mois)

5. **DEPLOY_WEBSOCKET.md** - Déploiement Deno Deploy
   - Déploiement du service WebSocket sur Deno Deploy
   - Configuration gratuite
   - Intégration avec Vercel

6. **SECURITY.md** - Sécurité
   - Configuration du wallet autorisé
   - Authentification
   - Protection des APIs
   - Checklist de sécurité

7. **WEBSOCKET_ACTIVATION.md** - Activation WebSocket
   - Guide détaillé d'activation du service WebSocket
   - Configuration Railway
   - Monitoring temps réel

8. **POLYMARKET_API_GRATUIT.md** - APIs Polymarket gratuites
   - Liste exhaustive des APIs disponibles gratuitement
   - Exemples d'utilisation
   - Plan d'implémentation par phases
   - Ce qu'il faut éviter (payant)

---

## 🔄 Workflow de Développement

### Étape 1: Consultation de la Documentation

**AVANT TOUTE IMPLÉMENTATION** :

```bash
# 1. Lire le README.md pour comprendre le contexte
cat README.md

# 2. Identifier les fichiers .md pertinents
ls *.md

# 3. Consulter la documentation spécifique
# Exemples:
# - Ajout de feature → README.md + lib/config.ts
# - Modification API → POLYMARKET_API_GRATUIT.md
# - Problème de déploiement → DEPLOYMENT*.md
# - Sécurité → SECURITY.md
```

### Étape 2: Analyse de l'Existant

**Comprendre l'architecture avant de modifier** :

```typescript
// 1. Examiner la structure du projet
/*
app/                    # Pages Next.js 15
├── api/               # API Routes
├── login/             # Page de login
└── page.tsx           # Dashboard principal

components/            # Composants React
├── DashboardCustomizer.tsx
├── LiveMonitoring.tsx
├── PerformanceCharts.tsx
└── TradeHistory.tsx

lib/                   # Logique métier
├── config.ts          # Configuration du bot
├── calculators/       # HVS & FlipEV
└── polymarket/        # API Polymarket

websocket-service/     # Service de monitoring temps réel
└── main.ts

supabase/
└── migrations/        # Schéma base de données
*/

// 2. Lire les fichiers concernés
// 3. Comprendre les dépendances
// 4. Vérifier les types TypeScript
```

### Étape 3: Vérification des Contraintes

**Checklist avant implémentation** :

- [ ] **Coût** : Cette feature est-elle gratuite ? (voir POLYMARKET_API_GRATUIT.md)
- [ ] **Sécurité** : Nécessite-t-elle une protection ? (voir SECURITY.md)
- [ ] **Architecture** : S'intègre-t-elle dans l'architecture actuelle ? (voir README.md)
- [ ] **Configuration** : Nécessite-t-elle des variables d'environnement ? (voir SETUP.md)
- [ ] **Mode** : Fonctionne-t-elle en mode SIMULATION et REAL ? (voir lib/config.ts)

### Étape 4: Planification

**Créer un plan d'implémentation structuré** :

```markdown
## Plan d'implémentation

### Objectif
[Décrire clairement l'objectif]

### Fichiers à modifier
1. `lib/polymarket/api.ts` - Ajouter fonction X
2. `app/api/markets/route.ts` - Créer endpoint
3. `components/MarketList.tsx` - Afficher données

### Étapes
1. [ ] Lire POLYMARKET_API_GRATUIT.md section X
2. [ ] Créer fonction API dans lib/polymarket/
3. [ ] Ajouter types TypeScript
4. [ ] Créer endpoint API
5. [ ] Tester en local
6. [ ] Mettre à jour composant UI
7. [ ] Tester en SIMULATION
8. [ ] Documenter dans README.md si nécessaire

### Tests
- [ ] Test unitaire de la fonction
- [ ] Test de l'endpoint API
- [ ] Test UI en local
- [ ] Test en mode SIMULATION

### Risques
- Rate limiting API Polymarket (1000 calls/h)
- Impact sur performance
```

### Étape 5: Implémentation

**Suivre les conventions du projet** :

```typescript
// ✅ BON - Respecte les conventions
interface MarketData {
  id: string;
  question: string;
  current_price: number;
  liquidity: number;
  volume_24h: number;
}

async function fetchMarketData(marketId: string): Promise<MarketData> {
  // 1. Vérifier rate limiting
  // 2. Appel API
  // 3. Gestion d'erreur
  // 4. Validation des données
  // 5. Retour typé
}

// ❌ MAUVAIS - Ne respecte pas les conventions
function getData(id) {
  const data = fetch(...).then(r => r.json());
  return data;
}
```

**Respecter la configuration** :

```typescript
// ✅ Toujours utiliser BOT_CONFIG
import { BOT_CONFIG } from '@/lib/config';

const maxPosition = BOT_CONFIG.maxPositionSizeEur;

// ❌ JAMAIS hardcoder les valeurs
const maxPosition = 75; // WRONG!
```

### Étape 6: Tests

**Tester en mode SIMULATION d'abord** :

```bash
# 1. Vérifier que SIMULATION_MODE=true
grep SIMULATION_MODE .env.local

# 2. Lancer le dev server
npm run dev

# 3. Tester la feature

# 4. Vérifier les logs
# 5. Vérifier Supabase (données correctes)
```

### Étape 7: Documentation

**Mettre à jour la documentation si nécessaire** :

```markdown
# Si ajout de feature majeure:
1. Mettre à jour README.md section Features
2. Créer un fichier .md dédié si complexe
3. Ajouter des exemples d'utilisation
4. Documenter les variables d'environnement

# Si modification API:
1. Mettre à jour POLYMARKET_API_GRATUIT.md
2. Ajouter exemples de code

# Si changement de déploiement:
1. Mettre à jour DEPLOYMENT*.md
2. Tester le processus complet
```

---

## 🏗️ Architecture du Projet

### Stack Technique

```
Frontend:
├── Next.js 15 (App Router)
├── React 18
├── TypeScript
├── Tailwind CSS
└── shadcn/ui

Backend:
├── Next.js API Routes
├── Supabase (PostgreSQL)
└── WebSocket Service (Deno)

APIs Externes (GRATUITES):
├── Gamma API (découverte marchés)
├── CLOB API (prix & orderbooks)
├── Data API (positions & historique)
└── WebSocket API (temps réel)

Déploiement:
├── Dashboard → Vercel (FREE)
├── Database → Supabase (FREE)
└── WebSocket → Deno Deploy / Railway (FREE ou $5/mois)
```

### Structure des Dossiers

```
bot-polymarket/
├── app/                          # Pages & API Routes (Next.js 15)
│   ├── api/                      # API Routes
│   │   ├── bot/                  # Endpoints bot
│   │   ├── opportunities/        # Scan & analyse
│   │   ├── overview/             # Stats globales
│   │   ├── positions/            # Gestion positions
│   │   └── history/              # Historique
│   ├── login/                    # Authentification wallet
│   ├── page.tsx                  # Dashboard principal
│   └── layout.tsx                # Layout global
│
├── components/                   # Composants React
│   ├── DashboardCustomizer.tsx   # Personnalisation dashboard
│   ├── LiveMonitoring.tsx        # Monitoring temps réel
│   ├── PerformanceCharts.tsx     # Graphiques performance
│   ├── TradeHistory.tsx          # Historique trades
│   └── ui/                       # Composants shadcn/ui
│
├── lib/                          # Logique métier
│   ├── config.ts                 # Configuration bot (IMPORTANT!)
│   ├── supabase.ts               # Client Supabase
│   ├── calculators/              # Calculateurs
│   │   ├── hvs.ts                # Hold Value Score
│   │   ├── flip-ev.ts            # Flip Expected Value
│   │   └── kelly.ts              # Kelly Criterion
│   └── polymarket/               # API Polymarket
│       ├── client.ts             # Client API
│       ├── types.ts              # Types TypeScript
│       └── websocket.ts          # WebSocket client
│
├── websocket-service/            # Service monitoring (Deno)
│   ├── main.ts                   # Point d'entrée
│   ├── .env                      # Config locale
│   └── README.md                 # Documentation
│
├── supabase/                     # Base de données
│   └── migrations/               # Migrations SQL
│       ├── 001_trades.sql
│       ├── 002_positions.sql
│       ├── 003_market_scan.sql
│       └── 004_bot_config.sql
│
└── *.md                          # DOCUMENTATION (À LIRE!)
```

---

## 🔐 Sécurité - Checklist

### Variables d'Environnement

**JAMAIS committer** :
- `.env`
- `.env.local`
- `.env.production`
- `*.pem` (clés SSH)
- Private keys

**Toujours vérifier** :
```bash
# Avant chaque commit
git status
# S'assurer qu'aucun fichier sensible n'est staged
```

### Mode SIMULATION

**TOUJOURS démarrer en SIMULATION** :

```bash
# .env.local
SIMULATION_MODE=true  # ✅ Par défaut

# Passage en REAL seulement après:
# 1. Tests 7+ jours en SIMULATION
# 2. Validation des formules HVS/FlipEV
# 3. Vérification risk management
# 4. Wallet dédié avec capital limité
```

### Authentification

**Configuration requise** :

```bash
# .env.local
AUTHORIZED_WALLET_ADDRESS=0x...your-wallet

# Vérifier dans middleware.ts que toutes les routes
# sensibles sont protégées
```

---

## 📊 Configuration du Bot

### Fichier Central: `lib/config.ts`

**TOUJOURS utiliser BOT_CONFIG** :

```typescript
// ✅ CORRECT
import { BOT_CONFIG } from '@/lib/config';

const maxSize = BOT_CONFIG.maxPositionSizeEur;
const minHVS = BOT_CONFIG.minHVSForHold;

// ❌ INCORRECT - Jamais hardcoder
const maxSize = 75;
const minHVS = 5;
```

### Paramètres Modifiables

**Via Dashboard UI** :
- Thresholds (HVS, FlipEV)
- Risk parameters (stop-loss, take-profit)
- Market filters

**Via Code** :
- Capital total
- Max positions
- Cooldown times
- Categories préférées

---

## 🧪 Tests

### Tests Obligatoires

**Avant chaque commit** :

```bash
# 1. Tests calculateurs
npm run test:calculators

# 2. Build Next.js
npm run build

# 3. Test en local
npm run dev
# → Vérifier dashboard
# → Vérifier API endpoints
# → Vérifier WebSocket connection
```

### Scénarios de Test

**Mode SIMULATION** :
1. Login avec wallet autorisé
2. Scan de marchés (manuel)
3. Vérification des opportunités
4. Simulation d'ouverture de position
5. Vérification stop-loss/take-profit
6. Fermeture manuelle de position

**Mode REAL** (après validation) :
1. Tous les tests SIMULATION
2. Vérification wallet balance
3. Test avec montant minimal (1€)
4. Monitoring 24h continu
5. Vérification transactions Polygon

---

## 🚀 Déploiement

### Choix de l'Infrastructure

**Option 1: Gratuit Complet (Railway/Render + Deno Deploy)** - Recommandé
```
Coût: $0-5/mois
Setup: 5 minutes
Maintenance: Automatique

Voir: DEPLOYMENT_RAILWAY.md + DEPLOY_WEBSOCKET.md
```

**Option 2: EC2 (Contrôle Total)**
```
Coût: $0 (12 mois), puis ~$15/mois
Setup: 30 minutes
Maintenance: Manuelle

Voir: DEPLOYMENT.md
```

### Checklist Déploiement

**Avant de déployer** :
- [ ] Tests en SIMULATION réussis (7+ jours)
- [ ] Variables d'environnement configurées
- [ ] SIMULATION_MODE=true (au début)
- [ ] Wallet autorisé configuré
- [ ] Migrations Supabase exécutées
- [ ] Documentation à jour

**Étapes de déploiement** :
1. [ ] Déployer Dashboard (Vercel)
2. [ ] Déployer WebSocket (Deno Deploy / Railway)
3. [ ] Configurer variables d'environnement
4. [ ] Tester connexion WebSocket
5. [ ] Tester authentification
6. [ ] Monitorer logs 24h

**Après déploiement** :
- [ ] Vérifier health check
- [ ] Tester scan de marchés
- [ ] Vérifier connexion Supabase
- [ ] Setup alertes (optionnel)

---

## 🐛 Troubleshooting

### Problèmes Courants

**"Invalid signature" error**
```bash
# Cause: Wallet address mismatch
# Fix:
1. Vérifier AUTHORIZED_WALLET_ADDRESS
2. Vérifier que l'adresse correspond au wallet connecté
3. Clear browser cache
```

**"No opportunities found"**
```bash
# Normal en mode SIMULATION
# En production: ajuster filters dans Bot Config
```

**WebSocket disconnected**
```bash
# Normal - reconnexion auto toutes les 5s
# Si persistant:
1. Vérifier logs Deno Deploy / Railway
2. Vérifier SUPABASE_URL et clés
3. Redémarrer service si nécessaire
```

**Build errors Next.js**
```bash
# Clean cache et rebuild
rm -rf .next
npm run build
```

---

## 📈 Évolution du Projet

### Phase 1: MVP (Actuel)
- ✅ Dashboard fonctionnel
- ✅ Authentification wallet
- ✅ Scan marchés (mock data)
- ✅ Calculateurs HVS/FlipEV
- ✅ WebSocket service

### Phase 2: APIs Réelles (À implémenter)
- [ ] Intégration Gamma API (scan réel)
- [ ] Intégration CLOB API (spreads réels)
- [ ] Orderbook depth analysis
- [ ] Trade history analysis

### Phase 3: Analytics Avancés
- [ ] Holder analysis
- [ ] Volume imbalance tracking
- [ ] Momentum detection
- [ ] ML predictions (optionnel)

### Phase 4: Automation
- [ ] Auto-trading (avec supervision)
- [ ] Portfolio rebalancing
- [ ] Risk management avancé

**Référence complète** : Voir POLYMARKET_API_GRATUIT.md sections "Améliorations Possibles" et "Plan d'Implémentation"

---

## 💡 Bonnes Pratiques

### Code

```typescript
// ✅ TOUJOURS typer
interface Market {
  id: string;
  price: number;
}

async function getMarket(id: string): Promise<Market> {
  // ...
}

// ✅ Gestion d'erreur
try {
  const market = await getMarket(id);
} catch (error) {
  console.error('Error fetching market:', error);
  return null;
}

// ✅ Validation des données
if (!market || !market.price) {
  throw new Error('Invalid market data');
}

// ❌ Pas de any
function process(data: any) { // WRONG!
}
```

### Git

```bash
# ✅ Commits clairs et atomiques
git commit -m "feat: Add real-time spread calculation using CLOB API"
git commit -m "fix: Handle WebSocket reconnection on error"
git commit -m "docs: Update POLYMARKET_API_GRATUIT.md with new endpoints"

# ❌ Éviter
git commit -m "updates"
git commit -m "fix stuff"
```

### Documentation

```markdown
# ✅ Toujours documenter:
1. Nouvelles features (README.md)
2. Nouvelles APIs (POLYMARKET_API_GRATUIT.md)
3. Changements de config (SETUP.md)
4. Nouvelles variables d'env (.env.example + SETUP.md)

# ✅ Format
- Exemples de code
- Cas d'usage
- Paramètres requis
- Réponses attendues
```

---

## 🎓 Ressources

### Documentation Officielle

- [Polymarket Docs](https://docs.polymarket.com)
- [Next.js 15 Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Deno Deploy Docs](https://deno.com/deploy/docs)
- [Vercel Docs](https://vercel.com/docs)

### Fichiers Projet à Connaître

```
📖 LIRE EN PRIORITÉ:
1. README.md              - Vue d'ensemble
2. SETUP.md               - Setup local
3. lib/config.ts          - Configuration
4. POLYMARKET_API_GRATUIT.md - APIs disponibles

📖 CONSULTER AU BESOIN:
- DEPLOYMENT*.md          - Déploiement
- SECURITY.md             - Sécurité
- WEBSOCKET_ACTIVATION.md - WebSocket
```

---

## ✅ Checklist Avant Chaque Modification

### Préparation
- [ ] Lire README.md section concernée
- [ ] Consulter fichiers .md pertinents
- [ ] Examiner code existant
- [ ] Vérifier types TypeScript
- [ ] Identifier dépendances

### Implémentation
- [ ] Respecter conventions du projet
- [ ] Utiliser BOT_CONFIG pour paramètres
- [ ] Typer toutes les fonctions
- [ ] Gérer les erreurs
- [ ] Valider les données

### Tests
- [ ] Tests unitaires si applicable
- [ ] Test en mode SIMULATION
- [ ] Vérifier build Next.js
- [ ] Tester API endpoints
- [ ] Vérifier UI

### Documentation
- [ ] Commenter code complexe
- [ ] Mettre à jour .md si nécessaire
- [ ] Ajouter exemples si nouvelle feature
- [ ] Update .env.example si nouvelles vars

### Git
- [ ] Vérifier qu'aucun secret n'est staged
- [ ] Commit message clair
- [ ] Push vers GitHub
- [ ] Vérifier déploiement Vercel

---

## 🔄 Workflow Complet Exemple

### Exemple: Ajouter Spread Réel via CLOB API

```bash
# 1. DOCUMENTATION
cat POLYMARKET_API_GRATUIT.md | grep -A 20 "CLOB API"
# → Comprendre endpoint /spread

# 2. ANALYSE
cat lib/polymarket/client.ts
# → Voir structure existante

# 3. PLANIFICATION
# Fichiers à modifier:
# - lib/polymarket/client.ts (nouvelle fonction)
# - lib/polymarket/types.ts (types)
# - app/api/opportunities/route.ts (utiliser spread réel)
# - components/MarketList.tsx (afficher spread)

# 4. IMPLÉMENTATION

# lib/polymarket/types.ts
export interface SpreadData {
  spread: number;
  bid: number;
  ask: number;
}

# lib/polymarket/client.ts
export async function getSpread(tokenId: string): Promise<SpreadData> {
  const response = await fetch(
    `https://clob.polymarket.com/spread?token_id=${tokenId}`
  );

  if (!response.ok) {
    throw new Error('Failed to fetch spread');
  }

  const data = await response.json();

  return {
    spread: data.spread,
    bid: data.bid,
    ask: data.ask
  };
}

# 5. TESTS
npm run build
npm run dev
# → Tester endpoint
# → Vérifier UI

# 6. DOCUMENTATION
# Mettre à jour README.md si feature majeure

# 7. COMMIT
git add .
git commit -m "feat: Add real-time spread calculation using CLOB API

- Add getSpread() function in lib/polymarket/client.ts
- Add SpreadData interface
- Update opportunities endpoint to use real spread
- Display real spread in MarketList component

Closes #X"

git push
```

---

## 📌 Points Clés à Retenir

1. **TOUJOURS consulter les .md avant de coder**
2. **TOUJOURS tester en mode SIMULATION d'abord**
3. **JAMAIS hardcoder les valeurs** → Utiliser BOT_CONFIG
4. **JAMAIS committer de secrets**
5. **TOUJOURS typer en TypeScript**
6. **TOUJOURS gérer les erreurs**
7. **TOUJOURS documenter les nouvelles features**
8. **TOUJOURS vérifier que c'est GRATUIT** (voir POLYMARKET_API_GRATUIT.md)

---

## 🎯 En Résumé

Cette méthodologie garantit:
- ✅ Cohérence du code
- ✅ Sécurité (simulation first, pas de secrets)
- ✅ Maintenabilité (documentation à jour)
- ✅ Efficacité (pas de réinventer la roue)
- ✅ Coûts maîtrisés (APIs gratuites)

**Règle d'or**: Avant toute modification, lire la documentation existante. Elle contient probablement déjà la réponse ou le pattern à suivre.

---

**Version**: 1.0
**Dernière mise à jour**: 2026-02-01
**Auteur**: Bot Polymarket Team
