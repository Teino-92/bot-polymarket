import { ClobClient, Side } from '@polymarket/clob-client';
import { BuilderConfig } from '@polymarket/builder-signing-sdk';
import { Wallet } from '@ethersproject/wallet';
import type { MarketData, OrderParams, OrderResult } from '../types';
import { marketCache } from './cache';

const CLOB_HOST = 'https://clob.polymarket.com';
const POLYGON_CHAIN_ID = 137;

/**
 * Polymarket CLOB API Client using the official @polymarket/clob-client SDK.
 * Auth: L1 private key → L2 API credentials (key/secret/passphrase).
 * Set POLYMARKET_PRIVATE_KEY env var to your main wallet private key.
 * Set SIMULATION_MODE=false to enable real trading.
 */
export class PolymarketClient {
  private simulationMode: boolean;
  private clobClient: ClobClient | null = null;
  private initialized = false;

  constructor() {
    this.simulationMode = process.env.SIMULATION_MODE !== 'false';

    if (this.simulationMode) {
      console.log('🎮 [POLYMARKET] Running in SIMULATION mode');
    } else {
      console.log('⚠️  [POLYMARKET] Running in REAL TRADING mode');
    }
  }

  /**
   * Lazy-initializes the ClobClient and derives L2 API credentials.
   * Only called when actually placing/cancelling orders in real mode.
   */
  private async ensureClobClient(): Promise<ClobClient> {
    if (this.clobClient && this.initialized) return this.clobClient;

    const privateKey = process.env.POLYMARKET_PRIVATE_KEY;
    if (!privateKey) {
      throw new Error('[POLYMARKET] POLYMARKET_PRIVATE_KEY env var is not set');
    }

    const wallet = new Wallet(privateKey);
    this.clobClient = new ClobClient(CLOB_HOST, POLYGON_CHAIN_ID, wallet);

    // Derive L2 API key (creates one if it doesn't exist yet)
    const creds = await this.clobClient.createOrDeriveApiKey();
    console.log(`[POLYMARKET] L2 API key derived for address ${wallet.address}`);

    // Re-instantiate with L2 creds + Builder auth (bypasses Cloudflare on POST /order)
    const geoBlockToken = process.env.POLYMARKET_GEO_BLOCK_TOKEN;

    // Builder credentials — required for POST /order to pass Cloudflare
    const builderKey = process.env.POLYMARKET_BUILDER_KEY;
    const builderSecret = process.env.POLYMARKET_BUILDER_SECRET;
    const builderPassphrase = process.env.POLYMARKET_BUILDER_PASSPHRASE;

    let builderConfig: BuilderConfig | undefined;
    if (builderKey && builderSecret && builderPassphrase) {
      builderConfig = new BuilderConfig({
        localBuilderCreds: { key: builderKey, secret: builderSecret, passphrase: builderPassphrase },
      });
      console.log(`[POLYMARKET] Builder auth: SET (key=${builderKey.slice(0, 8)}…)`);
    } else {
      console.log('[POLYMARKET] Builder auth: NOT SET — POST /order will likely be blocked by Cloudflare');
    }

    this.clobClient = new ClobClient(
      CLOB_HOST,
      POLYGON_CHAIN_ID,
      wallet,
      creds,
      undefined, // signatureType
      undefined, // funderAddress
      geoBlockToken,
      undefined, // useServerTime
      builderConfig
    );
    this.initialized = true;
    return this.clobClient;
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
   * Récupère le prix actuel d'un marché (mid-price du YES token).
   * En simulation retourne un prix aléatoire.
   * En production utilise le CLOB SDK via getMarket pour obtenir le tokenID,
   * puis getPrice sur le YES token.
   */
  async getPrice(marketId: string): Promise<number> {
    if (this.simulationMode) {
      return 0.45 + Math.random() * 0.3;
    }

    try {
      const client = await this.ensureClobClient();
      // getMarket returns market details including tokens
      const market = await client.getMarket(marketId);
      const yesToken = market?.tokens?.find((t: any) => t.outcome === 'Yes');
      if (!yesToken?.token_id) {
        throw new Error(`No YES token found for market ${marketId}`);
      }
      const midpoint = await client.getMidpoint(yesToken.token_id);
      return midpoint.mid;
    } catch (error) {
      console.error('[POLYMARKET] Error fetching price:', error);
      throw error;
    }
  }

  /**
   * Place un ordre limite sur un marché via le CLOB SDK.
   *
   * tokenID mapping:
   *   - side YES  → BUY  the YES token at `price`
   *   - side NO   → SELL the YES token at `price` (equivalent to buying NO)
   *
   * If yesTokenId is not provided, we fetch it from the CLOB market endpoint.
   */
  async placeLimitOrder(params: OrderParams): Promise<OrderResult> {
    const { marketId, side, price, size } = params;

    if (this.simulationMode) {
      console.log('🎮 [SIMULATION] Would place order:', {
        marketId,
        side,
        price: price.toFixed(4),
        sizeEur: size.toFixed(2),
      });
      return {
        orderId: `sim-${Date.now()}`,
        txHash: `0xsimulated${Math.random().toString(36).substr(2, 9)}`,
        status: 'simulated',
      };
    }

    try {
      const client = await this.ensureClobClient();

      // Resolve YES tokenID
      let tokenID: string = params.yesTokenId!;
      if (!tokenID) {
        const market = await client.getMarket(marketId);
        const yesToken = market?.tokens?.find((t: any) => t.outcome === 'Yes');
        if (!yesToken?.token_id) {
          throw new Error(`No YES token found for conditionId ${marketId}`);
        }
        tokenID = yesToken.token_id;
      }

      // Determine tick size for this token
      const tickSize = await client.getTickSize(tokenID);

      // YES → BUY the YES token; NO → SELL the YES token
      const clobSide = side === 'YES' ? Side.BUY : Side.SELL;

      console.log('🔴 [REAL TRADING] Placing order via CLOB SDK:', {
        tokenID,
        clobSide,
        price,
        size,
        tickSize,
      });

      const result = await client.createAndPostOrder(
        { tokenID, price, size, side: clobSide },
        { tickSize }
      );

      console.log('[POLYMARKET] Order result:', JSON.stringify(result));

      // Guard: SDK does not always throw on HTTP errors (e.g. Cloudflare 403).
      // If the result lacks a real orderID, treat it as a failed order.
      const orderId = result?.orderID || result?.id;
      if (!orderId) {
        const detail = result?.error || result?.message || JSON.stringify(result);
        throw new Error(`[POLYMARKET] Order failed — no orderID returned. Detail: ${detail}`);
      }

      return {
        orderId,
        txHash: result?.transactionHash || result?.tx_hash || '',
        status: result?.status || 'posted',
      };
    } catch (error) {
      console.error('[POLYMARKET] Error placing order:', error);
      throw error;
    }
  }

  /**
   * Annule un ordre existant via le CLOB SDK.
   */
  async cancelOrder(orderId: string): Promise<void> {
    if (this.simulationMode) {
      console.log('🎮 [SIMULATION] Would cancel order:', orderId);
      return;
    }

    try {
      const client = await this.ensureClobClient();
      await client.cancelOrder({ orderID: orderId });
      console.log(`[POLYMARKET] Cancelled order ${orderId}`);
    } catch (error) {
      console.error('[POLYMARKET] Error canceling order:', error);
      throw error;
    }
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

        // Extract YES token ID from Gamma tokens array
        let yesTokenId: string | undefined;
        if (Array.isArray(market.tokens)) {
          const yesToken = market.tokens.find((t: any) => t.outcome === 'Yes');
          yesTokenId = yesToken?.token_id;
        }

        return {
          id: market.conditionId || market.id || `gamma-${Date.now()}`,
          yesTokenId,
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
