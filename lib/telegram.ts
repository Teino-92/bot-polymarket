/**
 * Telegram notification helper
 */

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

export async function sendTelegramNotification(message: string): Promise<void> {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.log('[TELEGRAM] Skipping notification - credentials not configured');
    return;
  }

  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'Markdown',
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[TELEGRAM] Failed to send notification:', error);
    } else {
      console.log('[TELEGRAM] ✅ Notification sent');
    }
  } catch (error) {
    console.error('[TELEGRAM] Error sending notification:', error);
  }
}

/**
 * Send position opened notification
 */
export async function notifyPositionOpened(params: {
  marketName: string;
  strategy: string;
  entryPrice: number;
  size: number;
  stopLoss: number;
  takeProfit: number | null;
}): Promise<void> {
  const { marketName, strategy, entryPrice, size, stopLoss, takeProfit } = params;

  const message = `
🟢 *POSITION OUVERTE*

📊 *Marché*: ${marketName}
📈 *Stratégie*: ${strategy}
💰 *Taille*: ${size}€
📍 *Prix d'entrée*: ${(entryPrice * 100).toFixed(1)}%

🛡️ *Stop-Loss*: ${(stopLoss * 100).toFixed(1)}%
${takeProfit ? `🎯 *Take-Profit*: ${(takeProfit * 100).toFixed(1)}%` : ''}
`.trim();

  await sendTelegramNotification(message);
}

/**
 * Send position closed notification
 */
export async function notifyPositionClosed(params: {
  marketName: string;
  entryPrice: number;
  exitPrice: number;
  pnl: number;
  reason: 'STOPPED' | 'CLOSED' | 'MANUAL';
}): Promise<void> {
  const { marketName, entryPrice, exitPrice, pnl, reason } = params;

  const emoji = pnl > 0 ? '💰' : '❌';
  const reasonText = {
    STOPPED: '🔴 Stop-Loss atteint',
    CLOSED: '🟢 Take-Profit atteint',
    MANUAL: '✋ Fermeture manuelle',
  }[reason];

  const pnlPercent = ((exitPrice - entryPrice) / entryPrice) * 100;

  const message = `
${emoji} *POSITION FERMÉE*

${reasonText}

📊 *Marché*: ${marketName}
📍 *Prix d'entrée*: ${(entryPrice * 100).toFixed(1)}%
📍 *Prix de sortie*: ${(exitPrice * 100).toFixed(1)}%

💵 *PnL*: ${pnl > 0 ? '+' : ''}${pnl.toFixed(2)}€ (${pnlPercent > 0 ? '+' : ''}${pnlPercent.toFixed(2)}%)
`.trim();

  await sendTelegramNotification(message);
}
