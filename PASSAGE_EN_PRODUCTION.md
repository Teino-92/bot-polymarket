# ⚠️ Checklist: Passage en Mode Production (SIMULATION OFF)

**DANGER**: Une fois en mode production, le bot effectuera de VRAIS trades avec de l'argent RÉEL sur Polymarket.

---

## 📋 Prérequis OBLIGATOIRES

Avant de passer en production, tu DOIS avoir:

### ✅ Phase de Test (MINIMUM 7 jours en simulation)
- [ ] Bot testé pendant au moins **7 jours** en mode SIMULATION
- [ ] Vérification que les calculs HVS/FlipEV sont corrects
- [ ] Vérification que le stop-loss/take-profit fonctionnent
- [ ] Vérification que les notifications Telegram arrivent bien
- [ ] Revue de TOUS les trades simulés pour valider la logique

### ✅ Capital & Wallet
- [ ] **Wallet Polygon dédié** créé (JAMAIS utiliser ton wallet principal)
- [ ] Wallet financé avec **USDC sur Polygon** (minimum recommandé: 150€)
- [ ] Private key du wallet exportée et sauvegardée en lieu sûr
- [ ] Vérification que le wallet a des MATIC pour les gas fees (~0.50€ minimum)

### ✅ Configuration & Monitoring
- [ ] Dashboard accessible et fonctionnel
- [ ] WebSocket service déployé et connecté (🟢 Connected)
- [ ] Notifications Telegram configurées et testées
- [ ] GitHub Actions cron vérifié (toutes les 30 min)
- [ ] Variables d'environnement vérifiées sur Vercel

---

## 🔧 Étape 1: Préparer le Wallet de Production

### 1.1 Créer un Wallet Dédié

**Avec MetaMask:**
```
1. Ouvre MetaMask
2. Clique sur l'icône de compte (en haut à droite)
3. Clique sur "Create Account" ou "Import Account"
4. Crée un nouveau compte: "Polymarket Bot"
```

**Ou créer un nouveau wallet:**
```bash
# Utilise un générateur de wallet sécurisé
# https://vanity-eth.tk/ (offline mode)
# OU utilise MetaMask pour créer un nouveau wallet
```

### 1.2 Financer le Wallet

```
1. Va sur https://app.uniswap.org/
2. Connecte ton wallet principal
3. Bridge USDC vers Polygon (ou achète directement sur Polygon)
4. Envoie 150-200 USDC au wallet du bot
5. Envoie 0.5-1 MATIC pour les gas fees
```

### 1.3 Exporter la Private Key

**⚠️ ATTENTION: Cette clé donne accès total au wallet!**

**Avec MetaMask:**
```
1. Clique sur les 3 points du compte "Polymarket Bot"
2. "Account details"
3. "Show private key"
4. Entre ton mot de passe MetaMask
5. COPIE la private key (commence par 0x...)
```

**Sauvegarde sécurisée:**
```bash
# NE JAMAIS:
❌ Commiter la private key sur GitHub
❌ L'envoyer par email/Telegram
❌ La partager avec qui que ce soit
❌ La stocker en clair sur ton ordinateur

# OUI:
✅ Utiliser un gestionnaire de mots de passe (1Password, Bitwarden)
✅ La stocker UNIQUEMENT dans les variables d'environnement Vercel/Railway
✅ Faire une sauvegarde papier dans un coffre
```

---

## 🔧 Étape 2: Mettre à Jour les Variables d'Environnement

### 2.1 Variables Locales (.env.local)

**⚠️ Pour tester localement AVANT de déployer:**

```bash
# Ouvre .env.local
nano .env.local
```

Modifie ces lignes:

```bash
# Mode (CHANGER DE true À false)
SIMULATION_MODE=false

# Wallet du bot (AJOUTER)
WALLET_PRIVATE_KEY=0xTON_PRIVATE_KEY_ICI

# Wallet autorisé (doit correspondre à l'adresse du bot)
AUTHORIZED_WALLET_ADDRESS=0xADRESSE_DU_WALLET_BOT
```

**Sauvegarde**: `Ctrl+X` → `Y` → `Enter`

### 2.2 Variables Vercel (Production Dashboard)

```bash
# Option 1: Via CLI
vercel env add SIMULATION_MODE production
# Entrer: false

vercel env add WALLET_PRIVATE_KEY production
# Entrer: 0xTON_PRIVATE_KEY_ICI
```

**Option 2: Via Dashboard Vercel:**

1. Va sur https://vercel.com/dashboard
2. Sélectionne ton projet `bot-polymarket`
3. Settings → Environment Variables
4. Modifie ou ajoute:

