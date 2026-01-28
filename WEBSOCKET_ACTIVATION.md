# Guide d'Activation du WebSocket Service

Ce guide explique comment activer de manière permanente le service WebSocket pour surveiller les positions en temps réel et exécuter les stop-loss/take-profit automatiquement.

## Architecture

Le service WebSocket écoute les mises à jour de prix en temps réel sur Polymarket et surveille toutes les positions ouvertes pour déclencher automatiquement les ordres stop-loss et take-profit.

## Prérequis

- Un compte Railway (https://railway.app) - gratuit pour commencer
- Accès à votre base de données Supabase
- Environment variables configured

## Étape 1: Préparer le Code du WebSocket Service

Le service WebSocket se trouve dans `/supabase/functions/websocket-monitor/`.

**Structure attendue:**
```
supabase/functions/websocket-monitor/
├── index.ts           # Point d'entrée du service
├── deno.json          # Configuration Deno
└── README.md          # Documentation
```

**Code minimal pour `index.ts`:**

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const POLYMARKET_WS_URL = 'wss://ws-subscriptions-clob.polymarket.com/ws/market';

interface Position {
  id: string;
  market_id: string;
  side: 'YES' | 'NO';
  entry_price: number;
  stop_loss_price: number;
  take_profit_price: number | null;
  status: string;
}

let lastUpdate: Date | null = null;
const activePositions = new Map<string, Position>();
const priceCache = new Map<string, number>();

async function monitorPositions() {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  // Récupérer les positions actives
  const { data: positions, error } = await supabase
    .from('positions')
    .select('*')
    .eq('status', 'OPEN');

  if (error || !positions) {
    console.error('Error fetching positions:', error);
    return;
  }

  // Connecter au WebSocket Polymarket
  const ws = new WebSocket(POLYMARKET_WS_URL);

  ws.onopen = () => {
    console.log('Connected to Polymarket WebSocket');

    // S'abonner aux marchés des positions actives
    positions.forEach((pos: Position) => {
      activePositions.set(pos.id, pos);
      ws.send(JSON.stringify({
        type: 'subscribe',
        market: pos.market_id,
      }));
    });
  };

  ws.onmessage = async (event) => {
    const data = JSON.parse(event.data);
    lastUpdate = new Date();

    // Mettre à jour le cache de prix
    if (data.market && data.price) {
      priceCache.set(data.market, data.price);

      // Vérifier chaque position pour ce marché
      for (const [posId, position] of activePositions.entries()) {
        if (position.market_id === data.market) {
          await checkExitConditions(supabase, position, data.price);
        }
      }
    }
  };

  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
  };

  ws.onclose = () => {
    console.log('WebSocket closed, reconnecting in 5s...');
    setTimeout(monitorPositions, 5000);
  };
}

async function checkExitConditions(supabase: any, position: Position, currentPrice: number) {
  let shouldExit = false;
  let exitReason = '';

  // Vérifier stop-loss
  if (position.side === 'YES') {
    if (currentPrice <= position.stop_loss_price) {
      shouldExit = true;
      exitReason = 'Stop-loss hit';
    } else if (position.take_profit_price && currentPrice >= position.take_profit_price) {
      shouldExit = true;
      exitReason = 'Take-profit hit';
    }
  } else {
    // NO position
    if (currentPrice >= position.stop_loss_price) {
      shouldExit = true;
      exitReason = 'Stop-loss hit';
    } else if (position.take_profit_price && currentPrice <= position.take_profit_price) {
      shouldExit = true;
      exitReason = 'Take-profit hit';
    }
  }

  if (shouldExit) {
    console.log(`Closing position ${position.id}: ${exitReason}`);

    // Appeler l'Edge Function pour fermer la position
    const { error } = await supabase.functions.invoke('bot-execute', {
      body: { action: 'close', positionId: position.id, reason: exitReason }
    });

    if (error) {
      console.error('Error closing position:', error);
    } else {
      activePositions.delete(position.id);
    }
  }
}

