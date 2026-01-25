import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import type { DashboardOverview } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Récupérer tous les trades fermés
    const { data: closedTrades, error: tradesError } = await supabaseAdminAdmin
      .from('trades')
      .select('*')
      .in('status', ['CLOSED', 'STOPPED']);

    if (tradesError) throw tradesError;

    // Récupérer les positions actives pour unrealized PnL
    const { data: positions, error: positionsError } = await supabaseAdmin
      .from('positions')
      .select('*');

    if (positionsError) throw positionsError;

    const trades = closedTrades || [];
    const activePositions = positions || [];

    // Calculer total PnL (réalisé + non réalisé)
    const realizedPnL = trades.reduce((sum, t) => sum + (Number(t.pnl_eur) || 0), 0);
    const unrealizedPnL = activePositions.reduce(
      (sum, p) => sum + (Number(p.unrealized_pnl_eur) || 0),
      0
    );
    const totalPnL = realizedPnL + unrealizedPnL;

    // Calculer volume tradé
    const volumeTraded = trades.reduce((sum, t) => sum + Number(t.position_size_eur), 0);

    // Calculer win rate
    const winningTrades = trades.filter((t) => Number(t.pnl_eur) > 0).length;
    const winRate = trades.length > 0 ? (winningTrades / trades.length) * 100 : 0;

    // Calculer PnL change 24h
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: recentTrades } = await supabaseAdmin
      .from('trades')
      .select('*')
      .gte('closed_at', oneDayAgo)
      .in('status', ['CLOSED', 'STOPPED']);

    const pnlChange24h = (recentTrades || []).reduce(
      (sum, t) => sum + (Number(t.pnl_eur) || 0),
      0
    );

    // Calculer historique PnL 7 jours
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const pnlHistory7d = [];
    let cumulativePnL = 0;

    for (let i = 6; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];

      const { data: dayTrades } = await supabaseAdmin
        .from('trades')
        .select('*')
        .gte('closed_at', new Date(date.setHours(0, 0, 0, 0)).toISOString())
        .lte('closed_at', new Date(date.setHours(23, 59, 59, 999)).toISOString())
        .in('status', ['CLOSED', 'STOPPED']);

      const dayPnL = (dayTrades || []).reduce((sum, t) => sum + (Number(t.pnl_eur) || 0), 0);
      cumulativePnL += dayPnL;

      pnlHistory7d.push({
        date: dateStr,
        pnl: Number(cumulativePnL.toFixed(2)),
      });
    }

    const overview: DashboardOverview = {
      totalPnL: Number(totalPnL.toFixed(2)),
      pnlChange24h: Number(pnlChange24h.toFixed(2)),
      volumeTraded: Number(volumeTraded.toFixed(2)),
      tradesCount: trades.length + activePositions.length,
      winRate: Number(winRate.toFixed(1)),
      closedTrades: trades.length,
      pnlHistory7d,
    };

    return NextResponse.json(overview);
  } catch (error: any) {
    console.error('[API /overview] Error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
