# 🔒 Security Configuration

## ⚠️ IMPORTANT: Do this BEFORE connecting your real wallet!

### 1. Configure your authorized wallet

In `.env.local` and on Vercel:

```bash
AUTHORIZED_WALLET_ADDRESS=0xYour-Polygon-Address-Here
```

**What is this address?**
- The Polygon address you use for the Polymarket bot
- Only this address will be able to access the dashboard
- Format: 0x... (42 characters)

### 2. (Optional) Configure an authentication token

For programmatic access (scripts, webhooks):

```bash
AUTH_TOKEN=a-very-long-and-random-secret-token
```

Generate a secure token:
```bash
# On macOS/Linux
openssl rand -hex 32

# Or use an online generator:
# https://www.uuidgenerator.net/
```

### 3. Add these variables on Vercel

```bash
vercel env add AUTHORIZED_WALLET_ADDRESS production
# Paste your wallet address

vercel env add AUTH_TOKEN production
# Paste your token (optional)
```

### 4. Redeploy

```bash
vercel --prod
```

---

## 🔐 How does it work?

### Automatically protected pages:
- ✅ Dashboard (/)
- ✅ Calculators (/calculators)
- ✅ Bot Config (/bot-config)
- ✅ **All pages** except `/login`

### Protected APIs:
- ✅ `/api/positions/[id]/close` - Close position
- ⚠️ Other APIs need manual protection (see below)

### How to access:
1. Go to your URL: `https://bot-polymarket-xxx.vercel.app`
2. You'll be redirected to `/login`
3. Enter your wallet address
4. If it matches `AUTHORIZED_WALLET_ADDRESS`, you're logged in!
5. Session valid for 24h

---

## 🛡️ Protect other APIs (Optional but recommended)

To protect an API route, add this code at the beginning:

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

  // Your API code here...
}
```

### APIs to protect as priority:
- `/api/bot/config` (POST/PUT)
- `/api/bot/config/pause` (POST)
- `/api/bot/execute` (POST)
- `/api/positions` (POST/DELETE)

---

## 🔑 Using the authentication token (API access)

If you want to call APIs from an external script:

```bash
curl -H "Authorization: Bearer your-auth-token" \
  https://bot-polymarket-xxx.vercel.app/api/positions/123/close \
  -X POST
```

---

## ✅ Security Checklist

Before connecting your real wallet:

- [ ] `AUTHORIZED_WALLET_ADDRESS` configured locally
- [ ] `AUTHORIZED_WALLET_ADDRESS` added on Vercel
- [ ] `AUTH_TOKEN` generated (optional)
- [ ] Redeployment completed
- [ ] Test connection with your wallet
- [ ] Test connection with an unauthorized wallet (should be rejected)
- [ ] Sensitive APIs protected

---

## 🆘 Problems?

**I can't connect:**
- Verify that the address in `.env` matches EXACTLY what you enter
- Addresses are in lowercase
- Format: `0x...` (42 characters)

**Session expires too quickly:**
- Default: 24h
- To change: edit `lib/auth.ts` → `24 * 60 * 60 * 1000`

**Someone accessed without authorization:**
- Immediately change `AUTH_TOKEN`
- Check Vercel logs
- Redeploy

---

## 🚨 In case of compromise

1. **Immediately:**
   ```bash
   # Change the token
   vercel env rm AUTH_TOKEN production
   vercel env add AUTH_TOKEN production
   # New token here

   # Redeploy
   vercel --prod
   ```

2. **Change the bot's wallet if necessary**

3. **Check open positions**

---

## 📊 Monitoring

**See who accesses the dashboard:**
```bash
vercel logs --prod
```

**Filter auth attempts:**
```bash
vercel logs --prod | grep "Unauthorized"
```

---

**You're now protected!** 🛡️

Only the configured wallet can access the dashboard and close your positions.