```
SIMULATION_MODE = false
WALLET_PRIVATE_KEY = 0xTON_PRIVATE_KEY_ICI
```

5. Sélectionne environnement: **Production** uniquement
6. Clique sur "Save"

### 2.3 Variables WebSocket Service

**Si déployé sur EC2:**

```bash
# Se connecter à EC2
ssh -i ton-key.pem ubuntu@ton-ec2-ip

# Éditer .env
cd ~/bot-polymarket/websocket-service
nano .env
```

Modifie:
```bash
SIMULATION_MODE=false
```

Redémarre le service:
```bash
sudo systemctl restart polymarket-websocket
```

**Si déployé sur Railway/Deno Deploy:**

1. Va sur le dashboard Railway/Deno Deploy
2. Variables → Modifie `SIMULATION_MODE`
3. Nouvelle valeur: `false`
4. Le service redémarre automatiquement

---

## 🔧 Étape 3: Ajuster les Paramètres du Bot (Optionnel)

**Recommandé**: Commence avec des paramètres conservateurs.

Édite `lib/config.ts`:

```typescript
export const BOT_CONFIG = {
  // Capital (commence avec moins pour tester)
  totalCapitalEur: 150,          // Au lieu de 150, commence avec 50-100
  maxPositions: 1,               // Au lieu de 2, commence avec 1 seule position
  maxPositionSizeEur: 50,        // Au lieu de 75, commence avec 50
  
  // Seuils de décision (plus conservateur)
  minHVSForHold: 10,             // Au lieu de 5, monte à 10 (plus sélectif)
  minFlipEV: 5,                  // Au lieu de 3, monte à 5
  
  // Risk management (plus strict)
  stopLossPercent: 0.10,         // Au lieu de 0.15, passe à 10% (moins de pertes)
  takeProfitPercent: 0.10,       // Au lieu de 0.08, passe à 10% (un peu plus de gain)
  
  // Autres paramètres (garde par défaut)
  maxTotalExposure: 0.90,
  cooldownMinutes: 120,
};
```

**Commit et push:**
```bash
git add lib/config.ts
git commit -m "config: Conservative params for initial production run"
git push
```

---

## 🚀 Étape 4: Déploiement en Production

### 4.1 Vérification Pré-Déploiement

```bash
# Vérifier qu'aucun secret n'est committé
git status
git diff

# Vérifier .gitignore contient bien:
cat .gitignore | grep -E "\.env|\.pem"
```

### 4.2 Déployer sur Vercel

```bash
# Déployer avec les nouvelles variables
vercel --prod --yes
```

Attends la fin du déploiement (~2 minutes).

### 4.3 Vérifier le Déploiement

```bash
# Health check
curl https://bot-polymarket-kappa.vercel.app/api/health

# Vérifier mode simulation
curl https://bot-polymarket-kappa.vercel.app/api/bot/config
# Devrait retourner: "simulationMode": false
```

---

## ✅ Étape 5: Tests en Production (Capital Minimal)

### 5.1 Premier Test Manuel

**⚠️ Commence avec UN SEUL trade de 10-20€**

1. Va sur ton dashboard: https://bot-polymarket-kappa.vercel.app
2. Va sur la page "Bot Config"
3. Clique sur "Execute Bot" (exécution manuelle)
4. **Surveille attentivement:**
   - Logs dans Vercel
   - Position créée dans Supabase
   - Notification Telegram
   - Transaction sur Polygonscan

### 5.2 Vérifier la Transaction

```bash
# Si tu as le txHash dans les logs
# Va sur: https://polygonscan.com/tx/TON_TX_HASH

# Vérifie:
✅ Transaction confirmée (Success)
✅ Gas fees corrects (~$0.01)
✅ USDC dépensé correspond au montant
```

### 5.3 Monitoring 24h

**Pendant les premières 24h:**

- [ ] Vérifie le dashboard toutes les 2-3h
- [ ] Surveille les notifications Telegram
- [ ] Vérifie que le stop-loss/take-profit fonctionne
- [ ] Note tous les trades dans un fichier Excel/Google Sheets
- [ ] Analyse la performance vs simulation

---

## 🔒 Étape 6: Sécurité Post-Déploiement

### 6.1 Rotation des Secrets (Recommandé)

**Après quelques jours, change les secrets:**

```bash
# Générer nouveau CRON_SECRET
openssl rand -hex 32

# Mettre à jour sur GitHub Actions et Vercel
# Redéployer
```

### 6.2 Alertes et Monitoring

**Configurer des alertes:**

1. **Vercel Monitoring**
   - Settings → Monitoring
   - Active les alertes d'erreur

