# 🤖 Bot Service - EC2 Deployment

Service Deno qui s'exécute sur EC2 (us-east-1) et lance le bot Polymarket toutes les 30 minutes.

## 🎯 Pourquoi ce service?

**Problème**: GitHub Actions tourne dans différents data centers (pas toujours US), ce qui peut causer des blocages géographiques de Polymarket.

**Solution**: Exécuter le bot directement depuis EC2 en Virginie (us-east-1) = IP américaine garantie ✅

## 📦 Architecture

```
┌────────────────────────────────────────────────────┐
│                 EC2 (us-east-1)                    │
│                                                    │
│  ┌──────────────────────────────────────────┐    │
│  │  Bot Service (Deno)                      │    │
│  │  - Exécute toutes les 30 minutes         │    │
│  │  - Appelle /api/bot/execute              │    │
│  │  - Auto-restart avec systemd             │    │
│  └───────────────┬──────────────────────────┘    │
│                  │                                 │
└──────────────────┼─────────────────────────────────┘
                   │
                   ▼
         ┌─────────────────────┐
         │   Vercel Dashboard  │
         │   /api/bot/execute  │
         └─────────────────────┘
                   │
                   ▼
         ┌─────────────────────┐
         │   Polymarket API    │
         │   (accepts US IPs)  │
         └─────────────────────┘
```

## 🚀 Installation sur EC2

### Étape 1: Connexion SSH

```bash
ssh -i your-key.pem ubuntu@your-ec2-ip
```

### Étape 2: Installer Deno (si pas déjà fait)

```bash
curl -fsSL https://deno.land/install.sh | sh

# Ajouter au PATH
echo 'export DENO_INSTALL="/home/ubuntu/.deno"' >> ~/.bashrc
echo 'export PATH="$DENO_INSTALL/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc

# Vérifier installation
deno --version
```

### Étape 3: Cloner le repo (ou créer les fichiers)

**Option A: Clone complet**
```bash
cd ~
git clone https://github.com/Teino-92/bot-polymarket.git
cd bot-polymarket/bot-service
```

**Option B: Copier juste le dossier bot-service**
```bash
mkdir -p ~/bot-polymarket/bot-service
cd ~/bot-polymarket/bot-service

# Copier les fichiers depuis ton local via scp
# (depuis ton ordinateur, pas sur EC2)
scp -i your-key.pem bot-service/* ubuntu@your-ec2-ip:~/bot-polymarket/bot-service/
```

### Étape 4: Configuration

```bash
cd ~/bot-polymarket/bot-service

# Créer le fichier .env
cp .env.example .env
nano .env
```

Remplir avec tes valeurs:
```env
VERCEL_API_URL=https://bot-polymarket-fg22kl0nh-matteo-garbuglis-projects.vercel.app
CRON_SECRET=ton-cron-secret-depuis-github-secrets
EXECUTION_INTERVAL_MINUTES=30
```

**IMPORTANT**: Le `CRON_SECRET` doit être le MÊME que celui configuré dans GitHub Secrets et sur Vercel.

### Étape 5: Test manuel

```bash
# Lancer manuellement pour tester
deno run --allow-net --allow-env --allow-read --env-file=.env main.ts
```

Tu devrais voir:
```
╔═══════════════════════════════════════════════════════════╗
║              🤖 POLYMARKET BOT SERVICE                    ║
╚═══════════════════════════════════════════════════════════╝

📍 Location: EC2 us-east-1 (Virginia, USA)
🎯 Target: https://bot-polymarket-fg22kl0nh-matteo-garbuglis-projects.vercel.app
⏰ Interval: 30 minutes
🚀 Starting...
```

Si ça fonctionne bien, passe à l'étape 6. Sinon, vérifie:
- Le `CRON_SECRET` est correct
- Le dashboard Vercel est accessible
- Les variables d'environnement Vercel sont bien configurées

Ctrl+C pour arrêter.

### Étape 6: Installation du service systemd

```bash
# Copier le fichier service
sudo cp polymarket-bot.service /etc/systemd/system/

# Créer les fichiers de log
sudo touch /var/log/polymarket-bot.log
sudo touch /var/log/polymarket-bot-error.log
sudo chown ubuntu:ubuntu /var/log/polymarket-bot*.log

# Recharger systemd
sudo systemctl daemon-reload

# Activer le service (démarrage automatique au boot)
sudo systemctl enable polymarket-bot.service

# Démarrer le service
sudo systemctl start polymarket-bot.service
```

### Étape 7: Vérification

```bash
# Vérifier le status
sudo systemctl status polymarket-bot.service

# Voir les logs en temps réel
tail -f /var/log/polymarket-bot.log

# Voir les erreurs (si problème)
tail -f /var/log/polymarket-bot-error.log
```

Tu devrais voir quelque chose comme:
```
🤖 POLYMARKET BOT SERVICE
📍 Location: EC2 us-east-1 (Virginia, USA)
⏰ Interval: 30 minutes
🚀 Starting...

⏰ [2026-02-02T14:00:00.000Z] Starting bot execution cycle
✅ Bot execution completed successfully
📊 Result: {...}

⏳ Waiting 30 minutes until next execution...
⏰ Next execution at: 02/02/2026, 14:30:00
```

