/**
 * WebSocket Service pour Polymarket
 * Déploiement: Railway.app ou Render.com (gratuit)
 * 
 * Ce service maintient une connexion WebSocket persistante
 * et met à jour Supabase quand les prix changent
 */

import WebSocket from 'ws';
import { createClient } from '@supabase/supabase-js';

// Configuration
const POLYMARKET_WS_URL = 'wss://ws-subscriptions-clob.polymarket.com/ws/';
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Client Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Positions actives à monitorer
let activePositions = new Map();

/**
 * Récupère les positions actives depuis Supabase
 */
async function fetchActivePositions() {
  const { data, error } = await supabase
    .from('positions')
    .select('*')
    .eq('status', 'OPEN');

  if (error) {
    console.error('[WS] Error fetching positions:', error);
    return [];
  }

  return data || [];
}

/**
 * Met à jour le prix actuel d'une position
 */
async function updatePositionPrice(marketId, newPrice) {
  const position = activePositions.get(marketId);
  if (!position) return;

  const pnl = calculatePnL(position, newPrice);
  
  // Vérifier stop-loss et take-profit
  const shouldClose = checkExitConditions(position, newPrice, pnl);

  if (shouldClose.shouldExit) {
    console.log(`[WS] ${shouldClose.reason} triggered for ${position.market_name}`);
    await closePosition(position.id, newPrice, pnl, shouldClose.reason);
    activePositions.delete(marketId);
  } else {
    // Mettre à jour le prix et PnL en temps réel
    await supabase
      .from('positions')
      .update({
        current_price: newPrice,
        unrealized_pnl_eur: pnl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', position.id);
  }
}

/**
 * Calcule le PnL d'une position
 */
function calculatePnL(position, currentPrice) {
  const priceChange = currentPrice - position.entry_price;
  const pnl = priceChange * position.position_size_eur;
  return parseFloat(pnl.toFixed(2));
}

/**
 * Vérifie les conditions de sortie (stop-loss / take-profit)
 */
function checkExitConditions(position, currentPrice, pnl) {
  const pnlPercent = pnl / position.position_size_eur;

  // Stop-loss: -15%
  if (currentPrice <= position.stop_loss_price) {
    return {
      shouldExit: true,
      reason: 'STOP_LOSS',
    };
  }

  // Take-profit: +8% (FLIP only)
  if (position.take_profit_price && currentPrice >= position.take_profit_price) {
    return {
      shouldExit: true,
      reason: 'TAKE_PROFIT',
    };
  }

  return { shouldExit: false };
}

/**
 * Ferme une position
 */
async function closePosition(positionId, exitPrice, pnl, reason) {
  // 1. Mettre à jour la position comme fermée
  await supabase
    .from('positions')
    .update({
      status: 'CLOSED',
      current_price: exitPrice,
      unrealized_pnl_eur: pnl,
      updated_at: new Date().toISOString(),
    })
    .eq('id', positionId);

  // 2. Créer un trade dans l'historique
  const { data: position } = await supabase
    .from('positions')
    .select('*')
    .eq('id', positionId)
    .single();

  if (position) {
    await supabase.from('trades').insert({
      market_id: position.market_id,
      market_name: position.market_name,
      side: position.side,
      strategy: position.strategy,
      entry_price: position.entry_price,
      exit_price: exitPrice,
      position_size_eur: position.position_size_eur,
      pnl_eur: pnl,
      hvs_score: 0,
      flip_ev: 0,
      status: 'CLOSED',
      opened_at: position.opened_at,
      closed_at: new Date().toISOString(),
      tx_hash: `ws-close-${Date.now()}`,
    });
  }

  console.log(`[WS] Position closed: ${reason} | PnL: ${pnl}€`);
}

/**
 * Connexion WebSocket à Polymarket
 */
function connectWebSocket() {
  const ws = new WebSocket(POLYMARKET_WS_URL);

  ws.on('open', async () => {
    console.log('[WS] Connected to Polymarket WebSocket');

    // Charger les positions actives
    const positions = await fetchActivePositions();
    positions.forEach((pos) => {
      activePositions.set(pos.market_id, pos);
    });

    console.log(`[WS] Monitoring ${positions.length} active positions`);

    // S'abonner aux prix des marchés
    positions.forEach((pos) => {
      const subscribeMsg = {
        type: 'subscribe',
        channel: 'market',
        market: pos.market_id,
      };
      ws.send(JSON.stringify(subscribeMsg));
    });
  });

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());

      if (message.type === 'price_update') {
        const { market, price } = message;
        updatePositionPrice(market, parseFloat(price));
      }
    } catch (error) {
      console.error('[WS] Error parsing message:', error);
    }
  });

  ws.on('close', () => {
    console.log('[WS] Connection closed, reconnecting in 5s...');
    setTimeout(connectWebSocket, 5000);
  });

  ws.on('error', (error) => {
    console.error('[WS] WebSocket error:', error);
  });
}

// Rafraîchir la liste des positions toutes les 5 minutes
setInterval(async () => {
  const positions = await fetchActivePositions();
  
  // Ajouter les nouvelles positions
  positions.forEach((pos) => {
    if (!activePositions.has(pos.market_id)) {
      activePositions.set(pos.market_id, pos);
      console.log(`[WS] New position added: ${pos.market_name}`);
    }
  });

  console.log(`[WS] Monitoring ${activePositions.size} positions`);
}, 5 * 60 * 1000);

// Démarrer le service
console.log('[WS] Starting Polymarket WebSocket Service...');
connectWebSocket();
