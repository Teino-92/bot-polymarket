import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { polymarketClient } from '@/lib/polymarket/client';
import { riskManager } from '@/lib/polymarket/risk-manager';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let query = supabaseAdmin
      .from('positions')
      .select('*');

    // Filter by status if provided
    if (status) {
      query = query.eq('status', status);
    }

    query = query.order('opened_at', { ascending: false });

    const { data: positions, error } = await query;

    if (error) {
      throw error;
    }

    if (!positions || positions.length === 0) {
      return NextResponse.json([]);
    }

    // Update prices in real-time for OPEN positions
    const updatedPositions = await Promise.all(
      positions.map(async (position) => {
        if (position.status !== 'OPEN') {
          return position;
        }

        try {
          // Get current price from Polymarket
          const currentPrice = await polymarketClient.getPrice(position.market_id);

          // Calculate unrealized PnL
          const unrealizedPnL = riskManager.calculateUnrealizedPnL(
            Number(position.entry_price),
            currentPrice,
            Number(position.position_size_eur),
            position.side
          );

          // Update position in database (async, don't wait)
          supabaseAdmin
            .from('positions')
            .update({
              current_price: currentPrice,
              unrealized_pnl_eur: unrealizedPnL,
            })
            .eq('id', position.id)
            .then((result) => {
              if (result.error) {
                console.error('Error updating position:', result.error);
              }
            });

          // Return updated data immediately
          return {
            ...position,
            current_price: currentPrice,
            unrealized_pnl_eur: unrealizedPnL,
          };
        } catch (err) {
          console.error(`Error fetching price for ${position.market_id}:`, err);
          return position; // Return original if price fetch fails
        }
      })
    );

    return NextResponse.json(updatedPositions);
  } catch (error: any) {
    console.error('[API /positions] Error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
