# 🚀 Production Deployment Guide (Railway/Render)

Complete guide for deploying the Polymarket Trading Bot to production using **free hosting options**.

**Use this guide if:**
- ✅ You're in a country where Polymarket is accessible (US, UK, etc.)
- ✅ You want 100% free hosting (no credit card required for Railway free tier)
- ✅ You don't need VPN

**Use [DEPLOYMENT.md](./DEPLOYMENT.md) instead if:**
- You need to deploy on your own EC2 instance
- You're in a restricted country and need VPN

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    PRODUCTION ARCHITECTURE               │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌────────────┐      ┌──────────────┐                  │
│  │ Polymarket │──────│ Gamma API    │                  │
│  │            │      │              │                   │
│  └────────────┘      └──────────────┘                   │
│         │                                                │
│         │ WebSocket                                      │
│         ▼                                                │
│  ┌────────────────────────┐                             │
│  │  WebSocket Service     │                             │
│  │  (Railway/Render)      │◄─── Railway/Render (Free)  │
│  │  - Real-time monitoring│                             │
│  │  - Stop-loss/TP auto   │                             │
│  └───────────┬────────────┘                             │
│              │                                           │
│              ▼                                           │
│  ┌────────────────────────┐                             │
│  │  Supabase              │                             │
│  │  - PostgreSQL DB       │◄─── Supabase Cloud (Free)  │
│  │  - API                 │                             │
│  └───────────┬────────────┘                             │
│              │                                           │
│              ▼                                           │
│  ┌────────────────────────┐                             │
│  │  Dashboard             │                             │
│  │  - Next.js 15 App      │◄─── Vercel (Free)          │
│  │  - API Routes          │                             │
│  │  - Bot Configuration   │                             │
│  └────────────────────────┘                             │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## Prerequisites

- GitHub account
- Supabase account
- Vercel account
- Railway or Render account (free tier)

---

## Step 1: Setup Supabase

**Cost: FREE** (up to 500MB database + 2GB bandwidth)

### 1.1 Create Project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Click **"New Project"**
3. Configure:
   - **Name**: `polymarket-bot`
   - **Database Password**: Generate a strong password
   - **Region**: Choose closest to you
4. Wait for project to finish setup (~2 minutes)

### 1.2 Run Migrations

1. Go to **SQL Editor** in Supabase Dashboard
2. Execute migrations in order:

```sql
-- Copy and paste content from each file:
-- 1. supabase/migrations/000_functions.sql
-- 2. supabase/migrations/001_trades.sql
-- 3. supabase/migrations/002_positions.sql
-- 4. supabase/migrations/003_market_scan.sql
-- 5. supabase/migrations/004_bot_config.sql
```

### 1.3 Get API Credentials

1. Go to **Settings → API**
2. Copy and save:
   - **Project URL**: `https://xxx.supabase.co`
   - **anon public key**: starts with `eyJ...`
   - **service_role key**: starts with `eyJ...`

---

## Step 2: Deploy Dashboard to Vercel

**Cost: FREE** (Hobby plan)

### 2.1 Connect GitHub

