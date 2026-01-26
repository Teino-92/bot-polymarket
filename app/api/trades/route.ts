import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

/**
 * GET /api/trades - Récupère tous les trades (ouverts et fermés)
 */
export async function GET() {
  try {
    const { data: trades, error } = await supabaseAdmin
      .from('trades')
      .select('*')
      .order('opened_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json(trades || []);
  } catch (error) {
    console.error('[API] Error fetching trades:', error);
    return NextResponse.json({ error: 'Failed to fetch trades' }, { status: 500 });
  }
}
