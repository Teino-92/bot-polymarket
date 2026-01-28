# 🚀 Production Deployment Guide

Complete guide for deploying the Polymarket Trading Bot to production.

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
│  │  (Docker on EC2)       │◄─── AWS EC2 (t3.small)     │
│  │  - Real-time monitoring│                             │
│  │  - Stop-loss/Take-profit│                            │
│  └───────────┬────────────┘                             │
│              │                                           │
│              ▼                                           │
│  ┌────────────────────────┐                             │
│  │  Supabase              │                             │
│  │  - PostgreSQL DB       │◄─── Supabase Cloud (Free)  │
│  │  - Edge Functions      │                             │
│  │  - Cron (4h)           │                             │
│  └───────────┬────────────┘                             │
│              │                                           │
│              ▼                                           │
│  ┌────────────────────────┐                             │
│  │  Dashboard             │                             │
│  │  - Next.js App         │◄─── Vercel (Free)          │
│  │  - API Routes          │                             │
│  │  - Bot Configuration   │                             │
│  └────────────────────────┘                             │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## Prerequisites

- AWS account with EC2 access
- Supabase account
- Vercel account
- GitHub account (for CI/CD)
- SSH key pair for EC2

---

## Step 1: Setup Supabase

**Cost: FREE** (up to 500MB database + 2GB bandwidth)

### 1.1 Create Project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Click **"New Project"**
3. Configure:
   - **Name**: `polymarket-bot`
   - **Database Password**: Generate a strong password
   - **Region**: Choose closest to your EC2 region
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

## Step 3: Deploy WebSocket Service to EC2

**Cost: ~$15-20/month** (t3.small, 24/7)

### 3.1 Create EC2 Instance

