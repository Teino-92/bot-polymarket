/**
 * WebSocket Service for Polymarket Real-Time Price Monitoring
 * Deployed on Deno Deploy (free tier)
 */

import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.1";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN");
const TELEGRAM_CHAT_ID = Deno.env.get("TELEGRAM_CHAT_ID");

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

interface Position {
  id: string;
  market_id: string;
  market_name: string;
  entry_price: number;
  stop_loss?: number;
  take_profit?: number;
  position_size_eur: number;
  status: string;
}

let lastUpdate: Date | null = null;
const clients: Set<WebSocket> = new Set();

// Send Telegram notification
async function sendTelegramNotification(
  position: Position,
  exitPrice: number,
  pnl: number,
  status: string
): Promise<void> {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.log("[TELEGRAM] Skipping notification - credentials not configured");
    return;
  }

  try {
    const emoji = pnl > 0 ? "💰" : "❌";
    const reasonText = status === "STOPPED" ? "🔴 Stop-Loss atteint" : "🟢 Take-Profit atteint";
    const pnlPercent = ((exitPrice - position.entry_price) / position.entry_price) * 100;

    const message = `
${emoji} *POSITION FERMÉE*

${reasonText}

📊 *Marché*: ${position.market_name}
📍 *Prix d'entrée*: ${(position.entry_price * 100).toFixed(1)}%
📍 *Prix de sortie*: ${(exitPrice * 100).toFixed(1)}%

💵 *PnL*: ${pnl > 0 ? "+" : ""}${pnl.toFixed(2)}€ (${pnlPercent > 0 ? "+" : ""}${pnlPercent.toFixed(2)}%)

🤖 Fermé automatiquement par le WebSocket Monitor
`.trim();

    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: "Markdown",
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("[TELEGRAM] Failed to send notification:", error);
    } else {
      console.log("[TELEGRAM] ✅ Notification sent");
    }
  } catch (error) {
    console.error("[TELEGRAM] Error sending notification:", error);
  }
}

// Fetch open positions from Supabase
async function getOpenPositions(): Promise<Position[]> {
  const { data, error } = await supabase
    .from("positions")
    .select("*");

  if (error) {
    console.error("Error fetching positions:", error);
    return [];
  }

  return data || [];
}

// Fetch current price from Polymarket
async function getCurrentPrice(marketId: string): Promise<number | null> {
  try {
    const response = await fetch(
      `https://gamma-api.polymarket.com/markets/${marketId}`
    );

    if (!response.ok) return null;

    const data = await response.json();

    // Get the current price (last traded price)
    if (data.clobTokenIds && data.clobTokenIds.length > 0) {
      const outcomeResponse = await fetch(
        `https://clob.polymarket.com/prices/${data.clobTokenIds[0]}`
      );

      if (outcomeResponse.ok) {
        const priceData = await outcomeResponse.json();
        return parseFloat(priceData.price || "0");
      }
    }

    return null;
  } catch (error) {
    console.error(`Error fetching price for market ${marketId}:`, error);
    return null;
  }
}