1. Go to [vercel.com](https://vercel.com)
2. Sign in with GitHub
3. Click **"Add New Project"**
4. Import `bot-polymarket` repository

### 2.2 Configure Environment Variables

Add the following in Vercel project settings:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...your-anon-key
SUPABASE_SERVICE_ROLE_KEY=eyJ...your-service-role-key

# Your wallet address (authorized for login)
AUTHORIZED_WALLET_ADDRESS=0x...your-wallet-address

# Mode (start with simulation!)
SIMULATION_MODE=true

# Telegram (optional)
TELEGRAM_BOT_TOKEN=123456:ABC...
TELEGRAM_CHAT_ID=123456789
```

### 2.3 Deploy

1. Click **"Deploy"**
2. Wait for build to complete (~2-3 minutes)
3. Your dashboard will be live at: `https://bot-polymarket-xxx.vercel.app`

---

## Step 3: Deploy WebSocket Service

**Cost: FREE** (both Railway and Render have free tiers)

### Option A: Railway (Recommended)

**Why Railway:**
- 500 hours/month free (enough for 24/7 with sleep mode)
- Automatic Deno detection
- Simple deployment
- Good logs

#### 3.1 Create Railway Account

1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub (no credit card required for free tier)

#### 3.2 Create New Project

1. Click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Choose `bot-polymarket` repository
4. Railway will detect it's a Node.js project

#### 3.3 Configure Service

1. Click on the deployed service
2. Go to **Settings**
3. Set **Root Directory**: `websocket-service`
4. Set **Start Command**: `deno run --allow-net --allow-env --allow-read --allow-sys index.ts`

#### 3.4 Add Environment Variables

Go to **Variables** tab and add:

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...your-service-role-key
TELEGRAM_BOT_TOKEN=123456:ABC...
TELEGRAM_CHAT_ID=123456789
SIMULATION_MODE=true
```

#### 3.5 Deploy

1. Railway will automatically deploy
2. Wait for deployment to complete (~2 minutes)
3. Your WebSocket service is now running 24/7!

#### 3.6 Get Service URL (optional)

If you need the WebSocket URL for direct connections:

1. Go to **Settings** → **Networking**
2. Click **"Generate Domain"**
3. Copy the URL: `wss://your-service.up.railway.app`

---

### Option B: Render

**Why Render:**
- Completely free (no sleep mode needed)
- 750 hours/month free
- Easy to use

#### 3.1 Create Render Account

1. Go to [render.com](https://render.com)
2. Sign up with GitHub

#### 3.2 Create New Web Service

1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository
3. Select `bot-polymarket`

#### 3.3 Configure Service

```
Name: polymarket-websocket
Region: Choose closest to you
Branch: main
Root Directory: websocket-service
Runtime: Deno
Build Command: (leave empty)
Start Command: deno run --allow-net --allow-env --allow-read --allow-sys index.ts
Instance Type: Free
```

#### 3.4 Add Environment Variables

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...your-service-role-key
TELEGRAM_BOT_TOKEN=123456:ABC...
TELEGRAM_CHAT_ID=123456789
SIMULATION_MODE=true
```

#### 3.5 Deploy

1. Click **"Create Web Service"**
2. Wait for deployment (~3-5 minutes)
3. Service is now running!

---

## Step 4: Verify Deployment

### 4.1 Test Dashboard

1. Go to your Vercel URL: `https://bot-polymarket-xxx.vercel.app`
2. Connect your wallet
3. You should see:
   - Dashboard overview
   - WebSocket status: 🟢 Connected
   - Positions table (empty initially)

### 4.2 Test WebSocket Service

**On Railway:**
```bash
# Check logs
railway logs
```

**On Render:**
- Go to your service → **Logs** tab
- You should see: `[WS] Starting Polymarket WebSocket Service...`

### 4.3 Test Market Scanning

1. In dashboard, go to **Bot Config** page
2. Click **"Manual Scan"**
3. Wait 5-10 seconds
4. Check **Opportunities** tab for markets

---

## Step 5: Enable Production Trading

⚠️ **CRITICAL**: Only do this after testing in simulation for at least 7 days!

### 5.1 Get Polygon Wallet

1. Create a new wallet for the bot (never use your main wallet)
2. Fund it with USDC on Polygon network
3. Export the private key

### 5.2 Update Vercel Environment

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Update:
   ```
   SIMULATION_MODE=false
   WALLET_PRIVATE_KEY=0xYOUR_REAL_PRIVATE_KEY
   ```
3. Redeploy the application

### 5.3 Update Railway/Render Environment

**Railway:**
1. Go to Variables tab
2. Update `SIMULATION_MODE=false`
3. Service will auto-restart

**Render:**
1. Go to Environment tab
2. Update `SIMULATION_MODE=false`
3. Click **"Save Changes"**
4. Service will auto-restart

---

## Monitoring & Maintenance

### View Logs

**Vercel Dashboard:**
```
https://vercel.com/dashboard → bot-polymarket → Logs
```

**Railway:**
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# View logs
railway logs
```

**Render:**
- Go to your service → **Logs** tab

### Restart Services

**Railway:**
- Go to your service → Click **"Restart"**

**Render:**
- Go to your service → **Manual Deploy** → **"Deploy latest commit"**

### Update Bot Code

```bash
# On your local machine
git add .
git commit -m "Update bot logic"
git push

# Railway will auto-deploy
# Render will auto-deploy
# Vercel will auto-deploy
```

---

## Common Issues

### WebSocket disconnected

**Normal behavior** - reconnects automatically every 5 seconds.

If it stays disconnected:
- Check Railway/Render logs
- Verify Supabase credentials
- Check service is running

### "No opportunities found"

**Normal in simulation mode** - only test markets available.

In production, adjust filters in Bot Config page.

### Service sleeping (Railway only)

Railway free tier sleeps after 5 minutes of inactivity.

**Solution**: Service wakes up automatically on next connection. For 24/7 operation, upgrade to Hobby plan ($5/month).

### Out of hours (Render)

Render free tier: 750 hours/month.

**Solution**: Monitor usage in Render dashboard. Upgrade if needed.

---

## Cost Breakdown

| Service | Plan | Cost/Month |
|---------|------|-----------|
| Supabase | Free | $0 |
| Vercel | Hobby | $0 |
| Railway | Free (with sleep)* | $0 |
| Railway | Hobby (24/7) | $5 |
| Render | Free (750h/month) | $0 |
| **TOTAL (Railway)** | | **$0 or $5/month** |
| **TOTAL (Render)** | | **$0/month** |

*Railway free tier includes 500 hours/month. Service sleeps after 5 minutes of inactivity.

### Comparison with EC2

| Feature | Railway/Render | EC2 (see DEPLOYMENT.md) |
|---------|----------------|-------------------------|
| **Cost** | $0-5/month | Free 12 months, then ~$15/month |
| **Setup** | 5 minutes | 30 minutes |
| **Management** | Automatic | Manual |
| **Scaling** | Automatic | Manual |
| **Best for** | Unrestricted countries | Any location, full control |

---

## Security Best Practices

### Never commit secrets

```bash
# Verify .gitignore includes
.env
.env.local
.env.production
```

### Rotate API keys regularly

1. Generate new Supabase service role key
2. Update in Vercel and Railway/Render
3. Revoke old key

### Use separate wallets

- ❌ Never use your main trading wallet
- ✅ Create dedicated bot wallet with limited funds

### Enable 2FA

- GitHub account
- Vercel account
- Supabase account
- Railway/Render account

---

## Next Steps

1. **Test in simulation** for 7+ days
2. **Monitor** PnL and trade decisions
3. **Adjust** risk parameters via Bot Config
4. **Enable production** with small capital
5. **Scale up** gradually

---

## Support

- Check [SETUP.md](./SETUP.md) for local development
- Check [SECURITY.md](./SECURITY.md) for security best practices
- Check [TELEGRAM_SETUP.md](./TELEGRAM_SETUP.md) for notifications
- Check [DEPLOYMENT.md](./DEPLOYMENT.md) for EC2 deployment
- Open an issue on GitHub for bugs

---

**Happy trading! 🚀**
