# 📱 Configuration Telegram

Guide pour configurer les notifications Telegram du bot Polymarket.

## 1️⃣ Créer un bot Telegram

### Étapes:

1. Ouvrir Telegram et chercher **@BotFather**
2. Envoyer `/newbot`
3. Donner un nom: `Polymarket Trading Bot`
4. Donner un username: `polymarket_trading_bot` (doit finir par `_bot`)
5. BotFather te donnera un **token** comme:
   ```
   1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
   ```
   ⚠️ **Garde ce token secret !**

## 2️⃣ Récupérer ton Chat ID

### Méthode 1: Via @userinfobot

1. Chercher **@userinfobot** sur Telegram
2. Cliquer "Start"
3. Le bot affiche ton **Chat ID** (exemple: `123456789`)

### Méthode 2: Manuelle

1. Envoyer un message à ton bot (via le lien que BotFather t'a donné)
2. Aller sur:
   ```
   https://api.telegram.org/bot<TON_TOKEN>/getUpdates
   ```
3. Chercher `"chat":{"id":123456789}`

## 3️⃣ Configurer les variables d'environnement

### Vercel

1. Aller sur Vercel Dashboard → bot-polymarket → Settings → Environment Variables
2. Ajouter:
   ```
   TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
   TELEGRAM_CHAT_ID=123456789
   ```
3. Redéployer l'app

### Local (.env.local)

```bash
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
TELEGRAM_CHAT_ID=123456789
```

## 4️⃣ Tester la connexion

### Méthode 1: Via API

```bash
curl https://bot-polymarket-kappa.vercel.app/api/telegram/test
```

Tu devrais recevoir un message de test sur Telegram !

### Méthode 2: Local

```bash
curl http://localhost:3001/api/telegram/test
```

## 5️⃣ Configurer le Webhook Telegram

To receive commands (`/status`, `/take`, etc.), configure the webhook:

```bash
curl -X POST "https://api.telegram.org/bot8190369966:AAH6mMytuMj-_m1SpgBhhxm69Jvwn8DCf2M/setWebhook?url=https://bot-polymarket-kappa.vercel.app/api/telegram/webhook"
```

Réponse attendue:
```json
{"ok":true,"result":true,"description":"Webhook was set"}
```

## 📨 Types de notifications

### 1. Trade ouvert
```
🟢 NOUVEAU TRADE OUVERT 🔄

📊 Marché: Will XRP reach $3.60?

💰 Détails du trade:
• Position: YES @ 45.0%
• Taille: 75.00€
• Stratégie: FLIP

📈 Métriques:
• FlipEV: 511.00€
• HVS: -231.50€
• Stop-Loss: 38.2% (-15%)
• Take-Profit: 48.6% (+8%)

⏱️ Résolution: 340 jours

🎯 Flipping pour volume airdrop
```

### 2. Trade fermé
```
✅ TRADE FERMÉ 🎯

📊 Marché: Will XRP reach $3.60?

💸 Résultat:
• PnL: +6.00€ (8.00%)
• Entrée: 45.0%
• Sortie: 48.6%
• Capital: 75.00€

📋 Raison: TAKE PROFIT
⏱️ Durée: 2j

🎉 Profit!
```

### 3. Opportunité bloquée
```
⚠️ MEILLEURE OPPORTUNITÉ DÉTECTÉE

🚫 Impossible d'ouvrir: 2 positions déjà actives

📊 Positions actuelles:
1. Market A
   FLIP | PnL: +3.50€
2. Market B
   HOLD | PnL: -2.00€
💰 Total PnL non réalisé: +1.50€

🆕 Nouvelle opportunité:
• Marché: New Market
• Stratégie: FLIP
• Prix entrée: 50.0%
• FlipEV: 600.00€
• HVS: -200.00€

❓ Que faire?
Réponds avec:
• /take - Fermer la position la moins profitable et prendre la nouvelle
• /keep - Garder les 2 positions actuelles
• /wait - Attendre la prochaine vérification (4h)
```

## 🤖 Commandes disponibles

Once the webhook is configured, you can send:

| Commande | Description |
|----------|-------------|
| `/start` | Menu principal |
| `/status` | État du bot et prochaine vérification |
| `/positions` | Liste des positions actives avec PnL |
| `/stats` | Statistiques globales (win rate, PnL total, etc.) |
| `/take` | Prendre nouvelle opportunité (en réponse à alerte) |
| `/keep` | Garder positions actuelles (en réponse à alerte) |
| `/wait` | Attendre 4h (en réponse à alerte) |
| `/help` | Aide et liste des commandes |

## 🔧 Dépannage

### Aucun message reçu

1. Vérifier que `TELEGRAM_BOT_TOKEN` et `TELEGRAM_CHAT_ID` sont corrects
2. Tester avec `/api/telegram/test`
3. Vérifier les logs Vercel

### Commandes ne fonctionnent pas

1. Verify that the webhook is configured:
   ```bash
   curl "https://api.telegram.org/bot<TOKEN>/getWebhookInfo"
   ```
2. Le webhook doit pointer vers ton app Vercel
3. Vérifier les logs Vercel pour voir si les requêtes arrivent

### Messages de test OK mais pas de notifs de trading

Les notifications sont envoyées quand:
- Un trade est ouvert par le bot (cron 4h)
- Un trade est fermé (WebSocket ou résolution)
- Une meilleure opportunité est trouvée mais positions pleines

To test, you can manually create a position in Supabase.

## 🔒 Sécurité

⚠️ **Important:**
- Ne **JAMAIS** partager ton `TELEGRAM_BOT_TOKEN`
- Ne commit jamais le token dans Git
- Utilise uniquement les variables d'environnement
- Seul ton `TELEGRAM_CHAT_ID` peut recevoir les notifications

## ✅ Checklist finale

- [ ] Bot créé via @BotFather
- [ ] Token récupéré
- [ ] Chat ID récupéré
- [ ] Variables ajoutées sur Vercel
- [ ] App redéployée
- [ ] Test `/api/telegram/test` réussi
- [ ] Webhook configured
- [ ] Commande `/start` fonctionne

🎉 Tout est prêt ! Tu recevras maintenant toutes les notifications de trading !
