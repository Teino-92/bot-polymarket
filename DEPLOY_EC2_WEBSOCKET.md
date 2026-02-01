# 🚀 Déploiement WebSocket sur EC2

**Objectif**: Déployer le service WebSocket (`websocket-service/main.ts`) sur ton EC2 pour monitorer les positions 24/7 et fermer automatiquement les positions quand le take-profit/stop-loss est atteint.

---

## ✅ Corrections Appliquées

Le service WebSocket a été corrigé pour:

1. ✅ **Chercher dans la bonne table** (`positions` au lieu de `trades`)
2. ✅ **Supprimer la position** de la table `positions` après fermeture
3. ✅ **Envoyer notification Telegram** quand position fermée
4. ✅ **Mettre à jour le trade** dans la table `trades`

---

## 📋 Prérequis

Tu dois avoir:
- ✅ Un EC2 déjà configuré et accessible via SSH
- ✅ Deno installé sur EC2
- ✅ Les credentials Supabase
- ✅ Les credentials Telegram

---

## 🔧 Étape 1: Se connecter à EC2

```bash
# Depuis ton Mac, connecte-toi à ton EC2
ssh -i /path/to/your-key.pem ubuntu@your-ec2-ip
```

**Ou** si tu as déjà un alias:

```bash
ssh ec2-polymarket
```

---

## 🔧 Étape 2: Installer Deno (si pas déjà fait)

```bash
# Vérifier si Deno est installé
deno --version

# Si pas installé, installer Deno
curl -fsSL https://deno.land/install.sh | sh

# Ajouter au PATH
echo 'export DENO_INSTALL="$HOME/.deno"' >> ~/.bashrc
echo 'export PATH="$DENO_INSTALL/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc

# Vérifier installation
deno --version
```

---

## 🔧 Étape 3: Cloner le repo sur EC2

```bash
# Si pas déjà fait
cd ~
git clone https://github.com/Teino-92/bot-polymarket.git
cd bot-polymarket/websocket-service
```

**Si déjà cloné**, faire un pull:

```bash
cd ~/bot-polymarket
git pull origin main
cd websocket-service
```

---

## 🔧 Étape 4: Configurer les variables d'environnement

```bash
# Créer le fichier .env
nano .env
```

Copier-coller:

```env
SUPABASE_URL=https://jiavycnibezhmdepdgqk.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImppYXZ5Y25pYmV6aG1kZXBkZ3FrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzUzODQ2NzgsImV4cCI6MjA1MDk2MDY3OH0.OIFXVZljJmF_fMfJ0TuqbwGZVnkrNdRmLWfJ12OLXJs
TELEGRAM_BOT_TOKEN=8190369966:AAH6mMytuMj-_m1SpgBhhxm69Jvwn8DCf2M
TELEGRAM_CHAT_ID=1677421987
```

Sauvegarder: `Ctrl+X` → `Y` → `Enter`

---

## 🔧 Étape 5: Tester le service localement

```bash
# Lancer le service
deno run --allow-net --allow-env --allow-read --env-file=.env main.ts
```

Tu devrais voir:

```
WebSocket service starting on port 8000...
```

**Test dans un autre terminal**:

```bash
# Se connecter à EC2 dans un 2ème terminal
ssh ubuntu@your-ec2-ip

# Tester le health check
curl http://localhost:8000/health
```

Réponse attendue:

```json
{
  "status": "ok",
  "lastUpdate": null,
  "connectedClients": 0,
  "service": "Polymarket WebSocket Monitor"
}
```

Si ça marche, arrêter avec `Ctrl+C` et passer à l'étape suivante.

---

## 🔧 Étape 6: Créer un service systemd (auto-restart)

```bash
# Créer le fichier service
sudo nano /etc/systemd/system/polymarket-websocket.service
```

Copier-coller:

```ini
[Unit]
Description=Polymarket WebSocket Monitor
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/bot-polymarket/websocket-service
ExecStart=/home/ubuntu/.deno/bin/deno run --allow-net --allow-env --allow-read --env-file=.env main.ts
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

**Important**: Vérifie que le chemin `/home/ubuntu/.deno/bin/deno` est correct:

```bash
which deno
# Si différent, utilise le chemin retourné
```

Sauvegarder: `Ctrl+X` → `Y` → `Enter`

---

## 🔧 Étape 7: Démarrer le service

```bash
# Recharger systemd
sudo systemctl daemon-reload

# Activer le service au démarrage
sudo systemctl enable polymarket-websocket

# Démarrer le service
sudo systemctl start polymarket-websocket

# Vérifier le statut
sudo systemctl status polymarket-websocket
```

Tu devrais voir:

```
● polymarket-websocket.service - Polymarket WebSocket Monitor
   Loaded: loaded (/etc/systemd/system/polymarket-websocket.service; enabled)
   Active: active (running) since ...
