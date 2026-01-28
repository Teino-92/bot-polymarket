# 🔒 Configuration de Sécurité

## ⚠️ IMPORTANT: À faire AVANT de connecter ton vrai wallet!

### 1. Configure ton wallet autorisé

Dans `.env.local` et sur Vercel:

```bash
AUTHORIZED_WALLET_ADDRESS=0xVotre-Adresse-Polygon-Ici
```

**C'est quoi cette adresse?**
- L'adresse Polygon que tu utilises pour le bot Polymarket
- Seulement cette adresse pourra accéder au dashboard
- Format: 0x... (42 caractères)

### 2. (Optionnel) Configure un token d'authentification

Pour accès programmatique (scripts, webhooks):

```bash
AUTH_TOKEN=un-token-secret-tres-long-et-aleatoire
```

Génère un token sécurisé:
```bash
# Sur macOS/Linux
openssl rand -hex 32

# Ou utilise un générateur en ligne:
# https://www.uuidgenerator.net/
```

### 3. Ajoute ces variables sur Vercel

```bash
vercel env add AUTHORIZED_WALLET_ADDRESS production
# Colle ton adresse wallet

vercel env add AUTH_TOKEN production
# Colle ton token (optionnel)
```

### 4. Redéploie

```bash
vercel --prod
```

---

## 🔐 Comment ça marche?

### Pages protégées automatiquement:
- ✅ Dashboard (/)
- ✅ Calculators (/calculators)
- ✅ Bot Config (/bot-config)
- ✅ **Toutes les pages** sauf `/login`

### APIs protégées:
- ✅ `/api/positions/[id]/close` - Fermer position
- ⚠️ Autres APIs à protéger manuellement (voir ci-dessous)

### Comment accéder:
1. Va sur ton URL: `https://bot-polymarket-kappa.vercel.app`
2. Tu seras redirigé vers `/login`
3. Entre ton adresse wallet
4. Si elle correspond à `AUTHORIZED_WALLET_ADDRESS`, tu es connecté!
5. Session valide 24h

---

## 🛡️ Protéger les autres APIs (Optionnel mais recommandé)

Pour protéger une route API, ajoute ce code au début:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  // 🔒 AUTH CHECK
  const authResult = verifyAuth(request);
  if (!authResult.authorized) {
    return NextResponse.json(
      { error: 'Unauthorized', reason: authResult.reason },
      { status: 401 }
    );
  }

  // Ton code API ici...
}
```

### APIs à protéger en priorité:
- `/api/bot/config` (POST/PUT)
- `/api/bot/config/pause` (POST)
- `/api/bot/execute` (POST)
- `/api/positions` (POST/DELETE)

---

## 🔑 Utiliser le token d'authentification (API access)

Si tu veux appeler les APIs depuis un script externe:

```bash
curl -H "Authorization: Bearer ton-auth-token" \
  https://bot-polymarket-kappa.vercel.app/api/positions/123/close \
  -X POST
```

---

## ✅ Checklist de Sécurité

Avant de mettre ton vrai wallet:

- [ ] `AUTHORIZED_WALLET_ADDRESS` configuré en local
- [ ] `AUTHORIZED_WALLET_ADDRESS` ajouté sur Vercel
- [ ] `AUTH_TOKEN` généré (optionnel)
- [ ] Redéploiement effectué
- [ ] Test de connexion avec ta wallet
- [ ] Test de connexion avec une wallet non-autorisée (doit être refusée)
- [ ] APIs sensibles protégées

---

## 🆘 Problèmes?

**Je ne peux pas me connecter:**
- Vérifie que l'adresse dans `.env` correspond EXACTEMENT à celle que tu entres
- Les addresses sont en minuscules
- Format: `0x...` (42 caractères)

**Session expire trop vite:**
- Par défaut: 24h
- Pour changer: édite `lib/auth.ts` → `24 * 60 * 60 * 1000`

**Quelqu'un a accédé sans autorisation:**
- Change immédiatement `AUTH_TOKEN`
- Vérifie les logs Vercel
- Redéploie

---

## 🚨 En cas de compromission

1. **Immédiatement:**
   ```bash
   # Change le token
   vercel env rm AUTH_TOKEN production
   vercel env add AUTH_TOKEN production
   # Nouveau token ici

   # Redéploie
   vercel --prod
   ```

2. **Change le wallet du bot si nécessaire**

3. **Vérifie les positions ouvertes**

---

## 📊 Monitoring

**Voir qui accède au dashboard:**
```bash
vercel logs --prod
```

**Filtrer les tentatives d'auth:**
```bash
vercel logs --prod | grep "Unauthorized"
```

---

**Tu es maintenant protégé!** 🛡️

Seul le wallet configuré peut accéder au dashboard et fermer tes positions.
