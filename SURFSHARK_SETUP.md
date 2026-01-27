# 🌍 Setup Surfshark VPN pour Polymarket (France)

Ce guide explique comment utiliser ton abonnement Surfshark **GRATUIT** pour faire tourner le bot depuis la France.

## 🎯 Solutions disponibles

### Option 1: VPN sur ton PC (LE PLUS SIMPLE) ⭐

**Avantages:** 100% gratuit, setup immédiat
**Inconvénients:** Le bot s'arrête si ton PC s'éteint

#### Setup:

1. **Active Surfshark sur ton PC**
   - Lance l'app Surfshark
   - Connecte-toi à un serveur USA ou UK
   - Vérifie ta nouvelle IP sur https://whatismyip.com

2. **Lance le bot localement**
   ```bash
   # Terminal 1 - Supabase local
   supabase start

   # Terminal 2 - WebSocket service
   cd websocket-service
   deno run --allow-net --allow-env index.ts

   # Terminal 3 - Frontend
   npm run dev
   ```

3. **C'est tout!** Le bot utilise maintenant ton VPN automatiquement

#### Pour un bot 24/7:
- Laisse ton PC allumé avec Surfshark connecté
- Configure ton PC pour ne jamais se mettre en veille
- Active "Auto-connect" dans Surfshark

---

### Option 2: Railway avec WireGuard (AVANCÉ) 🚀

**Avantages:** Bot tourne 24/7, pas besoin de laisser ton PC allumé
**Inconvénients:** Setup technique

#### Prérequis:
- Railway gratuit ($5/mois de crédit gratuit)
- Surfshark (tu l'as déjà!)

#### Setup:

1. **Récupère ta config WireGuard Surfshark**

   a. Va sur https://my.surfshark.com/

   b. Clique sur "Locations" → "Manual setup" → "WireGuard"

   c. Choisis un serveur USA ou UK (ex: "New York - #123")

   d. Clique "Generate configuration"

   e. Télécharge le fichier `.conf`

2. **Configure le WebSocket service**

   ```bash
   cd websocket-service

   # Copie ta config Surfshark téléchargée
   cp ~/Downloads/surfshark-us-ny-xxx.conf wg0.conf

   # Vérifie que wg0.conf existe
   cat wg0.conf
   ```

3. **Deploy sur Railway**

   ```bash
   # Installe Railway CLI
   npm install -g @railway/cli

   # Login
   railway login

   # Créer un nouveau projet
   railway init

   # Deploy avec Docker
   railway up
   ```

4. **Vérifie la connexion VPN**

   Dans les logs Railway, tu devrais voir:
   ```
   🔒 Starting WireGuard VPN...
   🌍 Checking public IP...
   ✅ Connected via IP: 123.45.67.89 (US)
   🚀 Starting WebSocket service...
   ```

---

## 🔍 Vérifier que le VPN fonctionne

### Test 1: Vérifier ton IP publique

```bash
# Depuis ton terminal avec VPN actif
curl https://api.ipify.org

# Tu devrais voir une IP USA/UK, pas française
```

### Test 2: Tester l'accès Polymarket

```bash
curl https://clob.polymarket.com/markets

# Si ça marche, tu verras du JSON avec les marchés
# Si bloqué, tu verras une erreur 403
```

### Test 3: Vérifier dans les logs

Dans les logs du bot, recherche:
```
[POLYMARKET] Fetched X markets from Gamma API
```

Si tu vois ça, c'est que Polymarket fonctionne! ✅

---

## ⚠️ Limitations Railway gratuit

Railway offre **$5 gratuit/mois**:
- ~550 heures de runtime (~23 jours)
- Si tu dépasses, bot s'arrête jusqu'au mois prochain
- Pour 24/7 permanent, passe au plan $5/mois

---

## 🆘 Troubleshooting

### Le VPN ne se connecte pas sur Railway

**Problème:** Logs montrent "WireGuard failed"

**Solution:**
1. Vérifie que `wg0.conf` est bien présent
2. Regénère une nouvelle config WireGuard sur Surfshark
3. Essaie un autre serveur (NY, LA, London, etc.)

### Le bot ne voit pas les marchés Polymarket

**Problème:** Logs montrent "Falling back to mock markets"

**Solution:**
1. Vérifie ton IP avec `curl https://api.ipify.org`
2. Si IP est française, le VPN n'est pas actif
3. Redémarre le service avec VPN

### Railway dit "Privileged mode required"

**Solution:**
Railway ne supporte pas le mode privilégié requis par WireGuard.

**Alternative:** Utilise l'Option 1 (VPN sur ton PC)

---

## 💡 Recommandation finale

**Pour commencer:** Utilise l'**Option 1** (VPN sur ton PC)
- C'est immédiat et gratuit
- Parfait pour tester le bot
- Tu peux toujours migrer vers Option 2 après

**Pour du 24/7:** Passe à l'**Option 2** (Railway + WireGuard)
- Nécessite plus de setup mais tourne H24
- Ou laisse juste ton PC allumé avec Option 1 😉

---

## 📞 Support

Si tu as des questions:
1. Vérifie d'abord la section Troubleshooting ci-dessus
2. Regarde les logs Railway/terminal pour les erreurs
3. Teste ta connexion VPN avec les commandes Test ci-dessus
