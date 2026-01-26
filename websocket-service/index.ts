import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Configuration
const POLYMARKET_WS_URL = 'wss://ws-subscriptions-clob.polymarket.com/ws/market';
const PORT = parseInt(Deno.env.get('PORT') || '8000');

interface Position {
  id: string;
  market_id: string;
  side: 'YES' | 'NO';
  entry_price: number;
  stop_loss_price: number;
  take_profit_price: number | null;
  status: string;
  position_size_eur: number;
}

// État global
let lastUpdate: Date | null = null;
let websocketConnected = false;
const activePositions = new Map<string, Position>();
const priceCache = new Map<string, number>();
let ws: WebSocket | null = null;

// Client Supabase
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

console.log('[WS] Starting Polymarket WebSocket Service...');
console.log('[WS] Supabase URL:', Deno.env.get('SUPABASE_URL'));

// Fonction pour charger les positions actives
async function loadActivePositions() {
  try {
    const { data: positions, error } = await supabase
      .from('positions')
      .select('*')
      .eq('status', 'OPEN');

    if (error) {
      console.error('[WS] Error fetching positions:', error);
      return [];
    }

    console.log(`[WS] Loaded ${positions?.length || 0} active positions`);
    return positions || [];
  } catch (error) {
    console.error('[WS] Exception loading positions:', error);
    return [];
  }
}

// Fonction pour fermer une position
async function closePosition(position: Position, currentPrice: number, reason: string) {
  try {
    console.log(`[WS] Closing position ${position.id}: ${reason}`);
    console.log(`[WS] Entry: ${position.entry_price}, Exit: ${currentPrice}`);

    // Calculer le PnL
    let pnl = 0;
    if (position.side === 'YES') {
      pnl = (currentPrice - position.entry_price) * position.position_size_eur;
    } else {
      pnl = (position.entry_price - currentPrice) * position.position_size_eur;
    }

    // Mettre à jour dans Supabase
    const { error } = await supabase
      .from('positions')
      .update({
        status: 'CLOSED',
        exit_price: currentPrice,
        pnl_eur: pnl,
        closed_at: new Date().toISOString(),
        close_reason: reason,
      })
      .eq('id', position.id);

    if (error) {
      console.error('[WS] Error updating position:', error);
      return false;
    }

    // Retirer de la surveillance
    activePositions.delete(position.id);
    console.log(`[WS] ✅ Position ${position.id} closed successfully. PnL: ${pnl.toFixed(2)}€`);

    return true;
  } catch (error) {
    console.error('[WS] Exception closing position:', error);
    return false;
  }
}

// Fonction pour vérifier les conditions de sortie
async function checkExitConditions(position: Position, currentPrice: number) {
  let shouldExit = false;
  let exitReason = '';

  if (position.side === 'YES') {
    // Position YES
    if (currentPrice <= position.stop_loss_price) {
      shouldExit = true;
      exitReason = 'Stop-loss hit';
    } else if (position.take_profit_price && currentPrice >= position.take_profit_price) {
      shouldExit = true;
      exitReason = 'Take-profit hit';
    }
  } else {
    // Position NO
    if (currentPrice >= position.stop_loss_price) {
      shouldExit = true;
      exitReason = 'Stop-loss hit';
    } else if (position.take_profit_price && currentPrice <= position.take_profit_price) {
      shouldExit = true;
      exitReason = 'Take-profit hit';
    }
  }

  if (shouldExit) {
    await closePosition(position, currentPrice, exitReason);
  }
}

