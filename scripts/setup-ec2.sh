#!/bin/bash

# Script d'installation automatique pour EC2
# Usage: bash <(curl -s https://raw.githubusercontent.com/Teino-92/bot-polymarket/main/scripts/setup-ec2.sh)

set -e

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║     🤖 POLYMARKET BOT - EC2 Setup (Allemagne)           ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# 1. Installer Deno
echo "📦 Installation de Deno..."
curl -fsSL https://deno.land/install.sh | sh

# Ajouter Deno au PATH
echo 'export DENO_INSTALL="/home/ubuntu/.deno"' >> ~/.bashrc
echo 'export PATH="$DENO_INSTALL/bin:$PATH"' >> ~/.bashrc
export DENO_INSTALL="/home/ubuntu/.deno"
export PATH="$DENO_INSTALL/bin:$PATH"

# 2. Cloner le repo
echo "📥 Clonage du repository..."
cd ~
if [ -d "bot-polymarket" ]; then
  echo "⚠️  Le dossier bot-polymarket existe déjà, mise à jour..."
  cd bot-polymarket
  git pull
else
  git clone https://github.com/Teino-92/bot-polymarket.git
  cd bot-polymarket
fi

# 3. Configuration bot-service
echo "⚙️  Configuration du bot-service..."
cd ~/bot-polymarket/bot-service

if [ ! -f .env ]; then
  cp .env.example .env
  echo ""
  echo "⚠️  IMPORTANT: Édite le fichier .env avec tes valeurs:"
  echo "   nano ~/bot-polymarket/bot-service/.env"
  echo ""
  read -p "Appuie sur Entrée pour continuer..."
fi

# 4. Test de connexion Polymarket
echo "🧪 Test de connexion à Polymarket..."
/home/ubuntu/.deno/bin/deno run --allow-net ~/bot-polymarket/scripts/test-polymarket-access.ts

# 5. Installer le service systemd
echo "📋 Installation du service systemd..."
sudo cp ~/bot-polymarket/bot-service/polymarket-bot.service /etc/systemd/system/

# Créer les fichiers de log
sudo touch /var/log/polymarket-bot.log
sudo touch /var/log/polymarket-bot-error.log
sudo chown ubuntu:ubuntu /var/log/polymarket-bot*.log

# Recharger systemd
sudo systemctl daemon-reload

echo ""
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║                  ✅ INSTALLATION TERMINÉE                ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""
echo "📝 Prochaines étapes:"
echo ""
echo "1. Édite la configuration:"
echo "   nano ~/bot-polymarket/bot-service/.env"
echo ""
echo "2. Démarre le service:"
echo "   sudo systemctl enable polymarket-bot.service"
echo "   sudo systemctl start polymarket-bot.service"
echo ""
echo "3. Vérifie les logs:"
echo "   sudo systemctl status polymarket-bot.service"
echo "   tail -f /var/log/polymarket-bot.log"
echo ""