2. **Supabase Monitoring**
   - Reports → Database Health
   - Vérifie régulièrement les connexions

3. **Telegram**
   - Active TOUTES les notifications
   - Vérifie que tu reçois bien les messages

### 6.3 Backups

```bash
# Backup de la base de données Supabase
# Va sur Supabase Dashboard → Database → Backups
# Active les backups automatiques (gratuit)
```

---

## 📊 Étape 7: Suivi et Optimisation

### 7.1 Métriques à Suivre

**Chaque semaine, analyse:**

```
- Win Rate (% de trades gagnants)
- PnL moyen par trade
- Temps moyen en position
- Nombre de stop-loss déclenchés
- Performance HVS vs FlipEV
```

### 7.2 Ajustements Progressifs

**Si le bot performe bien après 1 semaine:**

```typescript
// Augmenter progressivement
maxPositions: 1 → 2
maxPositionSizeEur: 50 → 75
minHVSForHold: 10 → 7 → 5
```

**Si le bot performe mal:**

```typescript
// Devenir plus conservateur
minHVSForHold: 5 → 10 → 15
stopLossPercent: 0.10 → 0.08
```

---

## 🚨 Étape 8: Plan d'Urgence

### En Cas de Problème

**Si le bot fait trop de pertes:**

```bash
# ARRÊT D'URGENCE:

# 1. Désactiver le cron GitHub Actions
# Va sur: https://github.com/Teino-92/bot-polymarket/actions
# Désactive le workflow "Bot Polymarket - Cron Job"

# 2. Passer en mode pause
# Va sur dashboard → Bot Config → Pause Bot

# 3. Fermer manuellement toutes les positions
# Dashboard → Active Positions → Close Position
```

**Si le wallet est compromis:**

```bash
# 1. IMMÉDIATEMENT transférer tous les fonds vers un wallet sûr
# 2. Changer WALLET_PRIVATE_KEY sur Vercel
# 3. Redéployer
# 4. Vérifier les transactions suspectes sur Polygonscan
```

---

## ✅ Checklist Finale Avant Activation

### Vérifications Obligatoires

- [ ] Bot testé 7+ jours en simulation
- [ ] Wallet dédié créé et financé (150€ USDC + 0.5 MATIC)
- [ ] Private key exportée et sauvegardée en sécurité
- [ ] `SIMULATION_MODE=false` sur Vercel
- [ ] `WALLET_PRIVATE_KEY` ajoutée sur Vercel
- [ ] `AUTHORIZED_WALLET_ADDRESS` correspond au wallet du bot
- [ ] WebSocket service connecté (🟢)
- [ ] Notifications Telegram testées
- [ ] Cron GitHub Actions activé
- [ ] Premier trade manuel testé avec 10-20€
- [ ] Transaction vérifiée sur Polygonscan
- [ ] Plan d'urgence lu et compris
- [ ] Monitoring configuré (Vercel + Telegram)

### Dernière Vérification

```bash
# Vérifier variables Vercel
vercel env ls

# Devrait montrer:
# SIMULATION_MODE = false
# WALLET_PRIVATE_KEY = (sensitive)
# AUTHORIZED_WALLET_ADDRESS = 0x...
```

---

## 📈 Passage Progressif (Recommandé)

**Semaine 1:**
- 1 position max
- 50€ par position
- Seuils conservateurs (HVS: 10, FlipEV: 5)
- Surveillance quotidienne

**Semaine 2-3:**
- Analyser performance
- Si bon: augmenter à 2 positions
- Si bon: augmenter à 75€ par position

**Mois 2:**
- Si performance stable > 1 mois
- Augmenter capital progressivement
- Ajuster seuils selon historique

---

## 🎯 Objectifs de Performance

**Objectifs réalistes:**

- **Win Rate**: > 55% (sur 20+ trades)
- **PnL moyen**: > +2% par trade
- **Drawdown max**: < 15% du capital
- **Temps en position**: < 7 jours (pour FLIP)

**Si objectifs non atteints après 1 mois:**
→ Retour en SIMULATION
→ Analyse approfondie
→ Ajustement des paramètres

---

## 📞 Support et Ressources

- **Dashboard**: https://bot-polymarket-kappa.vercel.app
- **Supabase**: https://supabase.com/dashboard
- **Vercel**: https://vercel.com/dashboard
- **GitHub Actions**: https://github.com/Teino-92/bot-polymarket/actions
- **Polygonscan**: https://polygonscan.com/

---

**Dernière mise à jour**: 2026-02-02
**Version**: 1.0

⚠️ **RAPPEL**: Trading involves risk. Ne jamais investir plus que ce que tu peux te permettre de perdre.
