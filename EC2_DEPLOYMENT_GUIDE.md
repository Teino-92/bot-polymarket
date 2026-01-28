# 🚀 Guide de déploiement EC2 avec Docker + VPN

Guide complet pour déployer le bot Polymarket sur AWS EC2 avec VPN Surfshark isolé dans Docker.

---

## 📋 Prérequis

- [ ] Compte AWS avec accès EC2
- [ ] Compte Surfshark actif
- [ ] Clé SSH pour te connecter à l'instance

---

## Étape 1: Créer l'instance EC2

### 1.1 - Créer l'instance

1. Va sur https://console.aws.amazon.com/ec2/
2. Clique sur **"Launch Instance"**
3. Configure:
   - **Name**: `polymarket-bot`
   - **AMI**: Ubuntu Server 24.04 LTS (ou 22.04)
   - **Instance type**: `t3.small` (2 vCPU, 2 GB RAM) minimum
   - **Key pair**: Crée ou sélectionne une clé SSH (télécharge le fichier `.pem`)
   - **Storage**: 20 GB gp3

### 1.2 - Configurer le Security Group

Dans "Network settings":
- ✅ Autorise **SSH** (port 22) depuis **"My IP"**
- ❌ Ne pas ouvrir d'autres ports (tout reste privé dans Docker)

### 1.3 - Lancer l'instance

- Clique sur **"Launch Instance"**
- Attends que le statut passe à **"Running"**
- Note l'**IP publique** (ex: `3.27.249.150`)

---

## Étape 2: Se connecter à l'instance

### 2.1 - Préparer la clé SSH

```bash
# Sur ton Mac, donne les bonnes permissions à ta clé
chmod 400 ~/Downloads/ta-cle.pem
```

### 2.2 - Se connecter

```bash
ssh -i ~/Downloads/ta-cle.pem ubuntu@TON-IP-PUBLIQUE
```

Tu devrais voir:
```
Welcome to Ubuntu 24.04 LTS
ubuntu@ip-xxx:~$
```

✅ **Tu es maintenant connecté à ton EC2!**

---

## Étape 3: Installer Docker

Sur l'EC2, copie et exécute ces commandes **une par une**:

```bash
# Mettre à jour le système
sudo apt update && sudo apt upgrade -y

# Installer Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Ajouter ton user au groupe docker (pour ne pas avoir à faire sudo)
sudo usermod -aG docker ubuntu

# Installer Docker Compose
sudo apt install -y docker-compose

# Vérifier que Docker est installé
docker --version
docker-compose --version
```

**IMPORTANT**: Déconnecte-toi et reconnecte-toi pour que le groupe docker soit pris en compte:

```bash
exit
```

Puis reconnecte-toi:
```bash
ssh -i ~/Downloads/ta-cle.pem ubuntu@TON-IP-PUBLIQUE
```

Vérifie que Docker fonctionne sans sudo:
```bash
docker ps
```

Si aucune erreur, c'est bon! ✅

---

## Étape 4: Récupérer la config Surfshark WireGuard

### 4.1 - Aller sur le site Surfshark

1. Va sur https://my.surfshark.com/vpn/manual-setup/main/wireguard
2. **Choisis un pays**: Singapore (recommandé pour Polymarket)
3. **Choisis un serveur**: n'importe lequel dans Singapore
4. Clique sur **"Download"** ou copie le contenu affiché

### 4.2 - Exemple de config

Tu devrais avoir un fichier qui ressemble à ça:

```ini
[Interface]
PrivateKey = AAAABBBBCCCCDDDD1111222233334444EEEEFFFFGGGG=
Address = 10.14.x.x/16
DNS = 1.1.1.1

[Peer]
PublicKey = XXXXYYYYYZZZZZ9999888877776666AAAABBBBCCCC=
Endpoint = sg-sng.prod.surfshark.com:51820
AllowedIPs = 0.0.0.0/0
PersistentKeepalive = 25
```

**Copie TOUT ce texte** dans ton presse-papier.

---

## Étape 5: Déployer le bot sur EC2

### 5.1 - Cloner le repo

```bash
cd ~
git clone https://github.com/Teino-92/bot-polymarket.git
cd bot-polymarket
```

### 5.2 - Créer le répertoire WireGuard

```bash
mkdir -p wireguard
```

### 5.3 - Créer la config WireGuard

```bash
nano wireguard/wg0.conf
```

