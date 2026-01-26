import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

/**
 * GET /api/bot/config - Récupère la configuration du bot
 */
export async function GET() {
  try {
    const { data: config, error } = await supabaseAdmin
      .from('bot_config')
      .select('*')
      .eq('id', 'default')
      .single();

    if (error) {
      // Si pas de config, créer une config par défaut
      const defaultConfig = {
        id: 'default',
        min_hvs_for_hold: 5,
        min_flip_ev: 3,
        stop_loss_percent: 0.15,
        take_profit_percent: 0.08,
        max_positions: 2,
        max_position_size_eur: 75,
        is_paused: false,
      };

      const { data: newConfig, error: insertError } = await supabaseAdmin
        .from('bot_config')
        .insert(defaultConfig)
        .select()
        .single();

      if (insertError) throw insertError;

      return NextResponse.json({
        minHVSForHold: newConfig.min_hvs_for_hold,
        minFlipEV: newConfig.min_flip_ev,
        stopLossPercent: newConfig.stop_loss_percent,
        takeProfitPercent: newConfig.take_profit_percent,
        maxPositions: newConfig.max_positions,
        maxPositionSizeEur: newConfig.max_position_size_eur,
        isPaused: newConfig.is_paused,
      });
    }

    return NextResponse.json({
      minHVSForHold: config.min_hvs_for_hold,
      minFlipEV: config.min_flip_ev,
      stopLossPercent: config.stop_loss_percent,
      takeProfitPercent: config.take_profit_percent,
      maxPositions: config.max_positions,
      maxPositionSizeEur: config.max_position_size_eur,
      isPaused: config.is_paused,
    });
  } catch (error) {
    console.error('[API] Error fetching bot config:', error);
    return NextResponse.json({ error: 'Failed to fetch config' }, { status: 500 });
  }
}

/**
 * PATCH /api/bot/config - Met à jour la configuration du bot
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();

    const updateData: any = {};

    if (body.minHVSForHold !== undefined) {
      updateData.min_hvs_for_hold = body.minHVSForHold;
    }
    if (body.minFlipEV !== undefined) {
      updateData.min_flip_ev = body.minFlipEV;
    }
    if (body.stopLossPercent !== undefined) {
      updateData.stop_loss_percent = body.stopLossPercent;
    }
    if (body.takeProfitPercent !== undefined) {
      updateData.take_profit_percent = body.takeProfitPercent;
    }
    if (body.maxPositions !== undefined) {
      updateData.max_positions = body.maxPositions;
    }
    if (body.maxPositionSizeEur !== undefined) {
      updateData.max_position_size_eur = body.maxPositionSizeEur;
    }
    if (body.isPaused !== undefined) {
      updateData.is_paused = body.isPaused;
    }

    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from('bot_config')
      .update(updateData)
      .eq('id', 'default')
      .select()
      .single();

    if (error) throw error;

    console.log('[API] Bot config updated:', updateData);

    return NextResponse.json({
      success: true,
      message: 'Configuration mise à jour',
      config: {
        minHVSForHold: data.min_hvs_for_hold,
        minFlipEV: data.min_flip_ev,
        stopLossPercent: data.stop_loss_percent,
        takeProfitPercent: data.take_profit_percent,
        maxPositions: data.max_positions,
        maxPositionSizeEur: data.max_position_size_eur,
        isPaused: data.is_paused,
      },
    });
  } catch (error) {
    console.error('[API] Error updating bot config:', error);
    return NextResponse.json({ error: 'Failed to update config' }, { status: 500 });
  }
}

