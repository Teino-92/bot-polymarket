# Polymarket WebSocket Monitor Service

Service de surveillance en temps réel des positions Polymarket. Il se connecte au WebSocket de Polymarket et surveille automatiquement les prix pour déclencher les stop-loss et take-profit.

## Fonctionnalités

- 🔴 **Surveillance en temps réel** : Connexion WebSocket permanente à Polymarket
- 🎯 **Stop-Loss automatique** : Ferme les positions quand le prix atteint le stop-loss
- 💰 **Take-Profit automatique** : Ferme les positions FLIP au take-profit
- 🔄 **Auto-reconnexion** : Reconnexion automatique en cas de déconnexion
- 📊 **Health Check** : Endpoint `/health` pour monitoring
- 🔍 **Status API** : Endpoint `/status` pour voir les positions surveillées

## Déploiement sur Railway

### Étape 1 : Créer un nouveau projet

1. Va sur https://railway.app
2. Clique sur "New Project"
3. Sélectionne "Empty Project"
4. Donne un nom : "polymarket-websocket"

### Étape 2 : Déployer depuis GitHub

1. Clique sur "New" → "GitHub Repo"
2. Sélectionne ton repository `bot-polymarket`
3. Railway va détecter le projet

### Étape 3 : Configuration

Dans les Settings du service Railway :

**Root Directory:**
```
websocket-service
```

**Start Command:**
```
deno run --allow-net --allow-env index.ts
```

**Watch Paths:**
```
websocket-service/**
```

### Étape 4 : Variables d'environnement

Ajoute ces variables dans Railway (Variables tab) :

```bash
SUPABASE_URL=https://jjayvonibezhmdepdqgk.supabase.co
SUPABASE_SERVICE_ROLE_KEY=ton-service-role-key
PORT=8000
```

**⚠️ Important** : Récupère ton `SUPABASE_SERVICE_ROLE_KEY` depuis :
- Supabase Dashboard → Project Settings → API → service_role key

### Étape 5 : Déployer

1. Clique sur "Deploy"
2. Attends que le déploiement soit terminé
3. Railway va te donner une URL publique

## Test du Service

Une fois déployé, teste avec :

```bash
# Health check
curl https://ton-service.up.railway.app/health

# Status détaillé
curl https://ton-service.up.railway.app/status
```

## Configuration dans Vercel

Une fois le service déployé sur Railway :

1. Copie l'URL publique Railway
2. Ajoute la variable d'environnement dans Vercel :
```bash
vercel env add NEXT_PUBLIC_WEBSOCKET_URL production
```
3. Redéploie : `vercel --prod`

## Vérification

Ouvre ton dashboard Next.js → Section "Live Monitoring" devrait afficher 🟢 Connecté
