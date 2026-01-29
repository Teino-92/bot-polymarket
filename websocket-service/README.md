# WebSocket Service for Polymarket Bot

Service de monitoring en temps réel des positions Polymarket avec stop-loss et take-profit.

## Déploiement sur Deno Deploy (Gratuit)

### 1. Créer un compte sur Deno Deploy
- Va sur https://deno.com/deploy
- Connecte-toi avec GitHub

### 2. Créer un nouveau projet
```bash
# Installe deployctl si ce n'est pas déjà fait
deno install -Arf jsr:@deno/deployctl

# Déploie le service
deployctl deploy --project=polymarket-websocket websocket-service/main.ts
```

### 3. Configurer les variables d'environnement
Dans le dashboard Deno Deploy, ajoute ces variables :
- `SUPABASE_URL`: Ton URL Supabase
- `SUPABASE_ANON_KEY`: Ta clé anonyme Supabase

### 4. Mettre à jour l'URL dans le frontend
Une fois déployé, tu obtiendras une URL comme :
`https://polymarket-websocket.deno.dev`

Mets à jour la variable `NEXT_PUBLIC_WEBSOCKET_URL` dans Vercel avec cette URL.

## Test en local

```bash
cd websocket-service
deno run --allow-net --allow-env main.ts
```

Le service tournera sur http://localhost:8000

### Endpoints disponibles

- `GET /health` - Health check + status
- `WebSocket /ws` - Connexion WebSocket pour les updates en temps réel

## Fonctionnement

1. Le service se connecte à Supabase toutes les 10 secondes
2. Il récupère toutes les positions ouvertes
3. Pour chaque position, il check le prix actuel sur Polymarket
4. Si le stop-loss ou take-profit est atteint, il ferme automatiquement la position
5. Il envoie une notification via WebSocket à tous les clients connectés
