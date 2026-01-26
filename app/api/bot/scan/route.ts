import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 60 seconds for manual scan

/**
 * POST /api/bot/scan - Lance un scan manuel des opportunités
 * Appelle l'Edge Function Supabase qui exécute le bot
 */
export async function POST() {
  try {
    console.log('[API] Manual scan triggered');

    // Appeler l'Edge Function Supabase bot-execute
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase credentials missing');
    }

    const response = await fetch(`${supabaseUrl}/functions/v1/bot-execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
      },
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Bot execution failed');
    }

    return NextResponse.json({
      success: true,
      result,
      message: 'Scan terminé avec succès',
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
