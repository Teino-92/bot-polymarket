import type { MarketData, OrderParams, OrderResult, TradeSide } from '../types';
import { marketCache } from './cache';

/**
 * Polymarket CLOB API Client
 * Documentation: https://docs.polymarket.com
 *
 * IMPORTANT: Ce client démarre TOUJOURS en mode simulation.
 * Pour activer le mode réel, il faut explicitement passer SIMULATION_MODE=false
 */
export class PolymarketClient {
  private baseUrl: string;
  private apiKey?: string;
  private simulationMode: boolean;

  constructor() {
    this.baseUrl = process.env.POLYMARKET_CLOB_URL || 'https://clob.polymarket.com';
    this.apiKey = process.env.POLYMARKET_API_KEY;
    this.simulationMode = process.env.SIMULATION_MODE !== 'false';

    if (this.simulationMode) {
      console.log('🎮 [POLYMARKET] Running in SIMULATION mode');
    } else {
      console.log('⚠️  [POLYMARKET] Running in REAL TRADING mode');
    }
  }

  /**
   * Récupère les marchés actifs sur Polymarket
   * @param limit Nombre de marchés à récupérer (max 100)
   */
  async getMarkets(options: { limit?: number } = {}): Promise<MarketData[]> {
    const { limit = 100 } = options;
    const cacheKey = `markets:${limit}`;

    // Vérifier le cache (TTL 5 minutes pour éviter trop d'appels API)
    const cached = marketCache.get<MarketData[]>(cacheKey);
    if (cached) {
      console.log(`[POLYMARKET] Using cached markets (${cached.length} markets)`);
      return cached;
    }

    try {
      // Utiliser GAMMA API pour récupérer les vrais marchés
      // Cette API est GRATUITE et ne nécessite pas d'authentification
      const gammaUrl = 'https://gamma-api.polymarket.com/markets';
      const params = new URLSearchParams({
        limit: limit.toString(),
        active: 'true',
        closed: 'false',
        order: 'liquidity',
        ascending: 'false',
      });

      const response = await fetch(`${gammaUrl}?${params}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.warn(`[POLYMARKET] Gamma API failed (${response.status}), using fallback`);
        return this.getMockMarkets(limit);
      }

      const markets = await response.json();
      const parsed = this.parseGammaMarkets(markets);

      // Mettre en cache pour 5 minutes
      marketCache.set(cacheKey, parsed, 5 * 60 * 1000);
      console.log(`[POLYMARKET] Fetched ${markets.length} real markets from Gamma API (cached)`);

      return parsed;
    } catch (error) {
      console.error('[POLYMARKET] Error fetching markets from Gamma API:', error);
      console.log('[POLYMARKET] Falling back to mock markets');
      return this.getMockMarkets(limit);
    }
  }

  /**
   * Récupère le prix actuel d'un marché spécifique
   */
  async getPrice(marketId: string): Promise<number> {
    if (this.simulationMode) {
      // Prix simulé avec variation aléatoire
      return 0.45 + Math.random() * 0.3; // Entre 0.45 et 0.75
    }

    try {
      const response = await fetch(`${this.baseUrl}/markets/${marketId}/price`, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch price for ${marketId}: ${response.statusText}`);
      }

      const data = await response.json();
      return data.price;
    } catch (error) {
      console.error('[POLYMARKET] Error fetching price:', error);
      throw error;
    }
  }

  /**
   * Place un ordre limite sur un marché
   * CRITICAL: En mode simulation, ne fait qu'un log
   */
  async placeLimitOrder(params: OrderParams): Promise<OrderResult> {
    const { marketId, side, price, size } = params;

    // MODE SIMULATION: log seulement, pas de vrai ordre
    if (this.simulationMode) {
      console.log('🎮 [SIMULATION] Would place order:', {
        marketId,
        side,
        price: price.toFixed(4),
        sizeEur: size.toFixed(2),
      });

      // Simuler succès avec fake tx hash
      const orderId = `sim-${Date.now()}`;
      const txHash = `0xsimulated${Math.random().toString(36).substr(2, 9)}`;

      return {
        orderId,
        txHash,
        status: 'simulated',
      };
    }

    // MODE REAL: vraie exécution
    try {
      console.log('🔴 [REAL TRADING] Placing order:', params);

      const response = await fetch(`${this.baseUrl}/orders`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          market_id: marketId,
          side: side.toLowerCase(),
          price,
          size,
          order_type: 'LIMIT',
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to place order: ${response.statusText}`);
      }

      const data = await response.json();

      return {
        orderId: data.order_id,
        txHash: data.tx_hash,
        status: data.status,
      };
    } catch (error) {
      console.error('[POLYMARKET] Error placing order:', error);
      throw error;
    }
  }

  /**
   * Annule un ordre existant
   */
  async cancelOrder(orderId: string): Promise<void> {
    if (this.simulationMode) {
      console.log('🎮 [SIMULATION] Would cancel order:', orderId);
      return;
    }

    try {
      const response = await fetch(`${this.baseUrl}/orders/${orderId}`, {
        method: 'DELETE',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to cancel order: ${response.statusText}`);
      }
    } catch (error) {
      console.error('[POLYMARKET] Error canceling order:', error);
      throw error;
    }
  }

  /**
   * Headers pour les requêtes API
   */
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    return headers;
  }

  /**
   * Parse les données de marchés depuis l'API
   */
  private parseMarkets(data: any[]): MarketData[] {
    return data.map((market) => ({
      id: market.id || market.market_id,
      question: market.question || market.title,
      category: market.category || 'unknown',
      endDate: market.end_date || market.close_time,
      liquidity: market.liquidity || 0,
      bestBid: market.best_bid || 0,
      bestAsk: market.best_ask || 0,
      volume24h: market.volume_24h,
    }));
  }

  /**
   * Parse les données de marchés depuis Gamma API
   * Format Gamma: { question, endDateIso, liquidity, outcomePrices: "[\"0.5\", \"0.5\"]" }
   */
  private parseGammaMarkets(data: any[]): MarketData[] {
    return data
      .filter((market) => {
        // Filtrer les marchés avec données valides
        return (
          market.question &&
          market.endDateIso &&
          market.outcomePrices &&
          market.active === true &&
          market.closed === false
        );
      })
      .map((market) => {
        // Gamma API fournit déjà bestBid et bestAsk réels !
        let bestBid = parseFloat(market.bestBid) || 0;
        let bestAsk = parseFloat(market.bestAsk) || 0;

        // Si bid/ask non disponibles, utiliser outcomePrices avec spread estimé
        if (bestBid === 0 || bestAsk === 0) {
          try {
            const prices = JSON.parse(market.outcomePrices);
            const yesPrice = parseFloat(prices[0]) || 0.5;
            const estimatedSpread = 0.03;
            bestBid = Math.max(0, yesPrice - estimatedSpread / 2);
            bestAsk = Math.min(1, yesPrice + estimatedSpread / 2);
          } catch (e) {
            console.warn(`[POLYMARKET] Failed to parse prices for ${market.id}:`, e);
            bestBid = 0.485;
            bestAsk = 0.515;
          }
        }

        return {
          id: market.conditionId || market.id || `gamma-${Date.now()}`,
          question: market.question,
          category: market.groupItemTitle || 'unknown',
          endDate: market.endDateIso,
          liquidity: parseFloat(market.liquidityNum || market.liquidity) || 0,
          bestBid,
          bestAsk,
          volume24h: parseFloat(market.volumeNum || market.volume) || 0,
          volume1w: parseFloat(market.volume1wk) || 0,
          volume1mo: parseFloat(market.volume1mo) || 0,
          priceChange1h: parseFloat(market.oneHourPriceChange) || 0,
          lastTradePrice: parseFloat(market.lastTradePrice) || 0,
        };
      });
  }

  /**
   * Données mockées pour le mode simulation
   */
  private getMockMarkets(limit: number): MarketData[] {
    const mockMarkets: MarketData[] = [
      {
        id: 'mock-1',
        question: 'Will Apple announce AR glasses before June 2025?',
        category: 'tech',
        endDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString(), // +120 jours
        liquidity: 45000,
        bestBid: 0.32,
        bestAsk: 0.37,
        volume24h: 5200,
      },
      {
        id: 'mock-2',
        question: 'Will France win Eurovision 2025?',
        category: 'entertainment',
        endDate: new Date(Date.now() + 85 * 24 * 60 * 60 * 1000).toISOString(), // +85 jours
        liquidity: 28000,
        bestBid: 0.18,
        bestAsk: 0.20,
        volume24h: 3400,
      },
      {
        id: 'mock-3',
        question: 'Will Bitcoin reach $150k this week?',
        category: 'crypto',
        endDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(), // +4 jours
        liquidity: 250000,
        bestBid: 0.08,
        bestAsk: 0.09,
        volume24h: 125000,
      },
      {
        id: 'mock-4',
        question: 'Will Tesla stock hit $300 before March 2025?',
        category: 'business',
        endDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
        liquidity: 67000,
        bestBid: 0.55,
        bestAsk: 0.61,
        volume24h: 8900,
      },
      {
        id: 'mock-5',
        question: 'Will Democrats win the 2025 Virginia election?',
        category: 'politics',
        endDate: new Date(Date.now() + 95 * 24 * 60 * 60 * 1000).toISOString(),
        liquidity: 89000,
        bestBid: 0.42,
        bestAsk: 0.46,
        volume24h: 12300,
      },
      {
        id: 'mock-6',
        question: 'Will OpenAI release GPT-5 before July 2025?',
        category: 'tech',
        endDate: new Date(Date.now() + 155 * 24 * 60 * 60 * 1000).toISOString(),
        liquidity: 112000,
        bestBid: 0.28,
        bestAsk: 0.33,
        volume24h: 18900,
      },
    ];

    return mockMarkets.slice(0, Math.min(limit, mockMarkets.length));
  }

  /**
   * Vérifie si le client est en mode simulation
   */
  isSimulation(): boolean {
    return this.simulationMode;
  }
}

// Export singleton instance
export const polymarketClient = new PolymarketClient();
