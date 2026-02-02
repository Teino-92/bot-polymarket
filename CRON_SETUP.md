# Configuration du Cron GitHub Actions

Le bot s'exécute automatiquement toutes les 30 minutes via GitHub Actions.

## Configuration Requise

### 1. Créer un Secret CRON_SECRET

1. Va sur GitHub: https://github.com/Teino-92/bot-polymarket/settings/secrets/actions
2. Clique sur "New repository secret"
3. Name: `CRON_SECRET`
4. Value: Génère une clé secrète aléatoire (tu peux utiliser la commande ci-dessous)

```bash
# Générer une clé secrète aléatoire (32 caractères)
openssl rand -hex 32
```

5. Clique sur "Add secret"

### 2. Ajouter le Secret dans Vercel

1. Va sur Vercel: https://vercel.com/matteo-garbuglis-projects/bot-polymarket/settings/environment-variables
2. Ajoute une nouvelle variable d'environnement:
   - Name: `CRON_SECRET`
   - Value: La même valeur que dans GitHub
   - Environnements: Production, Preview, Development

3. Redéploie l'application

```bash
vercel --prod --yes
```

## Fréquence d'Exécution

Le bot s'exécute automatiquement:
- **Toutes les 30 minutes**: Pour un meilleur monitoring des Take-Profit et Stop-Loss

Pour changer la fréquence, modifie `.github/workflows/bot-cron.yml`:

```yaml
schedule:
  # Toutes les 15 minutes (très fréquent)
  - cron: '*/15 * * * *'

  # Toutes les 30 minutes (actuel - recommandé)
  - cron: '*/30 * * * *'

  # Toutes les heures
  - cron: '0 * * * *'

  # Toutes les 2 heures
  - cron: '0 */2 * * *'
```

## Exécution Manuelle

Tu peux aussi déclencher le bot manuellement:

1. Va sur: https://github.com/Teino-92/bot-polymarket/actions/workflows/bot-cron.yml
2. Clique sur "Run workflow"
3. Clique sur "Run workflow" (bouton vert)

## Vérifier les Logs

Pour voir les logs d'exécution:
1. Va sur: https://github.com/Teino-92/bot-polymarket/actions
2. Clique sur le workflow "Bot Polymarket - Cron Job"
3. Clique sur une exécution pour voir les détails

## Résolution des Problèmes

### Erreur 401 Unauthorized
- Vérifie que `CRON_SECRET` est configuré dans GitHub Actions et Vercel
- Vérifie que les valeurs sont identiques
- Redéploie l'application après avoir ajouté le secret Vercel

### Erreur 500 Internal Server Error
- Vérifie les logs Vercel: `vercel logs bot-polymarket-kappa.vercel.app`
- Vérifie que toutes les variables d'environnement sont configurées
- Vérifie que le mode simulation est activé si tu testes

### Le bot ne s'exécute pas
- Vérifie que GitHub Actions est activé dans les settings du repo
- Vérifie la cron syntax sur https://crontab.guru/
- Les crons GitHub Actions peuvent avoir jusqu'à 15 minutes de retard
