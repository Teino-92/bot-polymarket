# 🚀 Guide Rapide : Déploiement WebSocket sur Railway

## ⚡ Étapes Rapides (5 minutes)

### 1. Créer un compte Railway
- Va sur https://railway.app
- Connecte-toi avec GitHub
- Plan gratuit suffit pour commencer

### 2. Créer un nouveau projet
1. Clique sur "New Project"
2. Sélectionne "Deploy from GitHub repo"
3. Choisis ton repo `Teino-92/bot-polymarket`
4. Railway va détecter automatiquement le projet

### 3. Configurer le service

Dans Railway, configure :

**Settings → Service:**
- **Root Directory**: `websocket-service`
- **Start Command**: `deno run --allow-net --allow-env index.ts`

**Variables (onglet Variables):**

Ajoute ces 3 variables :

```bash
SUPABASE_URL
Valeur: https://jjayvonibezhmdepdqgk.supabase.co

SUPABASE_SERVICE_ROLE_KEY
Valeur: [Va dans Supabase Dashboard → Project Settings → API → service_role key]

PORT
Valeur: 8000
```

### 4. Déployer

1. Clique sur "Deploy"
2. Attends 1-2 minutes
3. Railway va te donner une URL publique (ex: `https://xxx.up.railway.app`)

### 5. Tester

```bash
# Copie ton URL Railway et teste :
curl https://TON-URL.up.railway.app/health
```

Si tu vois `{"status":"online",...}` c'est bon ! ✅

### 6. Configurer Vercel

```bash
# Ajoute la variable d'environnement
vercel env add NEXT_PUBLIC_WEBSOCKET_URL production
# Colle ton URL Railway

# Redéploie
vercel --prod
```

### 7. Vérification finale

1. Ouvre ton dashboard
2. Section "Live Monitoring"
3. Tu devrais voir : 🟢 WebSocket : Connecté

## ✅ C'est fait !

Ton bot surveille maintenant les positions en temps réel et fermera automatiquement les positions quand le stop-loss ou take-profit est atteint.

## 📊 Monitoring

**Voir les logs Railway:**
1. Ouvre ton service sur Railway
2. Onglet "Deployments" → "View Logs"

**Tu devrais voir :**
```
[WS] Starting Polymarket WebSocket Service...
[WS] Connected to Polymarket WebSocket
[WS] Monitoring X active positions
```

## 🆘 Problèmes ?

**Service offline dans le dashboard ?**
- Vérifie que les variables d'environnement sont correctes dans Railway
- Regarde les logs Railway pour voir les erreurs

**Positions ne se ferment pas ?**
- Vérifie dans les logs Railway que le service reçoit les prix
- Teste l'endpoint `/status` pour voir les positions surveillées

**Questions ?** 
Regarde `websocket-service/README.md` pour plus de détails.