// Fonction pour connecter au WebSocket
async function connectWebSocket() {
  try {
    // Charger les positions actives
    const positions = await loadActivePositions();

    // Mettre à jour notre map
    activePositions.clear();
    positions.forEach((pos: Position) => {
      activePositions.set(pos.id, pos);
    });

    console.log(`[WS] Monitoring ${activePositions.size} active positions`);

    if (activePositions.size === 0) {
      console.log('[WS] No active positions to monitor. Will retry in 30s...');
      setTimeout(connectWebSocket, 30000);
      return;
    }

    // Fermer l'ancienne connexion si elle existe
    if (ws) {
      try {
        ws.close();
      } catch (e) {
        // Ignore
      }
    }

    // Créer nouvelle connexion WebSocket
    ws = new WebSocket(POLYMARKET_WS_URL);

    ws.onopen = () => {
      console.log('[WS] Connected to Polymarket WebSocket');
      websocketConnected = true;

      // S'abonner aux marchés
      activePositions.forEach((pos) => {
        const subscribeMsg = JSON.stringify({
          type: 'subscribe',
          market: pos.market_id,
        });
        ws?.send(subscribeMsg);
        console.log(`[WS] Subscribed to market: ${pos.market_id}`);
      });
    };

    ws.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data.toString());
        lastUpdate = new Date();

        // Si c'est une mise à jour de prix
        if (data.market && data.price !== undefined) {
          const marketId = data.market;
          const price = parseFloat(data.price);

          // Mettre à jour le cache
          priceCache.set(marketId, price);

          // Vérifier toutes les positions pour ce marché
          for (const [posId, position] of activePositions.entries()) {
            if (position.market_id === marketId) {
              await checkExitConditions(position, price);
            }
          }
        }
      } catch (error) {
        console.error('[WS] Error processing message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('[WS] WebSocket error:', error);
      websocketConnected = false;
    };

    ws.onclose = () => {
      console.log('[WS] WebSocket closed, reconnecting in 5s...');
      websocketConnected = false;
      setTimeout(connectWebSocket, 5000);
    };

  } catch (error) {
    console.error('[WS] Error connecting to WebSocket:', error);
    websocketConnected = false;
    setTimeout(connectWebSocket, 5000);
  }
}

// Fonction pour rafraîchir les positions périodiquement
async function refreshPositions() {
  const positions = await loadActivePositions();

  // Ajouter les nouvelles positions
  positions.forEach((pos: Position) => {
    if (!activePositions.has(pos.id)) {
      activePositions.set(pos.id, pos);
      console.log(`[WS] New position detected: ${pos.id} for market ${pos.market_id}`);

      // S'abonner au marché si WebSocket connecté
      if (ws && websocketConnected) {
        const subscribeMsg = JSON.stringify({
          type: 'subscribe',
          market: pos.market_id,
        });
        ws.send(subscribeMsg);
        console.log(`[WS] Subscribed to new market: ${pos.market_id}`);
      }
    }
  });

  // Retirer les positions qui ne sont plus actives
  const activeIds = new Set(positions.map((p: Position) => p.id));
  for (const [posId] of activePositions.entries()) {
    if (!activeIds.has(posId)) {
      console.log(`[WS] Position ${posId} no longer active, removing from monitoring`);
      activePositions.delete(posId);
    }
  }
}

// Serveur HTTP pour health check et status
serve(async (req) => {
  const url = new URL(req.url);

  // CORS headers
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  if (url.pathname === '/health') {
    const status = {
      status: websocketConnected ? 'online' : 'offline',
      lastUpdate: lastUpdate?.toISOString() || null,
      activePositions: activePositions.size,
      monitoredMarkets: priceCache.size,
      timestamp: new Date().toISOString(),
    };

    return new Response(
      JSON.stringify(status),
      { headers, status: 200 }
    );
  }

  if (url.pathname === '/status') {
    const positions = Array.from(activePositions.values()).map(pos => ({
      id: pos.id,
      market_id: pos.market_id,
      side: pos.side,
      entry_price: pos.entry_price,
      current_price: priceCache.get(pos.market_id) || null,
      stop_loss: pos.stop_loss_price,
      take_profit: pos.take_profit_price,
    }));

    return new Response(
      JSON.stringify({
        websocket_connected: websocketConnected,
        positions,
        last_update: lastUpdate?.toISOString() || null,
      }),
      { headers, status: 200 }
    );
  }

  return new Response(
    JSON.stringify({
      service: 'Polymarket WebSocket Monitor',
      version: '1.0.0',
      endpoints: ['/health', '/status']
    }),
    { headers, status: 200 }
  );
}, { port: PORT });

console.log(`[WS] HTTP server listening on port ${PORT}`);

// Démarrer la surveillance
connectWebSocket();

// Rafraîchir les positions toutes les 60 secondes
setInterval(refreshPositions, 60000);

console.log('[WS] Service fully initialized ✅');
