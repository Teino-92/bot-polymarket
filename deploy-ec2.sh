#!/bin/bash

# Script de déploiement automatique sur AWS EC2
# Usage: ./deploy-ec2.sh <EC2_IP_ADDRESS>

set -e

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Variables
EC2_IP=$1
KEY_PATH="$HOME/.ssh/polymarket-bot-key.pem"
WG_CONFIG="./websocket-service/wg0.conf"

if [ -z "$EC2_IP" ]; then
    echo -e "${RED}❌ Erreur: IP EC2 manquante${NC}"
    echo "Usage: ./deploy-ec2.sh <EC2_IP_ADDRESS>"
    echo "Exemple: ./deploy-ec2.sh 54.123.45.67"
    exit 1
fi

if [ ! -f "$KEY_PATH" ]; then
    echo -e "${RED}❌ Clé SSH introuvable: $KEY_PATH${NC}"
    echo "Télécharge la clé depuis AWS et place-la dans ~/.ssh/"
    exit 1
fi

if [ ! -f "$WG_CONFIG" ]; then
    echo -e "${RED}❌ Config WireGuard introuvable: $WG_CONFIG${NC}"
    echo "Copie ta config Surfshark dans websocket-service/wg0.conf"
    exit 1
fi

echo -e "${GREEN}🚀 Déploiement sur AWS EC2: $EC2_IP${NC}"

# Étape 1: Copier la config WireGuard
echo -e "\n${YELLOW}📦 Étape 1/5: Copie de la config WireGuard...${NC}"
scp -i "$KEY_PATH" "$WG_CONFIG" "ubuntu@$EC2_IP:/tmp/wg0.conf"

# Étape 2: Installer les dépendances
echo -e "\n${YELLOW}⚙️  Étape 2/5: Installation des dépendances...${NC}"
ssh -i "$KEY_PATH" "ubuntu@$EC2_IP" << 'ENDSSH'
    set -e

    # Update system
    sudo apt update -y

    # Install WireGuard if not installed
    if ! command -v wg &> /dev/null; then
        echo "Installing WireGuard..."
        sudo apt install -y wireguard wireguard-tools
    fi

    # Install unzip (required for Deno)
    if ! command -v unzip &> /dev/null; then
        echo "Installing unzip..."
        sudo apt install -y unzip
    fi

    # Install Deno if not installed
    if ! command -v deno &> /dev/null; then
        echo "Installing Deno..."
        curl -fsSL https://deno.land/install.sh | sh
        echo 'export DENO_INSTALL="/home/ubuntu/.deno"' >> ~/.bashrc
        echo 'export PATH="$DENO_INSTALL/bin:$PATH"' >> ~/.bashrc
    fi

    # Install Git if not installed
    if ! command -v git &> /dev/null; then
        echo "Installing Git..."
        sudo apt install -y git
    fi

    echo "✅ Dependencies installed"
ENDSSH

# Étape 3: Configurer WireGuard
echo -e "\n${YELLOW}🔒 Étape 3/5: Configuration WireGuard...${NC}"
ssh -i "$KEY_PATH" "ubuntu@$EC2_IP" << 'ENDSSH'
    set -e

    # Move WireGuard config
    sudo mv /tmp/wg0.conf /etc/wireguard/wg0.conf
    sudo chmod 600 /etc/wireguard/wg0.conf

    # Stop WireGuard if running
    sudo wg-quick down wg0 2>/dev/null || true

    # Start WireGuard
    sudo wg-quick up wg0

    # Enable on boot
    sudo systemctl enable wg-quick@wg0

    # Verify VPN connection
    echo "Checking VPN IP..."
    PUBLIC_IP=$(curl -s https://api.ipify.org)
    echo "✅ Connected via IP: $PUBLIC_IP"
ENDSSH

# Étape 4: Cloner/Mettre à jour le repo
echo -e "\n${YELLOW}📥 Étape 4/5: Déploiement du code...${NC}"
ssh -i "$KEY_PATH" "ubuntu@$EC2_IP" << 'ENDSSH'
    set -e

    if [ -d "bot-polymarket" ]; then
        echo "Updating existing repo..."
        cd bot-polymarket
        git pull origin main
    else
        echo "Cloning repo..."
        git clone https://github.com/Teino-92/bot-polymarket.git
        cd bot-polymarket
    fi

    echo "✅ Code deployed"
ENDSSH

# Étape 5: Configurer et démarrer le service
echo -e "\n${YELLOW}🔄 Étape 5/5: Configuration du service...${NC}"
ssh -i "$KEY_PATH" "ubuntu@$EC2_IP" << 'ENDSSH'
    set -e

    # Create systemd service file
    sudo tee /etc/systemd/system/polymarket-bot.service > /dev/null << 'EOF'
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
EOF

    # Reload systemd
    sudo systemctl daemon-reload

    # Enable and start service
    sudo systemctl enable polymarket-bot
    sudo systemctl restart polymarket-bot

    # Wait a bit for service to start
    sleep 3

    # Check status
    sudo systemctl status polymarket-bot --no-pager

    echo "✅ Service started"
ENDSSH

# Résumé
echo -e "\n${GREEN}✅ Déploiement terminé!${NC}"
echo -e "\n📊 Pour voir les logs:"
echo -e "  ssh -i $KEY_PATH ubuntu@$EC2_IP"
echo -e "  sudo journalctl -u polymarket-bot -f"
echo -e "\n🌐 N'oublie pas de configurer Vercel:"
echo -e "  NEXT_PUBLIC_WEBSOCKET_URL=http://$EC2_IP:8080"
