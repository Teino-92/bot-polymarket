# Configuration WalletConnect pour Mobile

Pour permettre la connexion depuis mobile, tu dois configurer WalletConnect.

## Étapes

### 1. Créer un Project ID WalletConnect

1. Va sur https://cloud.walletconnect.com/
2. Crée un compte (gratuit)
3. Clique sur "Create New Project"
4. Nom du projet: "Polymarket Trading Bot"
5. Copie le "Project ID"

### 2. Ajouter le Project ID

Ajoute cette ligne dans `.env.local`:

```env
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=ton_project_id_ici
```

### 3. Ajouter dans Vercel

Dans les settings Vercel, ajoute la variable d'environnement:
- Name: `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`
- Value: ton project ID

### 4. Redéployer

```bash
git add -A
git commit -m "Add WalletConnect support for mobile"
git push
vercel --prod --yes --force
```

## Comment ça marche

Sur mobile:
1. Ouvre le site sur ton téléphone
2. Clique sur "WalletConnect (Mobile)"
3. Scanne le QR code avec MetaMask/Trust Wallet
4. Signe le message
5. Tu es connecté!

Sur desktop:
1. Clique sur "MetaMask" si tu as l'extension installée