// Check positions and update if needed
async function checkPositions() {
  const positions = await getOpenPositions();

  if (positions.length === 0) {
    return;
  }

  console.log(`[${new Date().toISOString()}] Checking ${positions.length} positions...`);

  for (const position of positions) {
    const currentPrice = await getCurrentPrice(position.market_id);

    if (currentPrice === null) {
      console.log(`Could not fetch price for ${position.market_name}`);
      continue;
    }

    console.log(
      `[${position.market_name}] Entry: ${position.entry_price}, Current: ${currentPrice}, SL: ${position.stop_loss}, TP: ${position.take_profit}`
    );

    let shouldClose = false;
    let closeReason = "";

    // Check stop loss
    if (position.stop_loss && currentPrice <= position.stop_loss) {
      shouldClose = true;
      closeReason = "Stop Loss Hit";
    }

    // Check take profit
    if (position.take_profit && currentPrice >= position.take_profit) {
      shouldClose = true;
      closeReason = "Take Profit Hit";
    }

    if (shouldClose) {
      console.log(`🚨 ${closeReason} for ${position.market_name}!`);

      const pnl = (currentPrice - position.entry_price) * position.position_size_eur;
      const status = closeReason === "Stop Loss Hit" ? "STOPPED" : "CLOSED";

      // 1. Update trade in database
      const { data: trade } = await supabase
        .from("trades")
        .select("*")
        .eq("market_id", position.market_id)
        .eq("status", "OPEN")
        .single();

      if (trade) {
        const { error: tradeError } = await supabase
          .from("trades")
          .update({
            status,
            exit_price: currentPrice,
            closed_at: new Date().toISOString(),
            pnl_eur: pnl,
          })
          .eq("id", trade.id);

        if (tradeError) {
          console.error("Error updating trade:", tradeError);
        }
      }

      // 2. Delete position from positions table
      const { error: positionError } = await supabase
        .from("positions")
        .delete()
        .eq("id", position.id);

      if (positionError) {
        console.error("Error deleting position:", positionError);
      } else {
        console.log(`   Position closed: ${position.market_name} | PnL: ${pnl > 0 ? '+' : ''}${pnl.toFixed(2)}€`);

        // 3. Send Telegram notification
        await sendTelegramNotification(position, currentPrice, pnl, status);

        // 4. Broadcast to all connected clients
        const message = JSON.stringify({
          type: "position_closed",
          position: {
            ...position,
            exit_price: currentPrice,
            reason: closeReason,
            pnl,
          },
        });

        clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(message);
          }
        });
      }
    }
  }

  lastUpdate = new Date();
}

// Health check endpoint
function handleHealthCheck(): Response {
  return new Response(
    JSON.stringify({
      status: "ok",
      lastUpdate: lastUpdate?.toISOString() || null,
      connectedClients: clients.size,
      service: "Polymarket WebSocket Monitor",
    }),
    {
      headers: {
        "content-type": "application/json",
        "access-control-allow-origin": "*",
      },
    }
  );
}

// WebSocket handler
function handleWebSocket(request: Request): Response {
  const { socket, response } = Deno.upgradeWebSocket(request);

  socket.onopen = () => {
    console.log("Client connected");
    clients.add(socket);

    // Send current status
    socket.send(
      JSON.stringify({
        type: "connected",
        lastUpdate: lastUpdate?.toISOString() || null,
      })
    );
  };

  socket.onclose = () => {
    console.log("Client disconnected");
    clients.delete(socket);
  };

  socket.onerror = (error) => {
    console.error("WebSocket error:", error);
    clients.delete(socket);
  };

  return response;
}

// Main HTTP handler
async function handler(request: Request): Promise<Response> {
  const url = new URL(request.url);

  // CORS preflight
  if (request.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "access-control-allow-origin": "*",
        "access-control-allow-methods": "GET, POST, OPTIONS",
        "access-control-allow-headers": "Content-Type",
      },
    });
  }

  // Health check endpoint
  if (url.pathname === "/health") {
    return handleHealthCheck();
  }

  // WebSocket upgrade
  if (url.pathname === "/ws") {
    const upgrade = request.headers.get("upgrade") || "";
    if (upgrade.toLowerCase() === "websocket") {
      return handleWebSocket(request);
    }
  }

  // Default response
  return new Response(
    JSON.stringify({
      service: "Polymarket WebSocket Monitor",
      endpoints: {
        health: "/health",
        websocket: "/ws",
      },
    }),
    {
      headers: {
        "content-type": "application/json",
        "access-control-allow-origin": "*",
      },
    }
  );
}

// Check positions every 10 seconds
setInterval(() => {
  checkPositions().catch(console.error);
}, 10000);

// Initial check
checkPositions().catch(console.error);

console.log("WebSocket service starting on port 8000...");
await serve(handler, { port: 8000 });
