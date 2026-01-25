# 🚀 Guide de déploiement complet

Ce guide explique comment déployer tous les composants du bot Polymarket.

## Architecture complète

```
┌─────────────────────────────────────────────────────────┐
│                    ARCHITECTURE                          │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌────────────┐      ┌──────────────┐                  │
│  │ Polymarket │──────│ Gamma API    │ (marchés)        │
│  │            │      │ (gratuit)    │                   │
│  └────────────┘      └──────────────┘                   │
│         │                                                │
│         │ WebSocket                                      │
│         ▼                                                │
│  ┌────────────────────────┐                             │
│  │  WebSocket Service     │                             │
│  │  (Node.js 24/7)        │◄─── Railway/Render (gratuit)│
│  │  - Stop-loss temps réel│                             │
│  │  - Take-profit auto    │                             │
│  └───────────┬────────────┘                             │
│              │                                           │
│              ▼                                           │
│  ┌────────────────────────┐                             │
│  │  Supabase              │                             │
│  │  - PostgreSQL DB       │◄─── Supabase Cloud (gratuit)│
│  │  - Edge Functions      │                             │
│  │  - Cron (4h)           │                             │
│  └───────────┬────────────┘                             │
│              │                                           │
│              ▼                                           │
│  ┌────────────────────────┐                             │
│  │  Vercel App            │                             │
│  │  - Next.js Dashboard   │◄─── Vercel (gratuit)       │
│  │  - API Routes          │                             │
│  │  - Bot logic           │                             │
│  └────────────────────────┘                             │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## 1️⃣ Supabase (Base de données)

**Coût: GRATUIT** (2 projets gratuits)

### Étapes:

1. Créer un compte sur https://supabase.com
2. Créer un nouveau projet
3. Aller dans SQL Editor
4. Exécuter les migrations dans l'ordre:
   - `supabase/migrations/000_functions.sql`
   - `supabase/migrations/001_trades.sql`
   - `supabase/migrations/002_positions.sql`
   - `supabase/migrations/003_market_scan.sql`
   - `supabase/migrations/004_bot_config.sql`

5. Configurer Cron (Database → Cron Jobs):
   ```sql
   SELECT cron.schedule(
     'bot-execute-every-4h',
     '0 */4 * * *',
     $$
     SELECT net.http_post(
       url := 'https://bot-polymarket-kappa.vercel.app/api/bot/execute',
       headers := '{"Content-Type": "application/json"}'::jsonb
     );
     $$
   );
   ```

6. Noter les credentials:
   - Project URL: `https://xxx.supabase.co`
   - Anon key (public)
   - Service role key (secret)

## 2️⃣ Vercel (Application principale)

**Coût: GRATUIT** (hobby tier)

### Étapes:

1. Créer un compte sur https://vercel.com
2. Importer le repo GitHub `bot-polymarket`
3. Configurer les variables d'environnement:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
   SUPABASE_SERVICE_ROLE_KEY=eyJxxx...
   SIMULATION_MODE=true
   WALLET_PRIVATE_KEY=0x0000... (fake pour simulation)
   POLYMARKET_CLOB_URL=https://clob.polymarket.com
   ```

4. Déployer !
5. URL obtenue: `https://bot-polymarket-xxx.vercel.app`

## 3️⃣ Railway.app (WebSocket Service)

**Coût: GRATUIT** (500h/mois = 24/7 possible)

### Option A: Railway.app (Recommandé)

1. Créer un compte sur https://railway.app
2. New Project → Deploy from GitHub repo
3. Sélectionner le repo `bot-polymarket`
4. Settings → Root Directory: `websocket-service`
5. Variables:
   ```
   SUPABASE_URL=https://xxx.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=eyJxxx...
   ```
6. Déployer !

### Option B: Render.com

1. Créer un compte sur https://render.com
2. New → Web Service
3. Connecter GitHub repo
4. Root Directory: `websocket-service`
5. Build: `npm install`
6. Start: `npm start`
7. Variables: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
8. Instance Type: **Free**
9. Déployer !

## 4️⃣ Vérification

### Dashboard
Aller sur `https://bot-polymarket-xxx.vercel.app`

Tu devrais voir:
- ✅ Positions actives (tableau vide au début)
- ✅ Opportunities (106 marchés scannés)
- ✅ Overview stats

### API Routes
Tester les endpoints:
```bash
# Analyser les marchés
curl -X POST https://bot-polymarket-xxx.vercel.app/api/bot/analyze

# Voir les opportunités
curl https://bot-polymarket-xxx.vercel.app/api/opportunities

# Voir les positions
curl https://bot-polymarket-xxx.vercel.app/api/positions
```

### WebSocket Service
Vérifier les logs sur Railway/Render:
```
[WS] Starting Polymarket WebSocket Service...
[WS] Connected to Polymarket WebSocket
[WS] Monitoring 0 active positions
```

### Cron Job
Vérifier dans Supabase → Database → Cron Jobs:
- Job devrait être "Active"
- Prochaine exécution visible

## 5️⃣ Mode production (Trading réel)

⚠️ **ATTENTION: Ne PAS activer avant d'avoir testé en simulation !**

Pour passer en mode réel:

1. Obtenir une clé privée Polygon avec des fonds
2. Mettre à jour la variable Vercel:
   ```
   SIMULATION_MODE=false
   WALLET_PRIVATE_KEY=0xVRAIE_CLE_PRIVEE
   ```
3. Redéployer l'app Vercel

Le bot commencera à trader réellement à la prochaine exécution cron (4h).

## 📊 Monitoring

### Logs Vercel
https://vercel.com/dashboard → bot-polymarket → Logs

### Logs Railway
https://railway.app → Projet → Deployments → View Logs

### Logs Supabase
https://supabase.com → Projet → Logs

### Database
Supabase → Table Editor → positions / trades

## 🔧 Maintenance

### Mettre à jour le bot
```bash
git pull
git push
```
→ Vercel redéploie automatiquement

### Mettre à jour le WS service
```bash
git pull
git push
```
→ Railway/Render redéploie automatiquement

### Modifier la config du bot
Supabase → Table Editor → bot_config

### Nettoyer les anciennes positions
```sql
DELETE FROM positions WHERE status = 'CLOSED' AND closed_at < NOW() - INTERVAL '30 days';
DELETE FROM trades WHERE closed_at < NOW() - INTERVAL '90 days';
```

## 💰 Coûts totaux

| Service | Plan | Coût/mois |
|---------|------|-----------|
| Supabase | Free | 0€ |
| Vercel | Hobby | 0€ |
| Railway | Free | 0€ |
| **TOTAL** | | **0€** |

✅ **100% GRATUIT pour toujours !**

## 🆘 Problèmes courants

### Le bot ne trade pas
- Vérifier SIMULATION_MODE=true (normal au début)
- Vérifier les logs Vercel
- Vérifier que le cron Supabase est actif

### WebSocket déconnecté
- Normal, reconnexion auto toutes les 5s
- Vérifier les logs Railway/Render

### Pas d'opportunités trouvées
- Normal si marchés en dehors des filtres
- Ajuster les filtres dans `lib/config.ts`

### API rate limit
- Cache activé (5min TTL)
- Max 1000 calls/h sur Gamma API

## 📚 Documentation

- Polymarket Docs: https://docs.polymarket.com
- Supabase Docs: https://supabase.com/docs
- Vercel Docs: https://vercel.com/docs
- Railway Docs: https://docs.railway.app
