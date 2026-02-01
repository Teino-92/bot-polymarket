import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { scanTopMarkets } from '@/lib/polymarket/market-selector';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 60 seconds for manual scan

/**
 * POST /api/bot/scan - Lance un scan manuel des opportunités
 * Utilise l'API Gamma de Polymarket pour récupérer de vraies opportunités
 *
 * NOTE: Cette route fait UNIQUEMENT un scan, sans toucher aux positions
 * Pour exécuter le bot (monitoring + ouverture), utiliser /api/bot/execute
 */
export async function POST() {
  try {
    console.log('[API/SCAN] Manual scan triggered - scanning real Polymarket markets...');
    console.log('[API/SCAN] ℹ️  This is a SCAN ONLY - no positions will be affected');

    // Scanner les marchés Polymarket avec la fonction existante
    const opportunities = await scanTopMarkets();

    console.log(`[API/SCAN] Found ${opportunities.length} opportunities from Polymarket`);

    // Filtrer pour ne garder que les opportunités viables (FLIP ou HOLD)
    const viable = opportunities.filter(opp => opp.action !== 'SKIP');
    console.log(`[API/SCAN] ${viable.length} viable opportunities (FLIP or HOLD)`);

    if (viable.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Scan terminé: aucune opportunité viable trouvée',
        scansCreated: 0,
      });
    }

    // Prendre les 10 meilleures opportunités
    const top10 = viable.slice(0, 10);

    // Formater pour insertion dans market_scan
    const scansToInsert = top10.map(opp => ({
      market_id: opp.marketId,
      market_name: opp.marketName,
      current_spread: opp.spread,
      liquidity_usd: opp.liquidityUsd,
      days_until_resolution: opp.daysUntilResolution,
      hvs_score: opp.hvs,
      flip_ev: opp.flipEV,
      recommendation: opp.action,
      scanned_at: new Date().toISOString(),
    }));

    // Insérer dans market_scan
    const { error } = await supabaseAdmin
      .from('market_scan')
      .insert(scansToInsert);

    if (error) {
      console.error('[API/SCAN] Error inserting scans:', error);
      throw new Error(`Failed to save scans: ${error.message}`);
    }

    console.log(`[API/SCAN] ✅ Saved ${scansToInsert.length} real opportunities to database`);
    console.log('[API/SCAN] ✅ No positions were modified (scan only)');

    return NextResponse.json({
      success: true,
      message: `Scan terminé: ${scansToInsert.length} opportunités trouvées`,
      scansCreated: scansToInsert.length,
      topOpportunity: top10[0] ? {
        market: top10[0].marketName,
        action: top10[0].action,
        flipEV: top10[0].flipEV.toFixed(2),
      } : null,
    });
  } catch (error) {
    console.error('[API/SCAN] Manual scan error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erreur lors du scan',
        details: String(error),
      },
      { status: 500 }
    );
  }
}
