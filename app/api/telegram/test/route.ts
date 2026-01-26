import { NextResponse } from 'next/server';
import { testTelegramConnection } from '@/lib/telegram/notifications';

export const dynamic = 'force-dynamic';

/**
 * API pour tester la connexion Telegram
 * GET /api/telegram/test
 */
export async function GET() {
  try {
    const success = await testTelegramConnection();

    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Message de test envoyé sur Telegram !',
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'Échec de l\'envoi. Vérifie TELEGRAM_BOT_TOKEN et TELEGRAM_CHAT_ID',
      }, { status: 500 });
    }
  } catch (error) {
    console.error('[TELEGRAM] Test error:', error);
    return NextResponse.json({
      success: false,
      message: 'Erreur lors du test',
      error: String(error),
    }, { status: 500 });
  }
}
