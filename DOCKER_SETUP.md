# 🐳 Docker Setup avec VPN Surfshark

Cette configuration permet de faire tourner le bot dans Docker avec **tout le traffic routé via Surfshark VPN**, sans toucher au réseau de l'hôte EC2.

## 📋 Prérequis

- Ubuntu EC2 avec Docker installé
- Compte Surfshark actif
- Config WireGuard de Surfshark (wg0.conf)

## 🚀 Installation sur EC2

### 1. Cloner le repo

```bash
cd ~
git clone https://github.com/Teino-92/bot-polymarket.git
cd bot-polymarket
```

### 2. Créer le répertoire WireGuard

```bash
mkdir -p wireguard
```

### 3. Récupérer la config Surfshark

Va sur https://my.surfshark.com/vpn/manual-setup/main/wireguard

Choisis un serveur (Singapore recommandé pour Polymarket), puis copie la config:

```bash
nano wireguard/wg0.conf
```

Colle la config complète de Surfshark, exemple:

```ini
[Interface]
PrivateKey = YOUR_PRIVATE_KEY_HERE
Address = 10.x.x.x/16
DNS = 1.1.1.1

[Peer]
PublicKey = SURFSHARK_PUBLIC_KEY
Endpoint = sg-sng.prod.surfshark.com:51820
AllowedIPs = 0.0.0.0/0
PersistentKeepalive = 25
```

Sauvegarde et quitte (Ctrl+O, Enter, Ctrl+X)

### 4. Copier le fichier d'environnement

```bash
cp .env.docker .env
```

Édite `.env` si besoin pour ajuster les variables.

### 5. Construire et démarrer

```bash
# Construire les images
docker-compose build

# Démarrer en background
docker-compose up -d

# Voir les logs
docker-compose logs -f
```

## ✅ Vérification

### Vérifier que le VPN fonctionne

```bash
# Vérifier l'IP du bot (doit être Surfshark, pas AWS)
docker-compose exec websocket-service sh -c "curl -s https://api.ipify.org"
```

Tu devrais voir une IP de Surfshark (Singapore si tu as choisi SG), PAS l'IP de ton EC2.

### Vérifier que l'hôte EC2 garde son IP normale

```bash
# Sur l'hôte directement
curl -s https://api.ipify.org
```

Tu devrais voir l'IP AWS normale. SSH fonctionne toujours normalement.

### Vérifier les logs du bot

```bash
# Logs du service WebSocket
docker-compose logs -f websocket-service

# Logs du VPN
docker-compose logs -f vpn
```

## 🔧 Commandes utiles

```bash
# Redémarrer tout
docker-compose restart

# Arrêter
docker-compose down

# Rebuild après changement de code
docker-compose up -d --build

# Voir le status
docker-compose ps

# Entrer dans le container du bot
docker-compose exec websocket-service sh

# Voir l'IP du bot
docker-compose exec websocket-service sh -c "curl -s https://api.ipify.org && echo"
```

## 🔐 Sécurité

- ✅ Le VPN est isolé dans Docker
- ✅ L'hôte EC2 garde son réseau normal
- ✅ SSH reste accessible sans VPN
- ✅ Seul le bot passe par le VPN
- ✅ Pas de risque de SSH lockout

## 🐛 Troubleshooting

### Le bot ne démarre pas

```bash
docker-compose logs websocket-service
```

### Le VPN ne se connecte pas

```bash
docker-compose logs vpn
```

Vérifie que le fichier `wireguard/wg0.conf` est correct.

### L'IP n'est pas celle de Surfshark

1. Vérifie que le VPN container tourne: `docker-compose ps`
2. Redémarre tout: `docker-compose restart`
3. Vérifie la config WireGuard: `cat wireguard/wg0.conf`

### Permission denied sur wg0.conf

```bash
sudo chmod 600 wireguard/wg0.conf
```

## 📊 Monitoring

Le service WebSocket expose un endpoint `/health` sur le port 8000 (à l'intérieur du réseau VPN).

Pour accéder depuis l'extérieur, tu peux ajouter un reverse proxy nginx si besoin, mais ce n'est pas nécessaire pour le fonctionnement du bot.

## 🔄 Mise à jour

```bash
cd ~/bot-polymarket
git pull
docker-compose up -d --build
```

## 🛑 Arrêt complet

```bash
docker-compose down
```

Les positions ouvertes restent dans la DB et seront surveillées au prochain démarrage.
