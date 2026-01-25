/**
 * Simple in-memory cache pour Gamma API
 * Évite de dépasser la limite de 1000 calls/heure
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

class MarketCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes par défaut

  /**
   * Récupère une valeur du cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Vérifier si expiré
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Stocke une valeur dans le cache
   */
  set<T>(key: string, data: T, ttlMs?: number): void {
    const ttl = ttlMs || this.defaultTTL;
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + ttl,
    };

    this.cache.set(key, entry);
  }

  /**
   * Supprime une clé du cache
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Vide complètement le cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Statistiques du cache
   */
  stats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }

  /**
   * Nettoie les entrées expirées
   */
  cleanup(): number {
    let cleaned = 0;
    const now = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    return cleaned;
  }
}

// Export singleton
export const marketCache = new MarketCache();

// Cleanup automatique toutes les 10 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const cleaned = marketCache.cleanup();
    if (cleaned > 0) {
      console.log(`[CACHE] Cleaned ${cleaned} expired entries`);
    }
  }, 10 * 60 * 1000);
}
