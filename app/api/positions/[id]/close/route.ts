import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyAuth } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  // 🔒 AUTH CHECK
  const authResult = verifyAuth(request);
  if (!authResult.authorized) {
    return NextResponse.json(
      { error: 'Unauthorized', reason: authResult.reason },
      { status: 401 }
    );
  }

  try {
    const params = await context.params;
    const positionId = params.id;

    // Récupérer la position
    const { data: position, error: fetchError } = await supabaseAdmin
      .from('positions')
      .select('*')
      .eq('id', positionId)
      .single();

    if (fetchError || !position) {
      return NextResponse.json(
        { error: 'Position not found' },
        { status: 404 }
      );
    }

    if (position.status !== 'OPEN') {
      return NextResponse.json(
        { error: 'Position is not open' },
        { status: 400 }
      );
    }

    // Calculer le PnL
    const currentPrice = position.current_price || position.entry_price;
    let pnl = 0;

    if (position.side === 'YES') {
      pnl = (currentPrice - position.entry_price) * position.position_size_eur;
    } else {
      pnl = (position.entry_price - currentPrice) * position.position_size_eur;
    }

    // Fermer la position
    const closedAt = new Date().toISOString();
    const { error: updateError } = await supabaseAdmin
      .from('positions')
      .update({
        status: 'CLOSED',
        exit_price: currentPrice,
        pnl_eur: pnl,
        closed_at: closedAt,
        close_reason: 'Manual close',
      })
      .eq('id', positionId);

    if (updateError) {
      console.error('Error closing position:', updateError);
      return NextResponse.json(
        { error: 'Failed to close position' },
        { status: 500 }
      );
    }

    // Mettre à jour aussi la table trades
    const { error: tradeUpdateError } = await supabaseAdmin
      .from('trades')
      .update({
        status: 'CLOSED',
        exit_price: currentPrice,
        pnl_eur: pnl,
        closed_at: closedAt,
      })
      .eq('market_id', position.market_id)
      .eq('status', 'OPEN');

    if (tradeUpdateError) {
      console.error('Error updating trade:', tradeUpdateError);
      // Ne pas retourner d'erreur, car la position est déjà fermée
    }

    return NextResponse.json({
      success: true,
      position: {
        id: positionId,
        status: 'CLOSED',
        pnl_eur: pnl,
        exit_price: currentPrice,
      },
    });
  } catch (error) {
    console.error('Error in close position API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
