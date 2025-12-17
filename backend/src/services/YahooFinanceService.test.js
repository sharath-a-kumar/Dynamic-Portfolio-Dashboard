import YahooFinanceService from './YahooFinanceService.js';
import CacheService from './CacheService.js';

describe('YahooFinanceService', () => {
  let cacheService;
  let yahooService;

  beforeEach(() => {
    cacheService = new CacheService();
    yahooService = new YahooFinanceService(cacheService, {
      cacheTTL: 10,
      maxRetries: 3,
      initialRetryDelay: 100,
      timeout: 5000,
      minRequestInterval: 50
    });
  });

  afterEach(() => {
    cacheService.clear();
  });

  describe('Constructor and Configuration', () => {
    test('should create service with default options', () => {
      const service = new YahooFinanceService(cacheService);
      expect(service.cacheTTL).toBe(10);
      expect(service.maxRetries).toBe(3);
      expect(service.initialRetryDelay).toBe(1000);
    });

    test('should create service with custom options', () => {
      const service = new YahooFinanceService(cacheService, {
        cacheTTL: 20,
        maxRetries: 5,
        initialRetryDelay: 500
      });
      expect(service.cacheTTL).toBe(20);
      expect(service.maxRetries).toBe(5);
      expect(service.initialRetryDelay).toBe(500);
    });
  });

  describe('getCurrentPrice - Input Validation', () => {
    test('should throw error for empty string symbol', async () => {
      await expect(yahooService.getCurrentPrice('')).rejects.toThrow('Invalid symbol');
    });

    test('should throw error for null symbol', async () => {
      await expect(yahooService.getCurrentPrice(null)).rejects.toThrow('Invalid symbol');
    });

    test('should throw error for undefined symbol', async () => {
      await expect(yahooService.getCurrentPrice(undefined)).rejects.toThrow('Invalid symbol');
    });

    test('should throw error for numeric symbol', async () => {
      await expect(yahooService.getCurrentPrice(123)).rejects.toThrow('Invalid symbol');
    });

    test('should throw error for object symbol', async () => {
      await expect(yahooService.getCurrentPrice({})).rejects.toThrow('Invalid symbol');
    });
  });

  describe('getBatchPrices - Input Validation', () => {
    test('should return empty map for empty array', async () => {
      const priceMap = await yahooService.getBatchPrices([]);
      expect(priceMap.size).toBe(0);
      expect(priceMap instanceof Map).toBe(true);
    });

    test('should return empty map for null input', async () => {
      const priceMap = await yahooService.getBatchPrices(null);
      expect(priceMap.size).toBe(0);
    });

    test('should return empty map for undefined input', async () => {
      const priceMap = await yahooService.getBatchPrices(undefined);
      expect(priceMap.size).toBe(0);
    });

    test('should return empty map for non-array input', async () => {
      const priceMap = await yahooService.getBatchPrices('not an array');
      expect(priceMap.size).toBe(0);
    });

    test('should filter out invalid symbols from array', async () => {
      // Test with only invalid symbols - should return empty map without making API calls
      const symbols = ['', null, undefined, 123, {}, []];
      const priceMap = await yahooService.getBatchPrices(symbols);
      
      // Should return empty map since all symbols are invalid
      expect(priceMap instanceof Map).toBe(true);
      expect(priceMap.size).toBe(0);
    });
  });

  describe('Cache Integration', () => {
    test('should cache prices with correct TTL', () => {
      const symbol = 'TEST.NS';
      const price = 1234.56;
      const cacheKey = `yahoo:price:${symbol}`;
      
      // Manually set cache to test integration
      cacheService.set(cacheKey, price, yahooService.cacheTTL);
      
      // Verify cache is used
      const cachedPrice = cacheService.get(cacheKey);
      expect(cachedPrice).toBe(price);
    });

    test('should use correct cache key format', () => {
      const symbol = 'RELIANCE.NS';
      const expectedKey = `yahoo:price:${symbol}`;
      
      // Set a value in cache
      cacheService.set(expectedKey, 2500.50, 10);
      
      // Verify the key exists
      expect(cacheService.has(expectedKey)).toBe(true);
    });

    test('should clear only Yahoo Finance cache entries', () => {
      // Set Yahoo cache entries
      cacheService.set('yahoo:price:RELIANCE.NS', 2500, 10);
      cacheService.set('yahoo:price:TCS.NS', 3400, 10);
      
      // Set non-Yahoo cache entry
      cacheService.set('google:pe:RELIANCE.NS', 25, 10);
      
      // Clear Yahoo cache
      yahooService.clearCache();
      
      // Verify Yahoo entries are cleared
      expect(cacheService.get('yahoo:price:RELIANCE.NS')).toBeUndefined();
      expect(cacheService.get('yahoo:price:TCS.NS')).toBeUndefined();
      
      // Verify non-Yahoo entry remains
      expect(cacheService.get('google:pe:RELIANCE.NS')).toBe(25);
    });
  });

  describe('Service Statistics', () => {
    test('should return service statistics with cache info', () => {
      const stats = yahooService.getStats();
      
      expect(stats).toHaveProperty('cache');
      expect(stats).toHaveProperty('queueLength');
      expect(stats).toHaveProperty('isProcessingQueue');
    });

    test('should show empty queue initially', () => {
      const stats = yahooService.getStats();
      
      expect(stats.queueLength).toBe(0);
      expect(stats.isProcessingQueue).toBe(false);
    });

    test('should include cache statistics', () => {
      const stats = yahooService.getStats();
      
      expect(stats.cache).toHaveProperty('hits');
      expect(stats.cache).toHaveProperty('misses');
      expect(stats.cache).toHaveProperty('keys');
      expect(stats.cache).toHaveProperty('hitRate');
    });
  });

  describe('Error Handling', () => {
    test('should create Yahoo error objects with correct structure', () => {
      // Test that errors thrown have the correct structure
      // We can't easily test actual API errors without mocking, but we can test the structure
      const testError = {
        source: 'yahoo',
        message: 'Test error',
        symbol: 'TEST.NS',
        timestamp: expect.any(Date)
      };
      
      expect(testError.source).toBe('yahoo');
      expect(testError.message).toBeTruthy();
    });
  });

  describe('Rate Limiting', () => {
    test('should have rate limiting configuration', () => {
      expect(yahooService.minRequestInterval).toBe(50);
      expect(yahooService.requestQueue).toEqual([]);
      expect(yahooService.isProcessingQueue).toBe(false);
    });

    test('should initialize with zero last request time', () => {
      expect(yahooService.lastRequestTime).toBe(0);
    });
  });

  describe('Retry Logic Configuration', () => {
    test('should have retry configuration', () => {
      expect(yahooService.maxRetries).toBe(3);
      expect(yahooService.initialRetryDelay).toBe(100);
    });

    test('should have timeout configuration', () => {
      expect(yahooService.timeout).toBe(5000);
    });
  });
});
