# 🌐 AWS EC2 Setup - Bot Polymarket avec VPN (GRATUIT 12 mois)

Ce guide te montre comment déployer le bot sur AWS EC2 **gratuitement** pendant 12 mois avec WireGuard VPN Surfshark.

## 💰 Coûts

**AWS Free Tier** (12 mois gratuit):
- ✅ 750 heures/mois EC2 t2.micro (Ubuntu)
- ✅ 30 GB stockage
- ✅ Largement suffisant pour le bot 24/7!

**Après 12 mois:** ~$8-10/mois (ou tu migres vers un autre compte AWS)

---

## 📋 Prérequis

1. Compte AWS (carte bleue requise, mais gratuit)
2. Ton fichier `wg0.conf` de Surfshark Singapore (déjà fait ✅)
3. 30 minutes de setup

---

## 🚀 Étape 1: Créer une instance EC2

### 1.1 Connexion AWS

1. Va sur https://aws.amazon.com/console/
2. Clique "Sign In to the Console"
3. Crée un compte si besoin (utilise le Free Tier)

### 1.2 Lancer une instance

1. Dans la console AWS, cherche **"EC2"**
2. Clique **"Launch Instance"**
3. Configure:

   **Nom de l'instance:**
   ```
   polymarket-bot
   ```

   **AMI (système d'exploitation):**
   - Choisis: **Ubuntu Server 22.04 LTS**
   - Architecture: **64-bit (x86)**
   - ✅ Free tier eligible

   **Instance type:**
   - Choisis: **t2.micro** (Free tier eligible)
   - 1 vCPU, 1 GB RAM

   **Key pair (pour SSH):**
   - Clique "Create new key pair"
   - Nom: `polymarket-bot-key`
   - Type: **RSA**
   - Format: **`.pem`** (pour Mac/Linux)
   - Télécharge le fichier `.pem` et sauvegarde-le!

   **Network settings:**
   - Coche **"Allow SSH traffic from"** → My IP (ou Anywhere)
   - Coche **"Allow HTTP traffic from the internet"**
   - Coche **"Allow HTTPS traffic from the internet"**

   **Storage:**
   - 20 GB gp3 (gratuit)

4. Clique **"Launch instance"**

### 1.3 Télécharger la clé SSH

1. La clé `polymarket-bot-key.pem` est téléchargée
2. Déplace-la dans `~/.ssh/`:

```bash
mv ~/Downloads/polymarket-bot-key.pem ~/.ssh/
chmod 400 ~/.ssh/polymarket-bot-key.pem
```

---

## 🔌 Étape 2: Se connecter à l'instance

### 2.1 Récupérer l'adresse IP

1. Dans AWS Console EC2 → Instances
2. Sélectionne ton instance `polymarket-bot`
3. Copie l'**"Public IPv4 address"** (ex: `54.123.45.67`)

### 2.2 Connexion SSH

```bash
ssh -i ~/.ssh/polymarket-bot-key.pem ubuntu@54.123.45.67
# Remplace 54.123.45.67 par ton IP publique
```

Tu es maintenant connecté à ton serveur AWS! 🎉

---

## ⚙️ Étape 3: Installer les dépendances

Sur le serveur EC2, exécute:

```bash
# Mise à jour système
sudo apt update && sudo apt upgrade -y

# Installer WireGuard
sudo apt install wireguard wireguard-tools -y

# Installer Deno (pour le WebSocket service)
curl -fsSL https://deno.land/install.sh | sh
echo 'export DENO_INSTALL="/home/ubuntu/.deno"' >> ~/.bashrc
echo 'export PATH="$DENO_INSTALL/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc

# Installer Git
sudo apt install git -y

# Vérifier les installations
deno --version
wg --version
git --version
```

---

## 🔒 Étape 4: Configurer WireGuard VPN

### 4.1 Copier ta config Surfshark

**Option A: Depuis ton Mac** (recommandé)

```bash
# Sur TON MAC (pas sur EC2!)
scp -i ~/.ssh/polymarket-bot-key.pem \
  /Users/matteogarbugli/code/Teino-92/bot-polymarket/websocket-service/wg0.conf \
  ubuntu@54.123.45.67:/tmp/wg0.conf
```

**Option B: Copier-coller manuel**

```bash
# Sur EC2:
sudo nano /etc/wireguard/wg0.conf
# Colle le contenu de ton fichier wg0.conf
# Sauvegarde: Ctrl+O, Enter, Ctrl+X
```

### 4.2 Démarrer WireGuard

```bash
# Sécuriser le fichier
sudo chmod 600 /etc/wireguard/wg0.conf

# Démarrer WireGuard
sudo wg-quick up wg0

# Vérifier la connexion VPN
curl https://api.ipify.org
# Tu devrais voir une IP de Singapore, pas AWS!

# Activer au démarrage
sudo systemctl enable wg-quick@wg0
```

Si tu vois une IP de Singapore → VPN fonctionne! ✅

---

## 📦 Étape 5: Déployer le bot

### 5.1 Cloner le repo

```bash
cd ~
git clone https://github.com/Teino-92/bot-polymarket.git
cd bot-polymarket/websocket-service
```

### 5.2 Configurer les variables d'environnement

```bash
nano .env
```

Ajoute:
```bash
SUPABASE_URL=https://ton-projet.supabase.co
SUPABASE_SERVICE_ROLE_KEY=ton_service_role_key
TELEGRAM_BOT_TOKEN=ton_telegram_token
TELEGRAM_CHAT_ID=ton_chat_id
SIMULATION_MODE=false
```

Sauvegarde: `Ctrl+O`, `Enter`, `Ctrl+X`

### 5.3 Tester le bot

```bash
deno run --allow-net --allow-env index.ts
```

Tu devrais voir:
```
🔒 Connected via WireGuard VPN
📡 WebSocket service running on port 8080
🎮 [POLYMARKET] Running in SIMULATION mode
```

Appuie sur `Ctrl+C` pour arrêter.

---

## 🔄 Étape 6: Configurer le bot en service (24/7)

### 6.1 Créer un service systemd

```bash
sudo nano /etc/systemd/system/polymarket-bot.service
```

Colle:
```ini
[Unit]
Description=Polymarket Trading Bot WebSocket Service
After=network.target wg-quick@wg0.service
Requires=wg-quick@wg0.service

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/bot-polymarket/websocket-service
ExecStart=/home/ubuntu/.deno/bin/deno run --allow-net --allow-env index.ts
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Sauvegarde et active:

```bash
# Recharger systemd
sudo systemctl daemon-reload

# Activer le service
sudo systemctl enable polymarket-bot

# Démarrer le service
sudo systemctl start polymarket-bot

# Vérifier le status
sudo systemctl status polymarket-bot
```

### 6.2 Voir les logs

```bash
# Logs en temps réel
sudo journalctl -u polymarket-bot -f

# Derniers logs
sudo journalctl -u polymarket-bot -n 50
```

---

## 🎯 Étape 7: Connecter le dashboard Vercel

Maintenant que le WebSocket tourne sur EC2, connecte ton dashboard Vercel:

### 7.1 Récupérer l'IP publique EC2

```bash
# Sur EC2:
curl https://api.ipify.org
```

Copie cette IP (c'est l'IP de Singapore via VPN!)

### 7.2 Configurer Vercel

1. Va sur https://vercel.com/
2. Projet `bot-polymarket` → Settings → Environment Variables
3. Ajoute:

```
NEXT_PUBLIC_WEBSOCKET_URL=http://54.123.45.67:8080
```
(Remplace par ton IP EC2)

4. Redeploy: `vercel --prod`

---

## ✅ Vérification finale

### Test 1: VPN actif

```bash
# Sur EC2:
curl https://api.ipify.org
# Doit montrer IP Singapore, pas AWS
```

### Test 2: Bot tourne

```bash
sudo systemctl status polymarket-bot
# Doit afficher "active (running)"
```

### Test 3: Dashboard connecté

1. Ouvre https://bot-polymarket-kappa.vercel.app
2. Login avec ton wallet
3. Vérifie "Live Monitoring" → WebSocket doit être "Online"

---

## 🔧 Commandes utiles

```bash
# Redémarrer le bot
sudo systemctl restart polymarket-bot

# Arrêter le bot
sudo systemctl stop polymarket-bot

# Voir les logs
sudo journalctl -u polymarket-bot -f

# Status VPN
sudo wg show

# Redémarrer VPN
sudo wg-quick down wg0
sudo wg-quick up wg0

# Mettre à jour le code
cd ~/bot-polymarket
git pull origin main
sudo systemctl restart polymarket-bot
```

---

## 🆘 Troubleshooting

### Le VPN ne se connecte pas

```bash
# Vérifier les logs WireGuard
sudo journalctl -u wg-quick@wg0 -n 50

# Regénérer une config Surfshark
# → https://my.surfshark.com/vpn/manual-setup/main/wireguard
```

### Le bot ne démarre pas

```bash
# Voir l'erreur
sudo journalctl -u polymarket-bot -n 100

# Tester manuellement
cd ~/bot-polymarket/websocket-service
deno run --allow-net --allow-env index.ts
```

### IP toujours française sur Dashboard

1. Vérifie que le VPN est actif sur EC2
2. Redémarre le bot: `sudo systemctl restart polymarket-bot`
3. Le bot doit utiliser l'IP VPN pour appeler Polymarket

---

## 💰 Coûts après Free Tier

Après 12 mois gratuits:
- EC2 t2.micro: ~$8-10/mois
- Données: ~$1/mois
- **Total: ~$10/mois**

**Alternative gratuite:** Crée un nouveau compte AWS avec un autre email 😉

---

## 🎉 C'est tout!

Ton bot tourne maintenant 24/7 sur AWS EC2 avec VPN Surfshark Singapore!

- ✅ Bot accessible depuis Vercel
- ✅ VPN Surfshark actif en permanence
- ✅ Redémarre automatiquement si crash
- ✅ Gratuit pendant 12 mois!

Pour toute question, check les logs:
```bash
ssh -i ~/.ssh/polymarket-bot-key.pem ubuntu@TON_IP
sudo journalctl -u polymarket-bot -f
```
