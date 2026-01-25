import { NextResponse } from 'next/server';
import { scanTopMarkets } from '@/lib/polymarket/market-selector';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

/**
 * Analyse les marchés et stocke les résultats dans market_scan
 * Cette route peut être appelée manuellement ou par le bot
 */
export async function POST() {
  try {
    console.log('🔍 Starting market analysis...');

    // Scanner les marchés
    const opportunities = await scanTopMarkets();

    console.log(`   Found ${opportunities.length} opportunities`);

    // Sauvegarder les résultats dans market_scan
    const scans = opportunities.map((opp) => ({
      market_id: opp.marketId,
      market_name: opp.marketName,
      current_spread: opp.spread,
      liquidity_usd: opp.liquidityUsd,
      days_until_resolution: opp.daysUntilResolution,
      hvs_score: opp.hvs,
      flip_ev: opp.flipEV,
      recommendation: opp.action,
    }));

    if (scans.length > 0) {
      const { error } = await supabaseAdmin.from('market_scan').insert(scans);

      if (error) {
        console.error('Error saving market scans:', error);
      } else {
        console.log(`   Saved ${scans.length} market scans to database`);
      }
    }

    // Nettoyer les vieux scans (>24h)
    await supabaseAdmin.rpc('cleanup_old_market_scans');

    return NextResponse.json({
      success: true,
      scanned: opportunities.length,
      topOpportunity: opportunities[0] || null,
    });
  } catch (error: any) {
    console.error('[API /bot/analyze] Error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