// Health check endpoint
serve(async (req) => {
  const url = new URL(req.url);

  if (url.pathname === '/health') {
    return new Response(
      JSON.stringify({
        status: 'ok',
        lastUpdate: lastUpdate?.toISOString(),
        activePositions: activePositions.size,
        monitoredMarkets: priceCache.size,
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  }

  return new Response('WebSocket Monitor Service', { status: 200 });
});

// Démarrer la surveillance
monitorPositions();
```

## Étape 2: Déployer sur Railway

### 2.1 Créer un Compte Railway

1. Allez sur https://railway.app
2. Créez un compte (gratuit)
3. Connectez votre compte GitHub

### 2.2 Créer un Nouveau Projet

1. Cliquez sur "New Project"
2. Sélectionnez "Deploy from GitHub repo"
3. Choisissez le repository `bot-polymarket`
4. Railway will automatically detect Deno if your project is configured correctly

### 2.3 Configuration du Service

Dans Railway, configurez les paramètres suivants:

**Root Directory:**
```
supabase/functions/websocket-monitor
```

**Start Command:**
```
deno run --allow-net --allow-env index.ts
```

**Port:**
```
8000
```

### 2.4 Variables d'Environnement

Ajoutez ces variables dans Railway (Settings > Variables):

```bash
SUPABASE_URL=https://votre-projet.supabase.co
SUPABASE_SERVICE_ROLE_KEY=votre-service-role-key
PORT=8000
```

**Où trouver ces valeurs:**
- `SUPABASE_URL`: Supabase Dashboard > Project Settings > API > URL
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase Dashboard > Project Settings > API > service_role key (⚠️ Secret)

## Étape 3: Configurer l'Application Next.js

### 3.1 Ajouter la Variable d'Environnement

Une fois déployé sur Railway, vous obtiendrez une URL publique (ex: `https://bot-polymarket-production.up.railway.app`).

Ajoutez cette URL à votre fichier `.env.local`:

```bash
NEXT_PUBLIC_WEBSOCKET_URL=https://votre-service.up.railway.app
```

### 3.2 Déployer sur Vercel

```bash
# Ajouter la variable d'environnement sur Vercel
vercel env add NEXT_PUBLIC_WEBSOCKET_URL

# Redéployer
vercel --prod
```

Ou via le Dashboard Vercel:
1. Project Settings > Environment Variables
2. Ajoutez `NEXT_PUBLIC_WEBSOCKET_URL` avec la valeur de Railway
3. Redéployez le projet

## Étape 4: Vérification

### 4.1 Tester le Service

```bash
# Health check
curl https://votre-service.up.railway.app/health

# Réponse attendue:
{
  "status": "ok",
  "lastUpdate": "2026-01-26T21:00:00.000Z",
  "activePositions": 2,
  "monitoredMarkets": 2
}
```

### 4.2 Vérifier dans le Dashboard

1. Ouvrez votre dashboard Next.js
2. Regardez la section "Live Monitoring"
3. Le statut WebSocket devrait afficher "🟢 Connecté"
4. "Dernière mise à jour" devrait afficher un timestamp récent

## Étape 5: Monitoring et Maintenance

### Logs Railway

Railway fournit des logs en temps réel:
1. Ouvrez votre projet sur Railway
2. Cliquez sur l'onglet "Deployments"
3. Cliquez sur "View Logs"

**Ce que vous devriez voir:**
```
Connected to Polymarket WebSocket
Subscribed to market: 0x1234...
Price update: 0x1234... -> 0.65
Closing position abc123: Stop-loss hit
```

### Alertes

Configurez des alertes dans Railway:
1. Settings > Notifications
2. Activez "Deployment failure notifications"
3. Ajoutez votre email ou webhook Discord/Slack

## Troubleshooting

### Le service se déconnecte souvent

**Solution:** Railway gratuit peut mettre en veille les services inactifs. Upgradez vers Railway Pro ($5/mois) pour:
- Pas de mise en veille
- Plus de ressources
- Uptime garanti

### Status "offline" dans le dashboard

**Causes possibles:**

1. **Variable d'environnement manquante:**
   ```bash
   # Vérifiez dans Vercel
   vercel env ls
   ```

2. **URL incorrecte:**
   - Assurez-vous que l'URL commence par `https://`
   - Pas de `/` à la fin de l'URL

3. **Service Railway down:**
   - Vérifiez les logs Railway
   - Redémarrez le service si nécessaire

### Les stop-loss ne se déclenchent pas

**Vérifications:**

1. **Positions dans la DB:**
   ```sql
   SELECT * FROM positions WHERE status = 'OPEN';
   ```

2. **WebSocket connecté:**
   - Vérifiez les logs Railway
   - Devrait voir "Connected to Polymarket WebSocket"

3. **Abonnements aux marchés:**
   - Les logs doivent montrer "Subscribed to market: ..."

## Coûts

### Railway

- **Plan Gratuit:** $5 de crédit gratuit/mois
  - Suffisant pour un service léger
  - Mise en veille possible après inactivité

- **Plan Pro:** $20/mois
  - Pas de mise en veille
  - 8 GB RAM
  - Uptime garanti 99.9%

### Vercel

- **Plan Hobby:** Gratuit
  - Largement suffisant pour le dashboard

### Supabase

- **Plan Gratuit:**
  - 500 MB base de données
  - 2 GB de transfert
  - Largement suffisant pour ce projet

## Recommandation

Pour un service 24/7 fiable:
- **Railway Pro** ($20/mois) pour le WebSocket service
- **Vercel Hobby** (gratuit) pour le dashboard
- **Supabase Free** (gratuit) pour la base de données

**Total:** ~$20/mois pour un bot entièrement automatisé et surveillé en permanence.

## Support

Si vous rencontrez des problèmes:
1. Vérifiez les logs Railway
2. Testez le health check endpoint
3. Vérifiez les variables d'environnement
4. Redémarrez le service si nécessaire

## Alternative: Exécution Locale

Si vous ne voulez pas utiliser Railway, vous pouvez exécuter le service localement:

```bash
cd supabase/functions/websocket-monitor

# Créer un .env local
cat > .env << EOF
SUPABASE_URL=https://votre-projet.supabase.co
SUPABASE_SERVICE_ROLE_KEY=votre-key
PORT=8000
EOF

# Lancer le service
deno run --allow-net --allow-env --allow-read index.ts
```

Puis dans `.env.local`:
```bash
NEXT_PUBLIC_WEBSOCKET_URL=http://localhost:8000
```

⚠️ **Note:** Cette approche nécessite que votre ordinateur soit toujours allumé et connecté.
