# 🤖 Polymarket Trading Bot

Automated trading bot for Polymarket with real-time monitoring dashboard. Secure wallet authentication and mobile-friendly PWA interface.

![Dashboard](https://img.shields.io/badge/Status-Production%20Ready-brightgreen) ![Mode](https://img.shields.io/badge/Mode-Simulation-blue) ![Security](https://img.shields.io/badge/Auth-Wallet%20Signature-orange)

## 📊 Overview

- **Authentication**: Cryptographic signature with your Polygon wallet (no password required)
- **Capital Management**: Manage your trading capital on Polygon
- **Strategy**: Intelligent market making (HOLD vs FLIP)
- **Dashboard**: Real-time web interface with dark mode
- **Mobile**: Installable PWA, works offline
- **WebSocket Service**: 24/7 position monitoring with Docker on EC2

---

## 🚀 Quick Start

### Local Development (5 minutes)

See **[SETUP.md](./SETUP.md)** for complete local development setup guide including:
- Prerequisites (Node.js, Deno, Supabase)
- Environment configuration
- Starting dev servers
- Testing the bot
- Common troubleshooting

### Production Deployment

**Choose your deployment option:**

- **[DEPLOYMENT_RAILWAY.md](./DEPLOYMENT_RAILWAY.md)** - FREE hosting with Railway/Render (recommended for US/UK/unrestricted countries)
  - 100% free or $5/month
  - 5-minute setup
  - Automatic scaling

- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - EC2 deployment with Docker
  - Full control over infrastructure
  - Free for 12 months (AWS Free Tier), then ~$15/month
  - Best for restricted countries or advanced users

---

## 🏗️ Architecture

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
│  │  (Docker on EC2)       │◄─── AWS EC2 (t3.small)     │
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

## 🎯 Features

### Dashboard

- **Global Stats**: Total PnL, active positions, win rate, volume
- **Active Positions**: Entry/current price, PnL, stop-loss/take-profit
- **Opportunities**: Top 5 analyzed markets with scores
- **Charts**: 7/30 day performance
- **Dark Mode**: Automatic toggle

### Trading Strategies

**HOLD Strategy**: Hold until resolution
- Score: Hold Value Score (HVS)
- For markets with strong conviction

**FLIP Strategy**: Fast market making
- Score: Flip Expected Value (FlipEV)
- Maximize volume (airdrop farming)

**SKIP**: Reject unprofitable opportunities

### Risk Management

- Max position: €75 per position
- Stop-loss: -15%
- Take-profit: +8% (FLIP)
- Cooldown: 2h between trades
- Max exposure: 90% of capital

---

## 🔐 Wallet Authentication

### How It Works

1. **No password** - Use your Polygon wallet (MetaMask, Rabby, etc.)
2. **Cryptographic signature** - Sign a message to prove wallet ownership
3. **No gas fees** - Off-chain signature, no blockchain transaction
4. **24h session** - Stay logged in for 24 hours

### Security

- ✅ Only the wallet in `AUTHORIZED_WALLET_ADDRESS` can connect
- ✅ Secure session with HttpOnly cookies
- ✅ CSRF protection with unique nonce
- ✅ Server-side signature verification (viem)

---

## 🎮 Simulation vs Real Mode

### Simulation Mode (default)

```bash
SIMULATION_MODE=true
```

- ✅ All analysis works
- ✅ Dashboard fully functional
- ✅ Positions recorded in DB
- ❌ **NO real orders** on Polymarket
- ❌ **NO blockchain transactions**

**Perfect for**: Testing the bot without risk

### Real Mode (DANGER)

```bash
SIMULATION_MODE=false
```

⚠️ **Mandatory checklist before activation**:

- [ ] Tested in simulation for 7+ days
- [ ] HVS/FlipEV formulas validated
- [ ] Risk management verified
- [ ] Polygon wallet with exact capital
- [ ] Private key stored securely
- [ ] Active monitoring planned

---

## 📐 Calculators

### Hold Value Score (HVS)

Determines if holding a position is profitable:

```
HVS = (Expected Profit × Win Probability)
    - (Max Loss × Loss Probability)
    - (Opportunity Cost)
    - (Long Term Penalty)
```

**Threshold**: HVS > €5 → HOLD recommended

### Flip Expected Value (FlipEV)

Calculates expected profit in market making:

```
FlipEV = (Spread × Size × Fill Probability) × (Flips/Week × Weeks)
```

**Threshold**: FlipEV > €3 → FLIP recommended

### Test Calculators

```bash
npm run test:calculators
```

---

## 🔧 Configuration

### Bot Parameters

File `lib/config.ts`:

```typescript
export const BOT_CONFIG = {
  // Capital & positions
  totalCapitalEur: 150,
  maxPositions: 2,
  maxPositionSizeEur: 75,
  maxTotalExposure: 0.90,

  // Decision thresholds
  minHVSForHold: 5,        // € minimum for HOLD
  minFlipEV: 3,            // € minimum for FLIP

  // Risk management
  stopLossPercent: 0.15,   // 15%
  takeProfitPercent: 0.08, // 8%
  cooldownMinutes: 120,    // 2h

  // Market filters
  marketFilters: {
    minLiquidityUsd: 10000,
    minSpread: 0.03,
    maxSpread: 0.15,
    minDaysUntilResolution: 2,
    maxDaysUntilResolution: 90,
    excludeCategories: ['crypto', 'sports'],
    preferCategories: ['politics', 'entertainment', 'tech']
  }
};
```

---

## 📊 API Endpoints

### Public (require authentication)

```bash
# Global stats
GET /api/overview

# Active positions
GET /api/positions

# Trade history
GET /api/history?limit=50

# Top opportunities
GET /api/opportunities

# Bot configuration
GET /api/bot/config
POST /api/bot/config
```

### Protected (admin)

```bash
# Scan markets
POST /api/bot/scan

# Analyze markets
POST /api/bot/analyze

# Execute bot
POST /api/bot/execute

# Close position
POST /api/positions/[id]/close
```

---

## 🚦 Useful Commands

```bash
# Development
npm run dev                  # Start dev server
npm run test:calculators     # Test HVS & FlipEV

# Production
npm run build                # Build for production
npm start                    # Start in production

# Deployment
vercel --prod                # Deploy to Vercel
```

---

## 📚 Documentation

### Getting Started
- **[SETUP.md](./SETUP.md)** - Local development setup
- **[DEPLOYMENT_RAILWAY.md](./DEPLOYMENT_RAILWAY.md)** - Production deployment (Railway/Render - FREE)
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Production deployment (EC2 - Full control)

### Configuration
- **[CRON_SETUP.md](./CRON_SETUP.md)** - Automated execution setup (GitHub Actions)
- **[SECURITY.md](./SECURITY.md)** - Security best practices
- **[TELEGRAM_SETUP.md](./TELEGRAM_SETUP.md)** - Telegram notifications setup

### Going Live
- **[PASSAGE_EN_PRODUCTION.md](./PASSAGE_EN_PRODUCTION.md)** - Complete checklist to switch from SIMULATION to REAL mode

---

## 🔒 Security

### ✅ Protections in Place

- **Wallet authentication** - SIWE cryptographic signature
- **Secure session** - HttpOnly cookies, 24h expiration
- **Middleware protection** - All routes protected except `/login`
- **Sensitive variables** - Never committed (`.gitignore`)
- **Simulation mode** - Default, no real orders
- **Rate limiting** - Cooldown between trades

### ⚠️ Best Practices

1. **Never commit** private keys
2. **Use** simulation mode first
3. **Test** for 7+ days before real mode
4. **Monitor** actively in the first weeks
5. **Backup** Supabase regularly

---

## 🐛 Troubleshooting

### "Invalid signature" error

**Cause**: Wallet address mismatch

**Fix**:
1. Check `AUTHORIZED_WALLET_ADDRESS` in `.env.local`
2. Make sure it matches your connected wallet
3. Clear browser cache and try again

### "No opportunities found"

**Normal in simulation mode** - only test markets available.

In production, adjust filters in Bot Config page.

### WebSocket disconnected

**Normal behavior** - reconnects automatically every 5 seconds.

If it stays disconnected, check EC2 logs:
```bash
docker-compose logs -f websocket-service
```

---

## 💰 Cost Breakdown

### Option 1: Railway/Render (Recommended)

| Service | Plan | Cost/Month |
|---------|------|-----------|
| Supabase | Free | $0 |
| Vercel | Hobby | $0 |
| Railway/Render | Free* | $0 |
| Railway | Hobby (24/7) | $5 |
| **TOTAL** | | **$0-5/month** |

*Railway free tier: 500 hours/month (service sleeps after inactivity). Render free tier: 750 hours/month.

See [DEPLOYMENT_RAILWAY.md](./DEPLOYMENT_RAILWAY.md) for setup guide.

### Option 2: EC2 (Full Control)

| Service | Plan | Cost/Month |
|---------|------|-----------|
| Supabase | Free | $0 |
| Vercel | Hobby | $0 |
| EC2 t2.micro | AWS Free Tier (12 months)** | $0 |
| EC2 t3.small | After Free Tier | ~$15 |
| **TOTAL** | | **$0 for 12 months, then ~$15/month** |

**AWS Free Tier includes 750 hours/month of t2.micro (enough for 24/7 operation) for the first 12 months with new AWS accounts.

See [DEPLOYMENT.md](./DEPLOYMENT.md) for setup guide.

---

## 📚 Resources

- [Polymarket Docs](https://docs.polymarket.com)
- [Supabase Docs](https://supabase.com/docs)
- [Vercel Docs](https://vercel.com/docs)
- [Next.js Docs](https://nextjs.org/docs)
- [Viem Docs](https://viem.sh)

---

## 📝 License

MIT

---

## ⚠️ Disclaimer

This bot is provided for educational purposes. Trading prediction markets involves risk. Use at your own risk. Always start in SIMULATION mode.

---

## 🎉 Support

Questions? Open an issue on GitHub!

**Happy Trading! 🚀**
