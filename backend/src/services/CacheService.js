import NodeCache from 'node-cache';

/**
 * CacheService - Manages in-memory caching with TTL-based expiration
 * 
 * Features:
 * - TTL-based expiration for cached items
 * - Cache statistics for monitoring (hits, misses, keys)
 * - Standard cache operations (get, set, delete, clear)
 */
class CacheService {
  constructor() {
    // Initialize node-cache with check period for expired keys
    this.cache = new NodeCache({
      stdTTL: 0, // No default TTL, must be specified per item
      checkperiod: 120, // Check for expired keys every 120 seconds
      useClones: false // Don't clone objects for better performance
    });

    // Statistics tracking
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0
    };

    // Listen to cache events for statistics
    this.cache.on('set', () => {
      this.stats.sets++;
    });

    this.cache.on('del', () => {
      this.stats.deletes++;
    });
  }

  /**
   * Get a value from the cache
   * @param {string} key - The cache key
   * @returns {*} The cached value or undefined if not found/expired
   */
  get(key) {
    const value = this.cache.get(key);
    
    if (value !== undefined) {
      this.stats.hits++;
    } else {
      this.stats.misses++;
    }

    return value;
  }

  /**
   * Set a value in the cache with TTL
   * @param {string} key - The cache key
   * @param {*} value - The value to cache
   * @param {number} ttl - Time to live in seconds
   * @returns {boolean} True if successful
   */
  set(key, value, ttl) {
    if (typeof ttl !== 'number' || ttl <= 0) {
      throw new Error('TTL must be a positive number');
    }

    return this.cache.set(key, value, ttl);
  }

  /**
   * Delete a specific key from the cache
   * @param {string} key - The cache key to delete
   * @returns {number} Number of deleted entries (0 or 1)
   */
  delete(key) {
    return this.cache.del(key);
  }

  /**
   * Clear all entries from the cache
   */
  clear() {
    this.cache.flushAll();
    // Reset statistics when clearing
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0
    };
  }

  /**
   * Get cache statistics for monitoring
   * @returns {Object} Statistics object with hits, misses, keys count, and hit rate
   */
  getStats() {
    const keys = this.cache.keys();
    const totalRequests = this.stats.hits + this.stats.misses;
    const hitRate = totalRequests > 0 ? (this.stats.hits / totalRequests) * 100 : 0;

    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      sets: this.stats.sets,
      deletes: this.stats.deletes,
      keys: keys.length,
      hitRate: hitRate.toFixed(2) + '%',
      totalRequests
    };
  }

  /**
   * Check if a key exists in the cache
   * @param {string} key - The cache key
   * @returns {boolean} True if key exists and is not expired
   */
  has(key) {
    return this.cache.has(key);
  }

  /**
   * Get TTL for a specific key
   * @param {string} key - The cache key
   * @returns {number|undefined} TTL in seconds, or undefined if key doesn't exist
   */
  getTtl(key) {
    return this.cache.getTtl(key);
  }

  /**
   * Get all keys in the cache
   * @returns {string[]} Array of cache keys
   */
  keys() {
    return this.cache.keys();
  }
}

export default CacheService;
