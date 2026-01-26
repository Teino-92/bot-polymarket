/**
 * Gestionnaire de commandes Telegram
 * Permet de contrôler le bot via messages Telegram
 */

import { supabaseAdmin } from '@/lib/supabase';

interface PendingDecision {
  id: string;
  currentTrades: any[];
  newOpportunity: any;
  createdAt: string;
}

// Stocker les décisions en attente (en prod, utiliser Supabase)
const pendingDecisions = new Map<string, PendingDecision>();

/**
 * Enregistre une décision en attente
 */
export function registerPendingDecision(chatId: string, currentTrades: any[], newOpportunity: any): string {
  const id = `decision-${Date.now()}`;
  pendingDecisions.set(chatId, {
    id,
    currentTrades,
    newOpportunity,
    createdAt: new Date().toISOString(),
  });
  return id;
}

/**
 * Traite les commandes Telegram
 */
export async function handleTelegramCommand(command: string, chatId: string): Promise<string> {
  const pending = pendingDecisions.get(chatId);

  switch (command) {
    case '/start':
      return `
🤖 *Bot Polymarket - Menu principal*

Commandes disponibles:
• /status - État actuel du bot
• /positions - Voir les positions actives
• /stats - Statistiques de trading
• /help - Aide et documentation

Le bot t'enverra automatiquement des notifications pour chaque trade.
      `.trim();

    case '/status':
      return await getBotStatus();

    case '/positions':
      return await getActivePositions();

    case '/stats':
      return await getTradingStats();

    case '/take':
      if (!pending) {
        return '❌ Aucune décision en attente. Cette commande est utilisée pour répondre aux alertes d\'opportunités bloquées.';
      }
      await executeTakeDecision(pending);
      pendingDecisions.delete(chatId);
      return '✅ Position la moins profitable fermée. Nouveau trade en cours d\'ouverture...';

    case '/keep':
      if (!pending) {
        return '❌ Aucune décision en attente.';
      }
      pendingDecisions.delete(chatId);
      return '✅ Positions actuelles conservées. L\'opportunité a été ignorée.';

    case '/wait':
      if (!pending) {
        return '❌ Aucune décision en attente.';
      }
      pendingDecisions.delete(chatId);
      return '⏰ OK, j\'attendrai la prochaine vérification (dans 4h). Les positions actuelles restent actives.';

    case '/help':
      return `
📚 *Aide - Bot Polymarket*

*Notifications automatiques:*
• 🟢 Trade ouvert - Détails complets
• 💸 Trade fermé - PnL et raison
• ⚠️ Opportunité bloquée - Demande de décision

*Commandes interactives:*
• /take - Prendre la nouvelle opportunité
• /keep - Garder les positions actuelles
• /wait - Attendre 4h

*Informations:*
• /status - État du bot
• /positions - Positions en cours
• /stats - Performance globale
      `.trim();

    default:
      return `❌ Commande inconnue: ${command}. Utilise /help pour voir les commandes disponibles.`;
  }
}

/**
 * Récupère le statut du bot
 */
async function getBotStatus(): Promise<string> {
  try {
    const { data: positions } = await supabaseAdmin
      .from('positions')
      .select('*')
      .eq('status', 'OPEN');

    const activeCount = positions?.length || 0;
    const canTrade = activeCount < 2;

    return `
🤖 *Statut du bot*

✅ Bot actif et opérationnel
🔄 Prochaine vérification: ~${getNextCronTime()}

📊 *Positions:*
• Actives: ${activeCount}/2
• ${canTrade ? '🟢 Peut ouvrir des trades' : '🔴 Positions pleines'}

⚙️ Mode: ${process.env.SIMULATION_MODE === 'true' ? 'SIMULATION' : 'PRODUCTION'}
    `.trim();
  } catch (error) {
    return '❌ Erreur lors de la récupération du statut';
  }
}

/**
 * Récupère les positions actives
 */
