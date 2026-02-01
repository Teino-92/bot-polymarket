# 🔍 Diagnostic Report - Position Closed During Scan

**Date**: 2026-02-01
**Issue**: Position fermée automatiquement lors d'un scan manuel + WebSocket non connecté

---

## 📊 État Actuel du Code

### ✅ Ce qui est CORRECTEMENT déployé:

1. **GitHub Actions Cron** (`.github/workflows/bot-cron.yml`):
   - ✅ Configuré pour s'exécuter toutes les 4h: `0 */4 * * *`
   - ✅ Appelle `https://bot-polymarket-kappa.vercel.app/api/bot/execute`
   - ✅ Commit: `8cb8fbe` (pushed to GitHub)

2. **Vercel Cron** (`vercel.json`):
   - ✅ Configuré pour s'exécuter 1x/jour: `0 12 * * *`
   - ✅ Conforme aux limites Vercel Hobby

3. **Telegram Notifications** (`lib/telegram.ts`):
   - ✅ Fichier créé avec `notifyPositionOpened()` et `notifyPositionClosed()`
   - ✅ Intégré dans `app/api/bot/execute/route.ts:148-155`
   - ✅ Intégré dans `lib/polymarket/risk-manager.ts:269-275`

4. **Scan vs Execute** clarification:
   - ✅ `/api/bot/scan` ne fait QUE scanner (pas de monitoring)
   - ✅ `/api/bot/execute` fait monitoring + scan + ouverture

---

## ⚠️ Problèmes Identifiés

### Problème 1: Position fermée lors du scan

**Symptômes**:
- User: "la j'ai effectué un scan et la position s'est fermée auto"

**Diagnostic requis**:
Nous avons besoin de vérifier:

1. **Quel bouton a été cliqué?**
   - "Manual Scan" → appelle `/api/bot/scan` (ne devrait PAS fermer)
   - "Execute Bot" → appelle `/api/bot/execute` (peut fermer si SL/TP)

2. **Code vérification**:

   `/api/bot/scan/route.ts` (scan seulement):
   ```typescript
   export async function POST() {
     console.log('[API/SCAN] ℹ️  This is a SCAN ONLY - no positions will be affected');

     const opportunities = await scanTopMarkets();
     // PAS de monitorPositions() ici

     // Save to DB
     if (scans.length > 0) {
       await supabaseAdmin.from('market_scan').insert(scans);
     }

     return NextResponse.json({ scanned: opportunities.length });
   }
   ```

   `/api/bot/execute/route.ts` (monitoring + scan):
   ```typescript
   export async function POST() {
     console.log('🤖 [BOT EXECUTE] Starting bot execution...');

     // 1. Monitor positions (peut fermer si SL/TP)
     const monitorResult = await riskManager.monitorPositions();

     // 2. Scan markets
     const opportunities = await scanTopMarkets();

     // 3. Open new position if possible
     // ...
   }
   ```

**Hypothèses possibles**:

- ✅ **Hypothèse A**: User a cliqué "Execute Bot" au lieu de "Manual Scan"
  - Solution: Vérifier quel bouton a été cliqué

- ✅ **Hypothèse B**: La position a atteint son stop-loss/take-profit naturellement
  - `risk-manager.ts:158-167` déclenche stop-loss si prix ≤ stop_loss_price
  - `risk-manager.ts:170-181` déclenche take-profit si prix ≥ take_profit_price
  - Solution: Vérifier les logs de `monitorPositions()`

- ✅ **Hypothèse C**: Le frontend appelle le mauvais endpoint
  - Solution: Vérifier le code du dashboard

**Actions requises**:

1. **Screenshot du Dashboard** → Voir quel bouton est présent
2. **Browser Console Logs** (F12 → Console) → Voir quelle API est appelée
3. **Vercel Function Logs** → Voir si c'est `/api/bot/scan` ou `/api/bot/execute`

---

### Problème 2: WebSocket non connecté

**Symptômes**:
- WebSocket status: 🔴 Disconnected
- `.env.local`: `NEXT_PUBLIC_WEBSOCKET_URL=https://bot-polymarket-production.up.railway.app`

**Diagnostic**:

Le WebSocket URL pointe vers **Railway** qui héberge l'application **Next.js**, PAS le service WebSocket.

**Architecture actuelle**:
```
Railway
└─ Next.js app (bot-polymarket)
   └─ Pages, API routes, etc.
   └─ ❌ PAS de WebSocket service

Deno Deploy (non déployé)
└─ ❌ websocket-service/main.ts (devrait être ici)
```

**Solution**:

