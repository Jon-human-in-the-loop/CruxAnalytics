/**
 * Calculation Cache Module
 * Caches expensive calculations (sensitivity, break-even) to improve performance
 */

interface CacheEntry<T> {
  key: string;
  value: T;
  timestamp: number;
}

class CalculationCache {
  private cache: Map<string, CacheEntry<any>>;
  private maxSize: number;
  private ttl: number; // Time to live in milliseconds

  constructor(maxSize: number = 100, ttl: number = 5 * 60 * 1000) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.ttl = ttl;
  }

  /**
   * Generate cache key from inputs
   */
  private generateKey(prefix: string, inputs: any): string {
    return `${prefix}:${JSON.stringify(inputs)}`;
  }

  /**
   * Get cached value if exists and not expired
   */
  get<T>(prefix: string, inputs: any): T | null {
    const key = this.generateKey(prefix, inputs);
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.value as T;
  }

  /**
   * Set cache value
   */
  set<T>(prefix: string, inputs: any, value: T): void {
    const key = this.generateKey(prefix, inputs);

    // Remove oldest entry if cache is full
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      key,
      value,
      timestamp: Date.now(),
    });
  }

  /**
   * Invalidate cache entries by prefix
   */
  invalidate(prefix: string): void {
    const keysToDelete: string[] = [];

    this.cache.forEach((entry, key) => {
      if (key.startsWith(prefix)) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      ttl: this.ttl,
    };
  }
}

// Global cache instance
export const calculationCache = new CalculationCache();

// Cache prefixes
export const CACHE_PREFIXES = {
  SENSITIVITY: 'sensitivity',
  BREAK_EVEN: 'break-even',
  FINANCIAL: 'financial',
};
