import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    // Récupérer les derniers scans (dernières 24 heures)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data: scans, error } = await supabaseAdmin
      .from('market_scan')
      .select('*')
      .gte('scanned_at', oneDayAgo)
      .order('flip_ev', { ascending: false })
      .limit(limit);

    if (error) {
      throw error;
    }

    // Transformer en format Opportunity
    const opportunities = (scans || []).map((scan) => ({
      marketId: scan.market_id,
      marketName: scan.market_name,
      entryPrice: 0, // Non stocké dans market_scan
      spread: Number(scan.current_spread),
      daysUntilResolution: scan.days_until_resolution,
      estimatedWinProbability: 0, // Non stocké
      liquidityUsd: Number(scan.liquidity_usd),
      hvs: Number(scan.hvs_score),
      flipEV: Number(scan.flip_ev),
      action: scan.recommendation,
      reasoning: `Spread: ${(Number(scan.current_spread) * 100).toFixed(1)}%, ${scan.days_until_resolution}d`,
      confidence: Number(scan.flip_ev) > 20 ? 'HIGH' : Number(scan.flip_ev) > 10 ? 'MEDIUM' : 'LOW',
    }));

    return NextResponse.json(opportunities);
  } catch (error: any) {
    console.error('[API /opportunities] Error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