1. **Déployer `websocket-service/main.ts` sur Deno Deploy**:
   - Guide: `DEPLOY_WEBSOCKET.md`
   - Entry point: `websocket-service/main.ts`
   - Variables d'env:
     ```
     SUPABASE_URL=https://jiavycnibezhmdepdgqk.supabase.co
     SUPABASE_ANON_KEY=eyJ...
     ```

2. **Récupérer l'URL Deno Deploy**:
   ```
   https://your-project.deno.dev
   ```

3. **Mettre à jour `.env.local` ET Vercel Environment Variables**:
   ```bash
   NEXT_PUBLIC_WEBSOCKET_URL=https://your-project.deno.dev
   ```

4. **Redéployer sur Vercel**:
   ```bash
   git add .
   git commit -m "fix: Update WebSocket URL to Deno Deploy"
   git push
   vercel --prod
   ```

---

## 🧪 Tests de Vérification

### Test 1: Vérifier quel endpoint est appelé

**Dans le Dashboard**:
1. Ouvrir F12 → Console
2. Cliquer "Manual Scan"
3. Vérifier le log:
   ```
   POST /api/bot/scan  ← CORRECT (scan seulement)
   POST /api/bot/execute  ← INCORRECT (ferait monitoring)
   ```

### Test 2: Vérifier les logs Vercel

1. Aller sur https://vercel.com/dashboard
2. Projet: `bot-polymarket`
3. **Functions** → **Logs**
4. Chercher:
   ```
   [API/SCAN] ℹ️  This is a SCAN ONLY  ← Scan seulement
   [BOT EXECUTE] Starting bot execution  ← Monitoring inclus
   ```

### Test 3: Vérifier GitHub Actions

1. Aller sur https://github.com/Teino-92/bot-polymarket/actions
2. Workflow: "Bot Polymarket - Cron Job"
3. Vérifier si des runs ont eu lieu
4. Prochaine exécution: Toutes les 4h (00:00, 04:00, 08:00, etc. UTC)

### Test 4: Test Telegram (après déploiement)

```bash
# Exécuter le bot manuellement
curl -X POST https://bot-polymarket-kappa.vercel.app/api/bot/execute

# Tu devrais recevoir:
# 1. Message Telegram si position ouverte
# 2. Message Telegram si position fermée (SL/TP)
```

---

## 📋 Checklist Actions Immédiates

### Actions pour diagnostiquer la fermeture de position:

- [ ] **Screenshot du Dashboard** → Montrer les boutons disponibles
- [ ] **Browser Console** (F12) → Copier les logs lors du clic sur "Manual Scan"
- [ ] **Vercel Function Logs** → Copier les derniers logs de `/api/bot/scan` ou `/api/bot/execute`
- [ ] **Vérifier la position fermée** → Dans Supabase `trades` table, voir le `status` et `closed_at`

### Actions pour WebSocket:

- [ ] **Créer projet Deno Deploy** → https://dash.deno.com/
- [ ] **Déployer `websocket-service/main.ts`**
- [ ] **Configurer variables d'env** sur Deno Deploy
- [ ] **Récupérer URL** → `https://your-project.deno.dev`
- [ ] **Mettre à jour `NEXT_PUBLIC_WEBSOCKET_URL`** dans Vercel
- [ ] **Redéployer** → `vercel --prod`

### Actions pour vérifier les crons:

- [ ] **GitHub Actions** → Vérifier si workflow est activé
- [ ] **Vercel Dashboard** → Settings → Cron Jobs → Vérifier `0 12 * * *`
- [ ] **Attendre 4h** → Vérifier si GitHub Actions s'exécute automatiquement

---

## 🎯 Prochaines Étapes

**Étape 1**: Fournir les diagnostics demandés ci-dessus

**Étape 2**: Déployer WebSocket sur Deno Deploy (guide: `DEPLOY_WEBSOCKET.md`)

**Étape 3**: Vérifier les Telegram notifications après le prochain cron

**Étape 4**: Monitorer les logs pendant 24-48h pour confirmer tout fonctionne

---

## 💡 Notes Importantes

### Comportement Normal vs Bug

**Normal**:
- Position se ferme lors de `/api/bot/execute` si SL/TP atteint → Monitoring automatique
- Position se ferme lors du cron si SL/TP atteint → Monitoring automatique
- Parfois 0 opportunités trouvées → Marchés ne correspondent pas aux critères

**Bug**:
- Position se ferme lors de `/api/bot/scan` → ❌ NE DEVRAIT PAS ARRIVER
- WebSocket offline → ⚠️ Service non déployé sur Deno Deploy
- Pas de notifications Telegram → ⚠️ Code en place, attendre prochain événement

---

**Auteur**: Claude Code
**Statut**: 🔍 En attente de diagnostics utilisateur
