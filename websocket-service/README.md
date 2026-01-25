# Polymarket WebSocket Service

Service Node.js persistant qui maintient une connexion WebSocket avec Polymarket pour monitorer les positions en temps réel.

## Fonctionnalités

- ✅ Connexion WebSocket persistante à Polymarket
- ✅ Monitoring en temps réel des positions actives
- ✅ Détection automatique des stop-loss (-15%)
- ✅ Détection automatique des take-profit (+8%)
- ✅ Mise à jour automatique des prix dans Supabase
- ✅ Fermeture automatique des positions
- ✅ Reconnexion automatique en cas de déconnexion

## Déploiement gratuit

### Option 1: Railway.app (Recommandé)

1. Créer un compte sur https://railway.app
2. Créer un nouveau projet
3. Connecter ce repo GitHub
4. Définir le root directory: `websocket-service`
5. Ajouter les variables d'environnement:
   ```
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```
6. Déployer !

Railway offre **500h/mois gratuit** (suffisant pour 24/7).

### Option 2: Render.com

1. Créer un compte sur https://render.com
2. Nouveau Web Service
3. Connecter GitHub repo
4. Root Directory: `websocket-service`
5. Build Command: `npm install`
6. Start Command: `npm start`
7. Variables d'env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
8. Instance Type: Free
9. Déployer !

Render offre **750h/mois gratuit**.

## Test local

```bash
cd websocket-service
npm install

# Définir les variables d'env
export SUPABASE_URL=http://127.0.0.1:54321
export SUPABASE_SERVICE_ROLE_KEY=your-local-key

npm start
```

## Architecture

```
┌─────────────────┐
│  Polymarket WS  │
│  (prix temps    │
│   réel)         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  WS Service     │◄──── Railway/Render
│  (Node.js 24/7) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Supabase DB   │
│  (positions)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Vercel App     │
│  (Dashboard)    │
└─────────────────┘
```

## Logs

Le service log toutes les actions:

```
[WS] Starting Polymarket WebSocket Service...
[WS] Connected to Polymarket WebSocket
[WS] Monitoring 2 active positions
[WS] STOP_LOSS triggered for "XRP reaches $3.60"
[WS] Position closed: STOP_LOSS | PnL: -11.25€
```

## Coût

**100% GRATUIT** avec Railway ou Render !
