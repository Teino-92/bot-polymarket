# 🔧 Correctifs Appliqués - Bot Polymarket

**Date**: 2026-02-01

## 📋 Problèmes Identifiés

### 1. ❌ WebSocket non connecté
**Diagnostic**:
- L'URL `NEXT_PUBLIC_WEBSOCKET_URL` pointe vers Railway qui héberge l'application Next.js
- Le service WebSocket réel (`websocket-service/main.ts`) n'est PAS déployé
- Le service devrait être sur Deno Deploy et non Railway

**Solution**:
- ⚠️ **ACTION REQUISE**: Déployer `websocket-service/main.ts` sur Deno Deploy
- Suivre le guide: `DEPLOY_WEBSOCKET.md`
- Mettre à jour `NEXT_PUBLIC_WEBSOCKET_URL` dans Vercel avec l'URL Deno Deploy

### 2. ❌ Pas de cron automatique toutes les 4h
**Diagnostic**:
- `vercel.json` ne contenait PAS de configuration de cron
- Le bot ne s'exécutait jamais automatiquement en 7 jours
- **Découverte**: Vercel Hobby (gratuit) limite les crons à 1 fois par jour maximum

**Solution**: ✅ **CORRIGÉ avec GitHub Actions**
- **GitHub Actions** (`.github/workflows/bot-cron.yml`):
  - Cron toutes les 4h: `0 */4 * * *` (00:00, 04:00, 08:00, 12:00, 16:00, 20:00 UTC)
  - Appelle `https://bot-polymarket-kappa.vercel.app/api/bot/execute`
  - GRATUIT (2000 minutes/mois incluses)
- **Vercel cron** (backup):
  - Cron quotidien: `0 12 * * *` (12:00 UTC)
  - Conforme aux limites du plan Hobby

**Pourquoi GitHub Actions ?**
- ✅ Gratuit (2000 min/mois)
- ✅ Supporte crons multiples par jour
- ✅ Logs détaillés
- ✅ Exécution manuelle possible via GitHub UI

### 3. ❌ Positions fermées lors du scan manuel
**Diagnostic**:
- L'API `/api/bot/scan` ne fermait PAS de positions
- MAIS `/api/bot/execute` appelle `riskManager.monitorPositions()` qui check et ferme
- Si une position atteint son stop-loss ou take-profit lors de `monitorPositions()`, elle se ferme
- C'est le comportement attendu, mais peut sembler inattendu lors d'un scan manuel

**Solution**: ✅ **CLARIFIÉ**
- `/api/bot/scan` = Scan uniquement, **PAS de monitoring de positions**
- `/api/bot/execute` = Monitoring des positions + Scan + Ouverture de nouvelle position
- Ajouté des logs clairs pour distinguer les deux actions
- Documentation mise à jour dans les commentaires

**Distinction importante**:
```typescript
// /api/bot/scan - Scan seulement
POST /api/bot/scan
→ scanTopMarkets()
→ Enregistrer dans market_scan
→ PAS de monitoring, PAS de fermeture de positions

// /api/bot/execute - Exécution complète du bot
POST /api/bot/execute
→ riskManager.monitorPositions() // Peut fermer positions si SL/TP
→ scanTopMarkets()
→ Ouvrir nouvelle position si possible
```

### 4. ❌ Pas de notifications Telegram
**Diagnostic**:
- Les variables `TELEGRAM_BOT_TOKEN` et `TELEGRAM_CHAT_ID` sont configurées
- Mais aucune notification n'était envoyée lors de l'ouverture/fermeture de positions

**Solution**: ✅ **CORRIGÉ**
- Créé `lib/telegram.ts` avec fonctions de notification
- Ajouté `notifyPositionOpened()` dans `/api/bot/execute`
- Ajouté `notifyPositionClosed()` dans `risk-manager.ts`

**Messages Telegram**:
```
🟢 POSITION OUVERTE
📊 Marché: [nom]
📈 Stratégie: HOLD/FLIP
💰 Taille: 75€
📍 Prix d'entrée: 45.0%
🛡️ Stop-Loss: 38.3%
🎯 Take-Profit: 48.6%
```

