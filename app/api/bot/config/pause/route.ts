import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

/**
 * POST /api/bot/config/pause - Toggle pause du bot
 */
export async function POST() {
  try {
    // Récupérer l'état actuel
    const { data: current } = await supabaseAdmin
      .from('bot_config')
      .select('is_paused')
      .eq('id', 'default')
      .single();

    const newPauseState = !current?.is_paused;

    // Mettre à jour
    const { error } = await supabaseAdmin
      .from('bot_config')
      .update({
        is_paused: newPauseState,
        updated_at: new Date().toISOString(),
      })
      .eq('id', 'default');

    if (error) throw error;

    console.log(`[API] Bot ${newPauseState ? 'paused' : 'resumed'}`);

    return NextResponse.json({
      success: true,
      isPaused: newPauseState,
      message: newPauseState ? 'Bot mis en pause' : 'Bot repris',
    });
  } catch (error) {
    console.error('[API] Error toggling pause:', error);
    return NextResponse.json({ error: 'Failed to toggle pause' }, { status: 500 });
  }
}
