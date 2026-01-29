# 🚀 Guide de Déploiement du Service WebSocket

## Récapitulatif du problème

1. ✅ **Production déployée** : https://bot-polymarket-kappa.vercel.app
2. ❌ **WebSocket manquant** : Le service de monitoring temps réel n'est pas déployé

## Solution : Déployer le WebSocket sur Deno Deploy (GRATUIT)

### Étape 1 : Créer un compte Deno Deploy

1. Va sur https://dash.deno.com/
2. Connecte-toi avec GitHub
3. Clique sur "New Project"

### Étape 2 : Déployer via GitHub (Option la plus simple)

1. **Push le code sur GitHub** (si ce n'est pas déjà fait)
   ```bash
   git add websocket-service/
   git commit -m "Add WebSocket service for real-time monitoring"
   git push
   ```

2. **Dans Deno Deploy Dashboard :**
   - Clique sur "New Project"
   - Sélectionne "Deploy from GitHub"
   - Choisis le repo `bot-polymarket`
   - **Entry Point** : `websocket-service/main.ts`
   - Clique sur "Link"

3. **Configure les variables d'environnement :**

   Dans Settings > Environment Variables, ajoute :

   ```
   SUPABASE_URL=https://kmbumfbszlmcqshdjxdx.supabase.co
   SUPABASE_ANON_KEY=<ta-clé-supabase-anon>
   ```

   ⚠️ **IMPORTANT** : Utilise les vraies clés Supabase de production !

### Étape 3 : Récupérer l'URL du WebSocket

Une fois déployé, Deno Deploy te donnera une URL comme :
```
https://your-project-name.deno.dev
```

### Étape 4 : Configurer Vercel

1. Va dans les Settings de ton projet Vercel
2. Dans "Environment Variables", modifie :
   ```
   NEXT_PUBLIC_WEBSOCKET_URL=https://your-project-name.deno.dev
   ```

3. Redéploie l'application :
   ```bash
   vercel --prod
   ```

## Alternative : Déploiement Manuel

Si tu préfères déployer manuellement :

```bash
# Installe deployctl
deno install -Arf jsr:@deno/deployctl

# Déploie
deployctl deploy --project=polymarket-ws websocket-service/main.ts \
  --env=SUPABASE_URL=https://... \
  --env=SUPABASE_ANON_KEY=...
```

## Test du WebSocket

Une fois déployé, teste avec :

```bash
# Health check
curl https://your-project-name.deno.dev/health

# Devrait retourner :
# {"status":"ok","lastUpdate":null,"connectedClients":0,"service":"Polymarket WebSocket Monitor"}
```

## Comment ça fonctionne ?

1. **Le service tourne en continu** sur Deno Deploy
2. **Toutes les 10 secondes**, il :
   - Récupère les positions ouvertes depuis Supabase
   - Check les prix sur Polymarket
   - Ferme automatiquement les positions si SL/TP atteint
   - Envoie des notifications via WebSocket aux clients connectés

3. **Le dashboard** se connecte au WebSocket et affiche :
   - Status en temps réel
   - Alertes quand des positions sont fermées
   - Mise à jour automatique du PnL

## Coûts

- **Deno Deploy** : GRATUIT (100 000 requêtes/jour)
- **Vercel** : GRATUIT (plan Hobby)
- **Supabase** : GRATUIT (jusqu'à 500 MB)

**Total : 0€/mois** 🎉

## Troubleshooting

### Le WebSocket ne se connecte pas

1. Vérifie que `NEXT_PUBLIC_WEBSOCKET_URL` est bien configuré dans Vercel
2. Vérifie que le service Deno Deploy est bien en ligne : `/health`
3. Check les logs dans Deno Deploy Dashboard

### Les positions ne se ferment pas

1. Vérifie les variables d'environnement Supabase
2. Check les logs dans Deno Deploy
3. Vérifie que les clés Supabase ont les bonnes permissions

## Support

Si tu as des questions, ouvre une issue sur GitHub !