```
💰/❌ POSITION FERMÉE
🟢 Take-Profit atteint / 🔴 Stop-Loss atteint
📊 Marché: [nom]
📍 Prix d'entrée: 45.0%
📍 Prix de sortie: 48.6%
💵 PnL: +2.70€ (+8.00%)
```

### 5. ❌ Jamais 2 positions ouvertes en même temps
**Diagnostic**:
- `lib/config.ts` configure `maxPositions: 2`
- La logique dans `/api/bot/execute` vérifie correctement:
```typescript
const activePositions = await riskManager.getActivePositions();
const canOpen = activePositions.length < BOT_CONFIG.maxPositions; // OK: < 2
```
- Le code supporte DÉJÀ 2 positions simultanées

**Solution**: ✅ **AUCUNE MODIFICATION NÉCESSAIRE**
- Le bot PEUT déjà ouvrir 2 positions simultanément
- Si tu n'as jamais vu 2 positions en même temps, c'est probablement parce que:
  1. Le bot n'a jamais trouvé 2 opportunités viables en même temps
  2. Le cron n'était pas activé (corrigé ci-dessus)
  3. Une position se fermait avant qu'une 2ème ne s'ouvre

---

## 📝 Fichiers Modifiés

### 1. `vercel.json` ✅
```diff
{
  "buildCommand": "npm run build",
  "installCommand": "npm install",
  "framework": "nextjs",
-  "regions": ["iad1"]
+  "regions": ["iad1"],
+  "crons": [
+    {
+      "path": "/api/bot/execute",
+      "schedule": "0 */4 * * *"
+    }
+  ]
}
```

### 2. `lib/telegram.ts` ✅ NOUVEAU
- Fonctions `sendTelegramNotification()`
- Fonctions `notifyPositionOpened()`
- Fonctions `notifyPositionClosed()`

### 3. `lib/polymarket/risk-manager.ts` ✅
```diff
+ import { notifyPositionClosed } from '../telegram';

  private async closePosition(...) {
    // ... code existing ...

+   // Envoyer notification Telegram
+   await notifyPositionClosed({
+     marketName: position.market_name,
+     entryPrice: Number(position.entry_price),
+     exitPrice,
+     pnl,
+     reason: status,
+   });
  }
```

### 4. `app/api/bot/execute/route.ts` ✅
```diff
+ import { notifyPositionOpened } from '@/lib/telegram';

  export async function POST() {
    // ... code existing ...

+   // Envoyer notification Telegram
+   await notifyPositionOpened({
+     marketName: best.marketName,
+     strategy: best.action,
+     entryPrice: best.entryPrice,
+     size: BOT_CONFIG.maxPositionSizeEur,
+     stopLoss: stopLossPrice,
+     takeProfit: takeProfitPrice,
+   });
  }
```

### 5. `app/api/bot/scan/route.ts` ✅
- Ajouté commentaires clairs
- Logs améliorés pour montrer que c'est scan seulement

---

## ✅ Checklist de Déploiement

### Étape 1: Commit et Push
```bash
git add .
git commit -m "fix: Add cron job, Telegram notifications, and clarify scan vs execute

- Add Vercel cron job to run bot every 4 hours (00:00, 04:00, etc.)
- Add Telegram notifications for position open/close events
- Create lib/telegram.ts with notification helpers
- Clarify difference between /api/bot/scan (scan only) and /api/bot/execute (full bot)
- Update logs to distinguish scan-only from position monitoring"
git push
```

### Étape 2: Déployer sur Vercel
```bash
vercel --prod
```

Vercel va automatiquement :
- ✅ Détecter le nouveau cron dans `vercel.json`
- ✅ Activer l'exécution toutes les 4h
- ✅ Redéployer avec les nouvelles fonctions Telegram

### Étape 3: Vérifier le Cron dans Vercel Dashboard
1. Aller sur https://vercel.com/dashboard
2. Sélectionner le projet `bot-polymarket`
3. Aller dans **Settings** → **Cron Jobs**
4. Tu devrais voir: `0 */4 * * *` pointant vers `/api/bot/execute`

### Étape 4: Déployer le WebSocket sur Deno Deploy
⚠️ **ACTION REQUISE MANUELLEMENT**

Suivre le guide `DEPLOY_WEBSOCKET.md`:

