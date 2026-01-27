import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 60 seconds for manual scan

/**
 * POST /api/bot/scan - Lance un scan manuel des opportunités
 * Pour l'instant, crée des scans de démonstration
 * TODO: Implémenter le vrai scan avec l'API Polymarket
 */
export async function POST() {
  try {
    console.log('[API] Manual scan triggered');

    // Pour l'instant, créer quelques scans de test
    const testScans = [
      {
        market_id: `test-${Date.now()}-1`,
        market_name: 'Will Bitcoin reach $100k in 2026?',
        current_spread: 0.05,
        liquidity_usd: 50000,
        days_until_resolution: 90,
        hvs_score: 45.5,
        flip_ev: 22.3,
        recommendation: 'FLIP',
        scanned_at: new Date().toISOString(),
      },
      {
        market_id: `test-${Date.now()}-2`,
        market_name: 'Will Ethereum ETF be approved in Q1 2026?',
        current_spread: 0.03,
        liquidity_usd: 75000,
        days_until_resolution: 30,
        hvs_score: 52.1,
        flip_ev: 28.4,
        recommendation: 'FLIP',
        scanned_at: new Date().toISOString(),
      },
      {
        market_id: `test-${Date.now()}-3`,
        market_name: 'Will S&P 500 hit 7000 by end of 2026?',
        current_spread: 0.08,
        liquidity_usd: 120000,
        days_until_resolution: 45,
        hvs_score: 38.2,
        flip_ev: 18.7,
        recommendation: 'HOLD',
        scanned_at: new Date().toISOString(),
      },
    ];

    // Insérer dans market_scan
    const { error } = await supabaseAdmin
      .from('market_scan')
      .insert(testScans);

    if (error) {
      console.error('[API] Error inserting scans:', error);
      throw new Error(`Failed to save scans: ${error.message}`);
    }

    console.log(`[API] ✅ Created ${testScans.length} test opportunities`);

    return NextResponse.json({
      success: true,
      message: `Scan terminé: ${testScans.length} opportunités trouvées`,
      scansCreated: testScans.length,
    });
  } catch (error) {
    console.error('[API] Manual scan error:', error);
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