async function getActivePositions(): Promise<string> {
  try {
    const { data: positions } = await supabaseAdmin
      .from('positions')
      .select('*')
      .eq('status', 'OPEN')
      .order('opened_at', { ascending: false });

    if (!positions || positions.length === 0) {
      return '📭 Aucune position active pour le moment.';
    }

    const positionsText = positions.map((p, i) => {
      const pnlPercent = ((p.unrealized_pnl_eur / p.position_size_eur) * 100).toFixed(2);
      return `
${i + 1}. *${p.market_name}*
   • ${p.side} @ ${(p.entry_price * 100).toFixed(1)}% → ${(p.current_price * 100).toFixed(1)}%
   • PnL: ${p.unrealized_pnl_eur >= 0 ? '+' : ''}${p.unrealized_pnl_eur.toFixed(2)}€ (${pnlPercent}%)
   • Stratégie: ${p.strategy}
   • Ouvert il y a ${getTimeSince(p.opened_at)}
      `.trim();
    }).join('\n\n');

    return `
📊 *Positions actives (${positions.length})*

${positionsText}
    `.trim();
  } catch (error) {
    return '❌ Erreur lors de la récupération des positions';
  }
}

/**
 * Récupère les statistiques de trading
 */
async function getTradingStats(): Promise<string> {
  try {
    const { data: trades } = await supabaseAdmin
      .from('trades')
      .select('*')
      .eq('status', 'CLOSED')
      .order('closed_at', { ascending: false })
      .limit(100);

    if (!trades || trades.length === 0) {
      return '📊 Pas encore de trades fermés.';
    }

    const totalTrades = trades.length;
    const wins = trades.filter(t => t.pnl_eur > 0).length;
    const losses = totalTrades - wins;
    const totalPnL = trades.reduce((sum, t) => sum + (t.pnl_eur || 0), 0);
    const totalVolume = trades.reduce((sum, t) => sum + t.position_size_eur, 0);
    const winRate = (wins / totalTrades * 100).toFixed(1);
    const avgPnL = (totalPnL / totalTrades).toFixed(2);

    return `
📊 *Statistiques de trading*

💼 *Performance:*
• Total trades: ${totalTrades}
• Gagnants: ${wins} | Perdants: ${losses}
• Win Rate: ${winRate}%
• PnL Total: ${totalPnL >= 0 ? '+' : ''}${totalPnL.toFixed(2)}€
• PnL Moyen: ${avgPnL}€

📈 *Volume:*
• Total tradé: ${totalVolume.toFixed(2)}€
• Moyenne par trade: ${(totalVolume / totalTrades).toFixed(2)}€

${totalPnL >= 0 ? '🚀 Profitable!' : '💪 Keep going!'}
    `.trim();
  } catch (error) {
    return '❌ Erreur lors de la récupération des stats';
  }
}

/**
 * Exécute la décision /take
 */
async function executeTakeDecision(pending: PendingDecision): Promise<void> {
  // Trouver la position la moins profitable
  const worstPosition = pending.currentTrades.reduce((worst, current) =>
    current.unrealizedPnL < worst.unrealizedPnL ? current : worst
  );

  // Fermer cette position (à implémenter dans l'API bot)
  // await closePosition(worstPosition.id);

  // Ouvrir la nouvelle position (à implémenter dans l'API bot)
  // await openPosition(pending.newOpportunity);

  console.log('[TELEGRAM] Executing TAKE decision:', {
    closingPosition: worstPosition.marketName,
    openingPosition: pending.newOpportunity.marketName,
  });
}

/**
 * Calcule le temps depuis une date
 */
function getTimeSince(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}j`;
  if (hours > 0) return `${hours}h`;
  return 'moins d\'1h';
}

/**
 * Calcule le temps jusqu'au prochain cron
 */
function getNextCronTime(): string {
  const now = new Date();
  const nextHour = new Date(now);
  nextHour.setHours(Math.ceil(now.getHours() / 4) * 4, 0, 0, 0);

  const diff = nextHour.getTime() - now.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  return `${hours}h ${minutes}min`;
}
