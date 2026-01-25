/**
 * Script pour ajouter des données de démo dans Supabase
 * Usage: npx ts-node scripts/seed-demo-data.ts
 *
 * IMPORTANT: Configurer .env.local avec vos clés Supabase d'abord
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Erreur: NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requis dans .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedDemoData() {
  console.log('🌱 Seeding demo data...\n');

  // 1. Ajouter des trades fermés (historique)
  console.log('1️⃣  Adding closed trades...');

  const closedTrades = [
    {
      market_id: 'demo-trade-1',
      market_name: 'Will Apple announce VR headset before March 2025?',
      side: 'YES',
      strategy: 'FLIP',
      entry_price: 0.38,
      exit_price: 0.42,
      position_size_eur: 75,
      pnl_eur: 3.0,
      hvs_score: 2.5,
      flip_ev: 15.2,
      status: 'CLOSED',
      opened_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      closed_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000).toISOString(),
      tx_hash: '0xdemo1234567890abcdef',
    },
    {
      market_id: 'demo-trade-2',
      market_name: 'Will Tesla stock hit $300 before Q2 2025?',
      side: 'YES',
      strategy: 'FLIP',
      entry_price: 0.55,
      exit_price: 0.51,
      position_size_eur: 75,
      pnl_eur: -3.0,
      hvs_score: 1.8,
      flip_ev: 12.8,
      status: 'STOPPED',
      opened_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      closed_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 8 * 60 * 60 * 1000).toISOString(),
      tx_hash: '0xdemo0987654321fedcba',
    },
    {
      market_id: 'demo-trade-3',
      market_name: 'Will Democrats win Virginia election 2025?',
      side: 'YES',
      strategy: 'FLIP',
      entry_price: 0.42,
      exit_price: 0.48,
      position_size_eur: 75,
      pnl_eur: 4.5,
      hvs_score: 3.2,
      flip_ev: 18.5,
      status: 'CLOSED',
      opened_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      closed_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000).toISOString(),
      tx_hash: '0xdemoabcdef1234567890',
    },
  ];

  const { error: tradesError } = await supabase.from('trades').insert(closedTrades);

  if (tradesError) {
    console.error('   ❌ Error inserting trades:', tradesError.message);
  } else {
    console.log(`   ✅ Inserted ${closedTrades.length} closed trades\n`);
  }

  // 2. Ajouter une position active
  console.log('2️⃣  Adding active position...');

  const activePosition = {
    market_id: 'demo-position-1',
    market_name: 'Will OpenAI release GPT-5 before July 2025?',
    side: 'YES',
    strategy: 'FLIP',
    entry_price: 0.28,
    current_price: 0.31,
    position_size_eur: 75,
    unrealized_pnl_eur: 2.25,
    days_until_resolution: 155,
    stop_loss_price: 0.238,
    take_profit_price: 0.302,
    opened_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  };

  const { error: positionError } = await supabase.from('positions').insert([activePosition]);

  if (positionError) {
    console.error('   ❌ Error inserting position:', positionError.message);
  } else {
    console.log('   ✅ Inserted 1 active position\n');
  }

  // 3. Ajouter le trade correspondant
  console.log('3️⃣  Adding corresponding open trade...');

  const openTrade = {
    market_id: 'demo-position-1',
    market_name: 'Will OpenAI release GPT-5 before July 2025?',
    side: 'YES',
    strategy: 'FLIP',
    entry_price: 0.28,
    position_size_eur: 75,
    hvs_score: 4.8,
    flip_ev: 25.3,
    status: 'OPEN',
    opened_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    tx_hash: '0xdemo11223344556677889900',
  };

  const { error: openTradeError } = await supabase.from('trades').insert([openTrade]);

  if (openTradeError) {
    console.error('   ❌ Error inserting open trade:', openTradeError.message);
  } else {
    console.log('   ✅ Inserted 1 open trade\n');
  }

  // 4. Ajouter des market scans
  console.log('4️⃣  Adding market scans...');

  const marketScans = [
    {
      market_id: 'scan-1',
      market_name: 'Will Apple announce AR glasses before June 2025?',
      current_spread: 0.05,
      liquidity_usd: 45000,
      days_until_resolution: 120,
      hvs_score: 3.2,
      flip_ev: 18.5,
      recommendation: 'FLIP',
    },
    {
      market_id: 'scan-2',
      market_name: 'Will France win Eurovision 2025?',
      current_spread: 0.02,
      liquidity_usd: 28000,
      days_until_resolution: 85,
      hvs_score: -2.1,
      flip_ev: 8.2,
      recommendation: 'FLIP',
    },
    {
      market_id: 'scan-3',
      market_name: 'Will Tesla stock hit $300 before March 2025?',
      current_spread: 0.06,
      liquidity_usd: 67000,
      days_until_resolution: 45,
      hvs_score: 1.5,
      flip_ev: 15.8,
      recommendation: 'FLIP',
    },
    {
      market_id: 'scan-4',
      market_name: 'Will Democrats win Virginia election 2025?',
      current_spread: 0.04,
      liquidity_usd: 89000,
      days_until_resolution: 95,
      hvs_score: 2.8,
      flip_ev: 28.4,
      recommendation: 'FLIP',
    },
    {
      market_id: 'scan-5',
      market_name: 'Will Bitcoin reach $150k this week?',
      current_spread: 0.01,
      liquidity_usd: 250000,
      days_until_resolution: 4,
      hvs_score: -5.2,
      flip_ev: 0.8,
      recommendation: 'SKIP',
    },
  ];

  const { error: scansError } = await supabase.from('market_scan').insert(marketScans);

  if (scansError) {
    console.error('   ❌ Error inserting market scans:', scansError.message);
  } else {
    console.log(`   ✅ Inserted ${marketScans.length} market scans\n`);
  }

  console.log('✅ Demo data seeding completed!\n');
  console.log('📊 Summary:');
  console.log(`   - Closed trades: ${closedTrades.length}`);
  console.log(`   - Active positions: 1`);
  console.log(`   - Market scans: ${marketScans.length}`);
  console.log('\n💡 Visit http://localhost:3000 to see the dashboard!\n');
}

seedDemoData().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
