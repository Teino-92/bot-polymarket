/**
 * Système de notifications Telegram pour le bot Polymarket
 * Envoie des alertes lors des trades, sorties, et opportunités bloquées
 */

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '';

interface TradeNotification {
  marketName: string;
  side: 'YES' | 'NO';
  strategy: 'HOLD' | 'FLIP';
  entryPrice: number;
  positionSize: number;
  hvs: number;
  flipEV: number;
  stopLoss: number;
  takeProfit?: number;
  daysUntilResolution: number;
}

interface ExitNotification {
  marketName: string;
  side: 'YES' | 'NO';
  strategy: 'HOLD' | 'FLIP';
  entryPrice: number;
  exitPrice: number;
  positionSize: number;
  pnl: number;
  reason: 'STOP_LOSS' | 'TAKE_PROFIT' | 'RESOLUTION' | 'MANUAL';
  duration: string; // "2 days 5 hours"
}

interface BetterOpportunityNotification {
  currentTrades: {
    marketName: string;
    strategy: string;
    unrealizedPnL: number;
  }[];
  newOpportunity: {
    marketName: string;
    strategy: 'HOLD' | 'FLIP';
    flipEV: number;
    hvs: number;
    entryPrice: number;
  };
}

/**
 * Envoie une notification Telegram
 */
async function sendTelegramMessage(message: string, parseMode: 'Markdown' | 'HTML' = 'Markdown'): Promise<boolean> {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.warn('[TELEGRAM] Bot token or chat ID not configured');
    return false;
  }

  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: parseMode,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('[TELEGRAM] Error sending message:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[TELEGRAM] Failed to send message:', error);
    return false;
  }
}

/**
 * Notification 1: Trade ouvert
 */
export async function notifyTradeOpened(data: TradeNotification): Promise<void> {
  const emoji = data.side === 'YES' ? '🟢' : '🔴';
  const strategyEmoji = data.strategy === 'HOLD' ? '💎' : '🔄';

  const message = `
${emoji} *NOUVEAU TRADE OUVERT* ${strategyEmoji}

📊 *Marché:* ${data.marketName}

💰 *Détails du trade:*
• Position: ${data.side} @ ${(data.entryPrice * 100).toFixed(1)}%
• Taille: ${data.positionSize.toFixed(2)}€
• Stratégie: ${data.strategy}

📈 *Métriques:*
• FlipEV: ${data.flipEV.toFixed(2)}€
• HVS: ${data.hvs.toFixed(2)}€
• Stop-Loss: ${(data.stopLoss * 100).toFixed(1)}% (-15%)
${data.takeProfit ? `• Take-Profit: ${(data.takeProfit * 100).toFixed(1)}% (+8%)` : ''}

⏱️ *Résolution:* ${data.daysUntilResolution} jours

🎯 _${data.strategy === 'HOLD' ? 'Holding jusqu\'à résolution' : 'Flipping pour volume airdrop'}_
  `.trim();

  await sendTelegramMessage(message);
}

/**
 * Notification 2: Trade fermé
 */
export async function notifyTradeClosed(data: ExitNotification): Promise<void> {
  const pnlEmoji = data.pnl >= 0 ? '✅' : '❌';
  const reasonEmoji = {
    STOP_LOSS: '🛑',
    TAKE_PROFIT: '🎯',
    RESOLUTION: '🏁',
    MANUAL: '👤',
  }[data.reason];

  const pnlPercent = ((data.pnl / data.positionSize) * 100).toFixed(2);

  const message = `
${pnlEmoji} *TRADE FERMÉ* ${reasonEmoji}

📊 *Marché:* ${data.marketName}

💸 *Résultat:*
• PnL: ${data.pnl >= 0 ? '+' : ''}${data.pnl.toFixed(2)}€ (${pnlPercent}%)
• Entrée: ${(data.entryPrice * 100).toFixed(1)}%
• Sortie: ${(data.exitPrice * 100).toFixed(1)}%
• Capital: ${data.positionSize.toFixed(2)}€

📋 *Raison:* ${data.reason.replace('_', ' ')}
⏱️ *Durée:* ${data.duration}

${data.pnl >= 0 ? '🎉 Profit!' : '😔 Perte'}
  `.trim();

  await sendTelegramMessage(message);
}

/**
 * Notification 3: Meilleure opportunité trouvée mais positions pleines
 */
export async function notifyBetterOpportunity(data: BetterOpportunityNotification): Promise<void> {
  const currentPnL = data.currentTrades.reduce((sum, t) => sum + t.unrealizedPnL, 0);

  const tradesText = data.currentTrades
    .map((t, i) => `${i + 1}. ${t.marketName}\n   ${t.strategy} | PnL: ${t.unrealizedPnL >= 0 ? '+' : ''}${t.unrealizedPnL.toFixed(2)}€`)
    .join('\n');

  const message = `
⚠️ *MEILLEURE OPPORTUNITÉ DÉTECTÉE*

🚫 *Impossible d'ouvrir:* 2 positions déjà actives

📊 *Positions actuelles:*
${tradesText}
💰 Total PnL non réalisé: ${currentPnL >= 0 ? '+' : ''}${currentPnL.toFixed(2)}€

🆕 *Nouvelle opportunité:*
• Marché: ${data.newOpportunity.marketName}
• Stratégie: ${data.newOpportunity.strategy}
• Prix entrée: ${(data.newOpportunity.entryPrice * 100).toFixed(1)}%
• FlipEV: ${data.newOpportunity.flipEV.toFixed(2)}€
• HVS: ${data.newOpportunity.hvs.toFixed(2)}€

❓ *Que faire?*
Réponds avec:
• /take - Fermer la position la moins profitable et prendre la nouvelle
• /keep - Garder les 2 positions actuelles
• /wait - Attendre la prochaine vérification (4h)
  `.trim();

  await sendTelegramMessage(message);
}

/**
 * Envoie un récapitulatif quotidien
 */
export async function notifyDailySummary(stats: {
  totalTrades: number;
  wins: number;
  losses: number;
  totalPnL: number;
  volume: number;
  activePositions: number;
}): Promise<void> {
  const winRate = stats.totalTrades > 0 ? (stats.wins / stats.totalTrades * 100).toFixed(1) : '0';

  const message = `
📊 *RÉCAPITULATIF QUOTIDIEN*

💼 *Trading:*
• Trades: ${stats.totalTrades} (${stats.wins}W / ${stats.losses}L)
• Win Rate: ${winRate}%
• PnL Total: ${stats.totalPnL >= 0 ? '+' : ''}${stats.totalPnL.toFixed(2)}€

📈 *Airdrop:*
• Volume 24h: ${stats.volume.toFixed(2)}€
• Positions actives: ${stats.activePositions}

${stats.totalPnL >= 0 ? '🚀 Bonne journée!' : '💪 On remonte demain!'}
  `.trim();

  await sendTelegramMessage(message);
}

/**
 * Test de connexion Telegram
 */
export async function testTelegramConnection(): Promise<boolean> {
  const message = `
🤖 *Bot Polymarket - Test de connexion*

✅ Le bot est connecté et prêt!

Tu recevras des notifications pour:
• 🟢 Nouveaux trades ouverts
• 💸 Trades fermés avec PnL
• ⚠️ Opportunités bloquées (décision requise)
• 📊 Récapitulatif quotidien

Bon trading! 🚀
  `.trim();

  return await sendTelegramMessage(message);
}