1. Go to [AWS EC2 Console](https://console.aws.amazon.com/ec2/)
2. Click **"Launch Instance"**
3. Configure:
   - **Name**: `polymarket-bot-websocket`
   - **AMI**: Ubuntu Server 24.04 LTS
   - **Instance type**: `t3.small` (2 vCPU, 2 GB RAM)
   - **Key pair**: Create or select SSH key (download `.pem` file)
   - **Storage**: 20 GB gp3
4. Security Group:
   - Allow **SSH** (port 22) from **"My IP"**
   - Allow **HTTP** (port 80) from **Anywhere** (optional, for health checks)
5. Click **"Launch Instance"**
6. Wait for status: **"Running"**
7. Note the **Public IP** (e.g., `3.27.249.150`)

### 3.2 Connect to EC2

```bash
# Set proper permissions on your SSH key
chmod 400 ~/Downloads/your-key.pem

# Connect to EC2
ssh -i ~/Downloads/your-key.pem ubuntu@YOUR-PUBLIC-IP
```

### 3.3 Install Docker

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group
sudo usermod -aG docker ubuntu

# Install Docker Compose
sudo apt install -y docker-compose

# Verify installation
docker --version
docker-compose --version
```

**IMPORTANT**: Disconnect and reconnect for group changes to take effect:

```bash
exit
```

Then reconnect:
```bash
ssh -i ~/Downloads/your-key.pem ubuntu@YOUR-PUBLIC-IP
```

Verify Docker works without sudo:
```bash
docker ps
```

### 3.4 Clone Repository

```bash
cd ~
git clone https://github.com/Teino-92/bot-polymarket.git
cd bot-polymarket
```

### 3.5 Configure Environment

```bash
# Create .env file
cp .env.example .env

# Edit with your credentials
nano .env
```

Add your production credentials:

```bash
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...your-service-role-key

# Telegram (optional)
TELEGRAM_BOT_TOKEN=123456:ABC...
TELEGRAM_CHAT_ID=123456789

# Mode
SIMULATION_MODE=true
```

Save: `Ctrl + O`, `Enter`, `Ctrl + X`

### 3.6 Start the Service

```bash
# Build and start containers
docker-compose up -d

# Verify containers are running
docker-compose ps
```

You should see:
```
NAME              STATUS
bot-websocket     Up (healthy)
```

### 3.7 Verify Logs

```bash
# View logs
docker-compose logs -f websocket-service
```

You should see:
```
[WS] Starting Polymarket WebSocket Service...
[WS] Supabase URL: https://your-project.supabase.co
[WS] Loaded X active positions
[WS] Connected to Polymarket WebSocket
```

Press `Ctrl + C` to exit logs.

---

## Step 4: Verify Deployment

### 4.1 Test Dashboard

1. Go to your Vercel URL: `https://bot-polymarket-xxx.vercel.app`
2. Connect your wallet
3. You should see:
   - Dashboard overview
   - WebSocket status: 🟢 Connected
   - Positions table (empty initially)

### 4.2 Test WebSocket Connection

From your EC2 instance:

```bash
# Check WebSocket is responding
curl http://localhost:8000/health
```

Should return: `OK`

### 4.3 Test Supabase Connection

```bash
docker-compose exec websocket-service sh -c "curl -s https://api.ipify.org && echo"
```

Should return an IP address (your EC2 public IP).

### 4.4 Test Market Scanning

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

### 5.3 Update EC2 Environment

```bash
# On EC2
cd ~/bot-polymarket
nano .env
```

Change:
```bash
SIMULATION_MODE=false
```

Save and restart:
```bash
docker-compose down
docker-compose up -d
```

---

## Monitoring & Maintenance

### View Logs

**Vercel Dashboard:**
```
https://vercel.com/dashboard → bot-polymarket → Logs
```

**EC2 WebSocket Logs:**
```bash
# Real-time logs
docker-compose logs -f websocket-service

# Last 100 lines
docker-compose logs --tail=100 websocket-service
```

**Supabase Logs:**
```
https://supabase.com/dashboard → Your Project → Logs
```

### Restart Services

**Dashboard (Vercel):**
- Automatically redeploys on git push

**WebSocket Service (EC2):**
```bash
# Restart
docker-compose restart

# Stop
docker-compose down

# Start
docker-compose up -d

# Rebuild after code changes
docker-compose down
git pull
docker-compose up -d --build
```

### Update Bot Code

```bash
# On your local machine
git add .
git commit -m "Update bot logic"
git push

# Vercel will auto-deploy

# On EC2
ssh -i ~/Downloads/your-key.pem ubuntu@YOUR-PUBLIC-IP
cd ~/bot-polymarket
git pull
docker-compose up -d --build
```

### Check Database

```sql
-- View active positions
SELECT * FROM positions WHERE status = 'OPEN' ORDER BY created_at DESC;

-- View recent trades
SELECT * FROM trades ORDER BY created_at DESC LIMIT 20;

-- View bot configuration
SELECT * FROM bot_config ORDER BY updated_at DESC LIMIT 1;
```

---

## Common Issues

### WebSocket disconnected

**Normal behavior** - reconnects automatically every 5 seconds.

If it stays disconnected:
```bash
docker-compose logs websocket-service
```

Check for Supabase connection errors.

### "No opportunities found"

**Normal in simulation mode** - only test markets available.

In production, adjust filters in Bot Config page.

### Container won't start

```bash
# Check logs
docker-compose logs websocket-service

# Verify .env file
cat .env

# Rebuild
docker-compose down
docker-compose up -d --build
```

### High memory usage

```bash
# Check container stats
docker stats

# If needed, restart
docker-compose restart
```

### EC2 disk full

```bash
# Clean up old Docker images
docker system prune -a

# Check disk usage
df -h
```

---

## Cost Breakdown

| Service | Plan | Cost/Month |
|---------|------|-----------|
| Supabase | Free | $0 |
| Vercel | Hobby | $0 |
| EC2 t3.small | On-Demand (US East) | ~$15 |
| **TOTAL** | | **~$15/month** |

### Cost Optimization

**Option 1: Stop EC2 when not trading**
```bash
# Stop instance (via AWS Console or CLI)
aws ec2 stop-instances --instance-ids i-YOUR-INSTANCE-ID

# Start when needed
aws ec2 start-instances --instance-ids i-YOUR-INSTANCE-ID
```

**Option 2: Use Spot Instances**
- ~70% cheaper than on-demand
- Risk of interruption (auto-restart with Docker)

**Option 3: Reserved Instance**
- Commit to 1 year = ~40% discount
- Best for 24/7 operation

---

## Security Best Practices

### Never commit secrets

```bash
# Verify .gitignore includes
.env
.env.local
.env.production
*.pem
```

### Rotate API keys regularly

1. Generate new Supabase service role key
2. Update in Vercel and EC2
3. Revoke old key

### Use separate wallets

- ❌ Never use your main trading wallet
- ✅ Create dedicated bot wallet with limited funds

### Enable 2FA

- AWS account
- GitHub account
- Vercel account
- Supabase account

### Restrict EC2 Security Group

- Only allow SSH from your IP
- Don't expose port 8000 publicly (use SSH tunnel if needed)

---

## Next Steps

1. **Test in simulation** for 7+ days
2. **Monitor** PnL and trade decisions
3. **Adjust** risk parameters via Bot Config
4. **Enable production** with small capital
5. **Scale up** gradually

---

## Useful Commands

```bash
# EC2: View all containers
docker-compose ps

# EC2: Follow logs
docker-compose logs -f

# EC2: Restart service
docker-compose restart

# EC2: Update bot
cd ~/bot-polymarket && git pull && docker-compose up -d --build

# EC2: Check resource usage
docker stats

# EC2: Clean up
docker system prune -a

# Local: Deploy to Vercel
vercel --prod

# Local: Test locally
npm run dev
```

---

## Support

- Check [SETUP.md](./SETUP.md) for local development
- Check [SECURITY.md](./SECURITY.md) for security best practices
- Check [TELEGRAM_SETUP.md](./TELEGRAM_SETUP.md) for notifications
- Check [EC2_DEPLOYMENT_GUIDE.md](./EC2_DEPLOYMENT_GUIDE.md) for detailed EC2 steps
- Open an issue on GitHub for bugs

---

**Happy trading! 🚀**