## 🔧 Commandes utiles

### Contrôle du service

```bash
# Démarrer
sudo systemctl start polymarket-bot.service

# Arrêter
sudo systemctl stop polymarket-bot.service

# Redémarrer
sudo systemctl restart polymarket-bot.service

# Status
sudo systemctl status polymarket-bot.service

# Logs
sudo journalctl -u polymarket-bot.service -f
tail -f /var/log/polymarket-bot.log
```

### Mise à jour du code

```bash
cd ~/bot-polymarket
git pull
sudo systemctl restart polymarket-bot.service
```

### Changer l'intervalle d'exécution

```bash
cd ~/bot-polymarket/bot-service
nano .env

# Modifier EXECUTION_INTERVAL_MINUTES
# Par exemple: 15 pour toutes les 15 minutes

sudo systemctl restart polymarket-bot.service
```

## 📊 Monitoring

### Voir les statistiques

Les stats s'affichent dans les logs après chaque exécution:

```bash
tail -f /var/log/polymarket-bot.log
```

Tu verras:
```
────────────────────────────────────────────────────────────
📊 EXECUTION STATISTICS
────────────────────────────────────────────────────────────
Total Executions:      42
✅ Successful:         40
❌ Failed:             2
📈 Success Rate:       95.2%
🟢 Last Success:       2026-02-02T14:30:00.000Z
🔴 Last Failure:       2026-02-02T12:00:00.000Z
────────────────────────────────────────────────────────────
```

### Alertes en cas de problème

Le service redémarre automatiquement en cas de crash (grace à systemd).

Si tu veux être notifié, tu peux:
1. Utiliser les notifications Telegram (déjà configurées dans le bot)
2. Monitorer via CloudWatch sur AWS
3. Configurer un script qui vérifie les logs

## 🔒 Sécurité

### Bonnes pratiques

✅ Le fichier `.env` n'est jamais commité (`.gitignore`)
✅ Les logs ne contiennent pas de secrets
✅ Le service tourne avec l'utilisateur `ubuntu` (pas root)
✅ Communication HTTPS uniquement

### Rotation des secrets

Si tu dois changer le `CRON_SECRET`:

1. Générer un nouveau secret:
```bash
openssl rand -hex 32
```

2. Mettre à jour sur GitHub Secrets
3. Mettre à jour sur Vercel Environment Variables
4. Mettre à jour dans `.env` sur EC2:
```bash
nano ~/bot-polymarket/bot-service/.env
```

5. Redémarrer le service:
```bash
sudo systemctl restart polymarket-bot.service
```

## 🐛 Troubleshooting

### Le service ne démarre pas

```bash
# Vérifier les logs d'erreur
sudo journalctl -u polymarket-bot.service -n 50

# Vérifier les permissions
ls -la ~/bot-polymarket/bot-service/

# Vérifier que Deno est installé
deno --version
which deno
```

### Erreur 401 Unauthorized

Le `CRON_SECRET` n'est pas correct. Vérifie:
```bash
# Sur EC2
cat ~/bot-polymarket/bot-service/.env

# Compare avec GitHub Secrets et Vercel
```

### Le bot s'exécute mais ne trade pas

Vérifie dans les logs Vercel si le bot est en mode SIMULATION ou PRODUCTION.

Dashboard Vercel → Logs → Rechercher "SIMULATION"

### "Connection refused" ou timeout

Vérifie:
1. Le dashboard Vercel est accessible: `curl https://bot-polymarket-fg22kl0nh-matteo-garbuglis-projects.vercel.app/api/health`
2. Les Security Groups EC2 permettent le trafic sortant HTTPS (port 443)

## 💰 Coûts

**EC2 t2.micro (Free Tier)**:
- 750 heures/mois gratuit pendant 12 mois
- Ensuite: ~$8-10/mois

**Trafic réseau**:
- Négligeable (quelques MB/jour)
- 1 GB sortant gratuit/mois

**Total estimé**: $0 (Free Tier) ou $8-10/mois après

## ⚙️ Configuration avancée

### Changer le port (si besoin d'un endpoint HTTP)

Par défaut, ce service fait juste des appels HTTP sortants. Si tu veux exposer un endpoint (health check, etc.), modifie `main.ts`:

```typescript
// Ajouter un serveur HTTP basique
Deno.serve({ port: 8080 }, () => new Response("Bot service is running"));
```

### Logs rotationnels

Pour éviter que les logs deviennent trop gros:

```bash
sudo nano /etc/logrotate.d/polymarket-bot
```

Contenu:
```
/var/log/polymarket-bot*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
}
```

## 📞 Support

Questions? Ouvre une issue sur GitHub ou vérifie les docs:
- [README principal](../README.md)
- [Documentation de déploiement EC2](../DEPLOY_EC2_WEBSOCKET.md)
- [Guide de production](../PASSAGE_EN_PRODUCTION.md)

---

**Version**: 1.0
**Dernière mise à jour**: 2026-02-02