1. Va sur https://dash.deno.com/
2. Créer nouveau projet
3. Déployer depuis GitHub repo `bot-polymarket`
4. Entry point: `websocket-service/main.ts`
5. Configurer variables d'env:
   ```
   SUPABASE_URL=https://jiavycnibezhmdepdgqk.supabase.co
   SUPABASE_ANON_KEY=eyJ...
   ```
6. Récupérer l'URL: `https://your-project.deno.dev`

7. Mettre à jour dans Vercel:
   ```bash
   # Dans Vercel Dashboard → Settings → Environment Variables
   NEXT_PUBLIC_WEBSOCKET_URL=https://your-project.deno.dev
   ```

8. Redéployer:
   ```bash
   vercel --prod
   ```

---

## 🧪 Tests à Effectuer

### Test 1: Telegram Notifications
```bash
# Créer une position test et la fermer manuellement
curl -X POST https://bot-polymarket-kappa.vercel.app/api/bot/execute

# Tu devrais recevoir:
# 1. Message Telegram "POSITION OUVERTE"
# 2. (Plus tard) Message Telegram "POSITION FERMÉE"
```

### Test 2: Cron Job
```bash
# Vérifier dans Vercel Dashboard → Deployments → Functions Logs
# Chercher des exécutions toutes les 4h

# Ou attendre le prochain cron (00:00, 04:00, 08:00, etc.)
```

### Test 3: Scan Manuel (ne ferme PAS les positions)
```bash
# Via Dashboard: cliquer "Manual Scan"
# Vérifier logs: devrait dire "This is a SCAN ONLY - no positions will be affected"
# Vérifier: aucune position ne se ferme
```

### Test 4: WebSocket (après déploiement Deno Deploy)
```bash
# Health check
curl https://your-project.deno.dev/health

# Devrait retourner:
# {"status":"ok","lastUpdate":null,"connectedClients":0,"service":"Polymarket WebSocket Monitor"}

# Dans le dashboard, le status devrait être "🟢 Connected"
```

---

## 📊 État Actuel vs État Attendu

| Problème | Avant | Après |
|----------|-------|-------|
| **Cron 4h** | ❌ Jamais exécuté | ✅ Toutes les 4h |
| **Telegram** | ❌ Pas de notifs | ✅ Notifs ouverture + fermeture |
| **Scan manuel** | ⚠️ Peut fermer positions si SL/TP | ✅ Clarifié: scan seul vs bot complet |
| **2 positions** | ⚠️ Supporté mais jamais vu | ✅ Supporté (attendre cron auto) |
| **WebSocket** | ❌ Pointe vers mauvais service | ⏳ À déployer sur Deno Deploy |

---

## 🚀 Prochaines Étapes

1. ✅ **Déployer sur Vercel** (automatique au push)
2. ⏳ **Déployer WebSocket sur Deno Deploy** (manuel - voir DEPLOY_WEBSOCKET.md)
3. ⏳ **Attendre le prochain cron** (max 4h) pour tester exécution automatique
4. ⏳ **Vérifier Telegram** reçoit les notifications
5. ⏳ **Monitorer les logs** dans Vercel Dashboard

---

## 💡 Notes Importantes

### Comportement Normal vs Bugs

**Normal**:
- Position se ferme lors de `/api/bot/execute` si SL/TP atteint → C'est le monitoring automatique
- Position se ferme lors du cron toutes les 4h si SL/TP atteint → Monitoring automatique
- Parfois 0 opportunités trouvées → Marchés Polymarket ne correspondent pas aux filtres

**Pas normal** (maintenant corrigé):
- Jamais de cron automatique → **CORRIGÉ** avec `vercel.json`
- Pas de notifs Telegram → **CORRIGÉ** avec `lib/telegram.ts`
- WebSocket offline → **À CORRIGER** en déployant sur Deno Deploy

### Différence Scan vs Execute

```
/api/bot/scan (bouton "Manual Scan"):
└─ scanTopMarkets()
└─ Enregistrer dans DB
└─ FIN (pas de monitoring, pas de fermeture)

/api/bot/execute (cron ou bouton "Execute Bot"):
└─ monitorPositions() ← Peut fermer si SL/TP
└─ scanTopMarkets()
└─ Ouvrir nouvelle position
```

---

**Version**: 1.0
**Auteur**: Bot Polymarket Team
**Statut**: ✅ Corrections appliquées, en attente de déploiement