- **Colle** le contenu de ta config Surfshark (que tu as copié à l'étape 4.2)
- Sauvegarde: `Ctrl + O`, puis `Enter`
- Quitte: `Ctrl + X`

### 5.4 - Vérifier la config

```bash
cat wireguard/wg0.conf
```

Tu dois voir ta config Surfshark.

### 5.5 - Créer le fichier d'environnement

```bash
cp .env.docker.example .env
nano .env
```

Remplis avec tes **vraies** valeurs:

```bash
SUPABASE_URL=https://jiavycnibezhmdepdgqk.supabase.co
SUPABASE_SERVICE_ROLE_KEY=ta-vraie-clé-supabase-ici
TELEGRAM_BOT_TOKEN=ton-token-telegram
TELEGRAM_CHAT_ID=ton-chat-id
SIMULATION_MODE=true
```

Sauvegarde: `Ctrl + O`, `Enter`, `Ctrl + X`

---

## Étape 6: Démarrer le bot

### 6.1 - Build et lancer

```bash
docker-compose up -d
```

Tu devrais voir:
```
Creating network "bot-polymarket_bot-network" ... done
Creating surfshark-vpn ... done
Creating bot-websocket ... done
```

### 6.2 - Vérifier que tout tourne

```bash
docker-compose ps
```

Tu dois voir 2 containers **"Up"**:
```
NAME              STATUS
surfshark-vpn     Up
bot-websocket     Up
```

### 6.3 - Vérifier les logs

```bash
docker-compose logs -f
```

Tu devrais voir:
- Le VPN se connecter à Surfshark
- Le bot démarrer et se connecter à Supabase

Appuie sur `Ctrl + C` pour quitter les logs.

---

## Étape 7: Tester que le VPN fonctionne

### 7.1 - Vérifier l'IP du bot (doit être Surfshark)

```bash
docker-compose exec websocket-service sh -c "curl -s https://api.ipify.org && echo"
```

**Résultat attendu**: Une IP de Singapore (ex: `103.216.223.204`)

❌ **Si tu vois l'IP AWS** (ex: `3.27.x.x`), le VPN ne fonctionne pas.

### 7.2 - Vérifier l'IP de l'hôte EC2 (doit être AWS)

```bash
curl -s https://api.ipify.org && echo
```

**Résultat attendu**: L'IP AWS de ton EC2 (ex: `3.27.249.150`)

✅ **Si les 2 IPs sont différentes, c'est PARFAIT!**
- Le bot passe par Surfshark
- L'hôte EC2 garde son IP normale
- SSH reste accessible

---

## Étape 8: Vérifier que le bot fonctionne

### 8.1 - Voir les logs en temps réel

```bash
docker-compose logs -f websocket-service
```

Tu devrais voir:
```
[WS] Starting Polymarket WebSocket Service...
[WS] Supabase URL: https://jiavycnibezhmdepdgqk.supabase.co
[WS] Loaded X active positions
```

### 8.2 - Tester depuis le dashboard

1. Va sur https://bot-polymarket-kappa.vercel.app
2. Le dashboard devrait afficher tes données
3. Le WebSocket status devrait être 🟢 "Connecté"

---

## 🎉 C'est terminé!

Ton bot tourne maintenant 24/7 sur EC2 avec:
- ✅ VPN Surfshark actif (traffic isolé dans Docker)
- ✅ SSH reste accessible
- ✅ Aucun risque de freeze ou lockout
- ✅ Service WebSocket qui surveille les positions

---

## 📝 Commandes utiles

### Arrêter le bot
```bash
docker-compose down
```

### Redémarrer le bot
```bash
docker-compose restart
```

### Voir les logs
```bash
docker-compose logs -f
```

### Mettre à jour le bot (après un git push)
```bash
cd ~/bot-polymarket
git pull
docker-compose up -d --build
```

### Vérifier l'IP du bot
```bash
docker-compose exec websocket-service sh -c "curl -s https://api.ipify.org && echo"
```

### Entrer dans le container du bot
```bash
docker-compose exec websocket-service sh
```

---

## 🐛 Troubleshooting

### Le VPN ne se connecte pas

```bash
docker-compose logs vpn
```

Vérifie que `wireguard/wg0.conf` est correct.

### Le bot ne démarre pas

```bash
docker-compose logs websocket-service
```

Vérifie que `.env` contient les bonnes clés.

### SSH ne fonctionne plus

Cela ne devrait JAMAIS arriver avec cette config Docker.
Si ça arrive, va dans la console AWS → EC2 → Connect via "Session Manager".

---

## 🔐 Sécurité

- ✅ Tout le traffic du bot passe par Surfshark
- ✅ L'hôte EC2 garde son réseau normal
- ✅ Pas de clés dans Git (`.env` est gitignored)
- ✅ VPN isolé dans Docker (pas de risque pour l'hôte)

---

## 🚨 Important

- N'oublie pas de régénérer tes clés Supabase et Telegram si elles ont été exposées
- Le bot tourne en mode **SIMULATION** par défaut
- Pour passer en mode réel: change `SIMULATION_MODE=false` dans `.env`

---

## 💰 Coûts AWS

Instance `t3.small` (2 vCPU, 2 GB RAM):
- ~$15-20/mois (24/7)
- Pour économiser: arrête l'instance quand tu ne l'utilises pas

```bash
# Arrêter l'instance (via AWS CLI)
aws ec2 stop-instances --instance-ids i-YOUR-INSTANCE-ID

# Redémarrer
aws ec2 start-instances --instance-ids i-YOUR-INSTANCE-ID
```