```

---

## 🔧 Étape 8: Ouvrir le port 8000 (Security Group AWS)

1. Va sur AWS Console → EC2 → Security Groups
2. Sélectionne le Security Group de ton EC2
3. **Inbound Rules** → **Edit inbound rules**
4. **Add rule**:
   - **Type**: Custom TCP
   - **Port range**: 8000
   - **Source**: `0.0.0.0/0` (ou ton IP seulement pour plus de sécurité)
5. **Save rules**

---

## 🔧 Étape 9: Mettre à jour l'URL dans Vercel

1. Récupère l'IP publique de ton EC2:

```bash
# Sur EC2
curl http://checkip.amazonaws.com
```

Exemple: `54.123.45.67`

2. L'URL WebSocket sera: `http://54.123.45.67:8000`

3. Mettre à jour dans Vercel:

```bash
# Sur ton Mac, dans le repo
vercel env add NEXT_PUBLIC_WEBSOCKET_URL production
# Entrer: http://54.123.45.67:8000
```

4. Redéployer:

```bash
git add .
git commit -m "fix: Update WebSocket service to fix TP/SL monitoring

- Fix: Query positions table instead of trades table
- Fix: Delete position from positions table after close
- Add: Telegram notifications when position closed by WebSocket
- Add: Proper PnL calculation and trade update"
git push

vercel --prod
```

---

## 🧪 Étape 10: Tester

### Test 1: Health check depuis ton Mac

```bash
curl http://YOUR-EC2-IP:8000/health
```

Réponse attendue:

```json
{
  "status": "ok",
  "lastUpdate": "2026-02-01T...",
  "connectedClients": 0,
  "service": "Polymarket WebSocket Monitor"
}
```

### Test 2: Vérifier les logs sur EC2

```bash
# Sur EC2
sudo journalctl -u polymarket-websocket -f
```

Tu devrais voir toutes les 10 secondes:

```
[2026-02-01T...] Checking 1 positions...
[Market Name] Entry: 0.45, Current: 0.47, SL: 0.383, TP: 0.486
```

### Test 3: Vérifier le Dashboard

1. Va sur `https://bot-polymarket-kappa.vercel.app`
2. Le statut WebSocket devrait être: **🟢 Connected**
3. "Last Activity" devrait afficher "il y a Xs"

### Test 4: Tester une fermeture automatique

**Option A**: Attendre qu'une vraie position atteigne son TP/SL

**Option B**: Modifier manuellement le TP dans Supabase pour forcer fermeture:

1. Va sur Supabase → Table Editor → `positions`
2. Modifie `take_profit_price` pour qu'il soit égal au prix actuel
3. Attends 10 secondes
4. La position devrait se fermer automatiquement
5. Tu devrais recevoir une notification Telegram

---

## 🔧 Commandes Utiles

```bash
# Voir les logs en temps réel
sudo journalctl -u polymarket-websocket -f

# Redémarrer le service
sudo systemctl restart polymarket-websocket

# Arrêter le service
sudo systemctl stop polymarket-websocket

# Voir le statut
sudo systemctl status polymarket-websocket

# Mettre à jour le code
cd ~/bot-polymarket
git pull origin main
sudo systemctl restart polymarket-websocket
```

---

## 🐛 Troubleshooting

### Problème: Service ne démarre pas

```bash
# Vérifier les logs d'erreur
sudo journalctl -u polymarket-websocket -n 50

# Vérifier les permissions
ls -la /home/ubuntu/bot-polymarket/websocket-service/.env

# Tester manuellement
cd /home/ubuntu/bot-polymarket/websocket-service
deno run --allow-net --allow-env --allow-read --env-file=.env main.ts
```

### Problème: WebSocket offline dans le dashboard

1. Vérifier que le service tourne:

```bash
sudo systemctl status polymarket-websocket
```

2. Vérifier que le port 8000 est ouvert:

```bash
curl http://localhost:8000/health
```

3. Vérifier le Security Group AWS (port 8000 ouvert)

4. Vérifier l'URL dans Vercel:

```bash
vercel env ls
# Chercher NEXT_PUBLIC_WEBSOCKET_URL
```

### Problème: Positions ne se ferment pas

1. Vérifier les logs:

```bash
sudo journalctl -u polymarket-websocket -f
```

2. Vérifier que le service interroge bien la table `positions`:

```bash
# Dans les logs, chercher:
# "Checking X positions..."
```

3. Vérifier que les TP/SL sont bien définis dans Supabase:

```sql
-- Dans Supabase SQL Editor
SELECT id, market_name, entry_price, stop_loss_price, take_profit_price
FROM positions;
```

---

## ✅ Checklist Finale

- [ ] Service WebSocket tourne sur EC2
- [ ] Port 8000 ouvert dans Security Group
- [ ] Health check fonctionne: `curl http://EC2-IP:8000/health`
- [ ] Dashboard affiche "🟢 Connected"
- [ ] Logs montrent "Checking X positions..." toutes les 10s
- [ ] Variables d'env Telegram configurées
- [ ] URL mise à jour dans Vercel
- [ ] Test de fermeture automatique réussi

---

**Auteur**: Bot Polymarket Team
**Date**: 2026-02-01
**Version**: 1.0
