# 🛠️ Local Development Setup

Complete guide for setting up the Polymarket Trading Bot locally.

## Prerequisites

- **Node.js 18+** - [Download](https://nodejs.org)
- **Deno 2.x** - [Install](https://deno.land)
- **Git** - [Download](https://git-scm.com)
- **Supabase Account** - [Sign up](https://supabase.com)
- **Telegram Bot** (optional) - See [TELEGRAM_SETUP.md](./TELEGRAM_SETUP.md)

## Step 1: Clone Repository

```bash
git clone https://github.com/Teino-92/bot-polymarket.git
cd bot-polymarket
```

## Step 2: Install Dependencies

```bash
npm install
```

## Step 3: Setup Supabase

### 3.1 Create Project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Fill in:
   - **Name**: `polymarket-bot`
   - **Database Password**: Generate a strong password
   - **Region**: Choose closest to you
4. Wait for project to finish setup (~2 minutes)

### 3.2 Run Migrations

1. In Supabase Dashboard, go to **SQL Editor**
2. Execute migrations in order:

**Migration 1: trades table**
```bash
# Copy content from supabase/migrations/001_trades.sql
```

**Migration 2: positions table**
```bash
# Copy content from supabase/migrations/002_positions.sql
```

**Migration 3: market_scan table**
```bash
# Copy content from supabase/migrations/003_market_scan.sql
```

**Migration 4: bot_config table**
```bash
# Copy content from supabase/migrations/004_bot_config.sql
```

### 3.3 Get API Keys

1. In Supabase Dashboard, go to **Settings → API**
2. Copy:
   - **Project URL** (e.g., `https://xxx.supabase.co`)
   - **anon public key** (starts with `eyJ...`)
   - **service_role key** (starts with `eyJ...`)

## Step 4: Configure Environment Variables

Create `.env.local`:

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...your-anon-key
SUPABASE_SERVICE_ROLE_KEY=eyJ...your-service-role-key

# Your wallet address (Polygon)
AUTHORIZED_WALLET_ADDRESS=0x...your-wallet-address

# Mode (ALWAYS start with simulation!)
SIMULATION_MODE=true

# Telegram (optional)
TELEGRAM_BOT_TOKEN=123456:ABC...
TELEGRAM_CHAT_ID=123456789
```

For WebSocket service, create `websocket-service/.env`:

```bash
cd websocket-service
cp ../.env.example .env
```

Edit `websocket-service/.env`:

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...your-service-role-key
TELEGRAM_BOT_TOKEN=123456:ABC...
TELEGRAM_CHAT_ID=123456789
SIMULATION_MODE=true
```

## Step 5: Start Development Server

### Terminal 1: Dashboard (Next.js)

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Terminal 2: WebSocket Service (Deno)

```bash
cd websocket-service
deno run --allow-net --allow-env --allow-read --allow-sys --env-file=.env index.ts
```

WebSocket runs on `ws://localhost:8000`

## Step 6: Test the Bot

### 6.1 Login

1. Go to [http://localhost:3000/login](http://localhost:3000/login)
2. Click "Connect Wallet"
3. Sign the message in MetaMask/Rabby
4. You should be redirected to the dashboard

### 6.2 Scan Markets

1. Go to **Bot Config** page
2. Click "Manual Scan"
3. Wait for results (~5-10 seconds)
4. Check **Opportunities** tab for top markets

### 6.3 Test Telegram (if configured)

```bash
curl -X POST http://localhost:3000/api/telegram/test
```

You should receive a message: "Telegram Bot configured ✅"

## Common Issues

### "Invalid signature" error

**Cause**: Wallet address mismatch

**Fix**:
1. Check `AUTHORIZED_WALLET_ADDRESS` in `.env.local`
2. Make sure it matches your connected wallet
3. Clear browser cache and try again

### "Supabase connection failed"

**Cause**: Wrong API keys or URL

**Fix**:
1. Double-check `SUPABASE_URL` and keys in `.env.local`
2. Verify project is running in Supabase Dashboard
3. Check migrations were executed successfully

### WebSocket won't start

**Cause**: Deno not installed or wrong permissions

**Fix**:
```bash
# Check Deno is installed
deno --version

# If not, install:
curl -fsSL https://deno.land/install.sh | sh

# Verify .env file exists
ls websocket-service/.env
```

### "No opportunities found"

**Normal** in simulation mode - only test markets are available.

## Development Workflow

### Making Changes

1. **Frontend**: Edit files in `app/` or `components/`
   - Hot reload is automatic

2. **Backend API**: Edit files in `app/api/`
   - Hot reload is automatic

3. **WebSocket Service**: Edit `websocket-service/index.ts`
   - Restart Deno manually (`Ctrl+C` then re-run)

### Testing Calculators

```bash
npm run test:calculators
```

This tests:
- Hold Value Score (HVS)
- Flip Expected Value (FlipEV)
- Kelly Criterion
- Odds conversion

### Database Changes

1. Create new migration file: `supabase/migrations/005_your_change.sql`
2. Run in Supabase SQL Editor
3. Update schema in code if needed

## Next Steps

Once everything works locally:

1. **Test in simulation** for 7+ days
2. **Review** trade decisions and PnL
3. **Adjust** risk parameters if needed
4. **Deploy** to production (see [DEPLOYMENT.md](./DEPLOYMENT.md))

## Useful Commands

```bash
# Start dashboard
npm run dev

# Build for production
npm run build

# Start production build
npm start

# Run tests
npm run test:calculators

# Clean build cache
rm -rf .next
```

## Need Help?

- Check [TELEGRAM_SETUP.md](./TELEGRAM_SETUP.md) for Telegram config
- Check [SECURITY.md](./SECURITY.md) for security best practices
- Open an issue on GitHub for bugs

**Happy coding! 🚀**
