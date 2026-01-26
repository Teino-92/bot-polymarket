import { NextRequest, NextResponse } from 'next/server';
import { handleTelegramCommand } from '@/lib/telegram/commands';

export const dynamic = 'force-dynamic';

/**
 * Webhook Telegram pour recevoir les commandes
 * URL à configurer: https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://your-app.vercel.app/api/telegram/webhook
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Vérifier que c'est un message
    if (!body.message || !body.message.text) {
      return NextResponse.json({ ok: true });
    }

    const chatId = body.message.chat.id.toString();
    const text = body.message.text.trim();

    console.log('[TELEGRAM] Received command:', text, 'from chat:', chatId);

    // Ignorer les messages qui ne sont pas des commandes
    if (!text.startsWith('/')) {
      return NextResponse.json({ ok: true });
    }

    // Traiter la commande
    const response = await handleTelegramCommand(text, chatId);

    // Envoyer la réponse
    const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    if (TELEGRAM_BOT_TOKEN) {
      await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: response,
          parse_mode: 'Markdown',
        }),
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[TELEGRAM] Webhook error:', error);
    return NextResponse.json({ ok: false, error: 'Internal error' }, { status: 500 });
  }
}
