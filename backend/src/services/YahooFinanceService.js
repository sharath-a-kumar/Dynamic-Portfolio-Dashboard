import axios from 'axios';
import { createYahooError } from '../models/ApiError.js';

/**
 * YahooFinanceService - Fetches real-time stock prices from Yahoo Finance
 * 
 * Features:
 * - Fetch current market price (CMP) for individual stocks
 * - Batch fetch prices for multiple stocks
 * - Retry logic with exponential backoff
 * - Integration with CacheService
 * - Rate limiting and error handling
 * - Uses direct API calls with browser-like headers to avoid rate limiting
 */
class YahooFinanceService {
  /**
   * @param {CacheService} cacheService - Cache service instance
   * @param {Object} options - Configuration options
   */
  constructor(cacheService, options = {}) {
    this.cacheService = cacheService;
    this.cacheTTL = options.cacheTTL || 60; // 60 seconds default (increased for cloud)
    this.maxRetries = options.maxRetries || 2;
    this.initialRetryDelay = options.initialRetryDelay || 2000; // 2 seconds
    this.rateLimitBackoff = 30000; // 30 seconds backoff when rate limited
    this.lastRateLimitTime = 0;
    
    // Create axios instance with browser-like headers
    this.httpClient = axios.create({
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
        'Cache-Control': 'no-cache',
      }
    });
  }

  /**
   * Check if we're currently in rate limit backoff period
   * @returns {boolean}
   */
  isRateLimited() {
    return Date.now() - this.lastRateLimitTime < this.rateLimitBackoff;
  }

  /**
   * Get current price for a single stock symbol
   * @param {string} symbol - Stock symbol (e.g., 'RELIANCE.NS' for NSE)
   * @returns {Promise<number>} Current market price
   * @throws {Error} If price cannot be fetched
   */
  async getCurrentPrice(symbol) {
    if (!symbol || typeof symbol !== 'string') {
      throw new Error('Invalid symbol: must be a non-empty string');
    }

    // Check cache first
    const cacheKey = `yahoo:price:${symbol}`;
    const cachedPrice = this.cacheService.get(cacheKey);
    
    if (cachedPrice !== undefined) {
      return cachedPrice;
    }

    // If rate limited, return null instead of making more requests
    if (this.isRateLimited()) {
      console.log(`Rate limited, skipping fetch for ${symbol}`);
      return null;
    }

    // Fetch with retry logic
    const price = await this._fetchPriceWithRetry(symbol);
    
    // Cache the result
    if (price !== null) {
      this.cacheService.set(cacheKey, price, this.cacheTTL);
    }
    
    return price;
  }

  /**
   * Get prices for multiple stock symbols in batch (single API call)
   * @param {string[]} symbols - Array of stock symbols
   * @returns {Promise<Map<string, number>>} Map of symbol to price
   */
  async getBatchPrices(symbols) {
    if (!Array.isArray(symbols) || symbols.length === 0) {
      return new Map();
    }

    // Filter out invalid symbols and check cache
    const validSymbols = symbols.filter(s => s && typeof s === 'string');
    
    if (validSymbols.length === 0) {
      return new Map();
    }

    const priceMap = new Map();
    const uncachedSymbols = [];

    // Check cache first for all symbols
    for (const symbol of validSymbols) {
      const cacheKey = `yahoo:price:${symbol}`;
      const cachedPrice = this.cacheService.get(cacheKey);
      
      if (cachedPrice !== undefined) {
        priceMap.set(symbol, cachedPrice);
      } else {
        uncachedSymbols.push(symbol);
      }
    }

    // If all symbols were cached, return immediately
    if (uncachedSymbols.length === 0) {
      return priceMap;
    }

    // If rate limited, return only cached data
    if (this.isRateLimited()) {
      console.log('Rate limited, returning cached data only');
      return priceMap;
    }

    // Fetch all uncached symbols - try batch first, then parallel individual
    try {
      // Try batch API first (single request for all symbols)
      const batchPrices = await this._fetchBatchPricesFromYahoo(uncachedSymbols);
      
      for (const [symbol, price] of batchPrices) {
        priceMap.set(symbol, price);
        const cacheKey = `yahoo:price:${symbol}`;
        this.cacheService.set(cacheKey, price, this.cacheTTL);
      }
      
      // Check if any symbols were missed in batch
      const missedSymbols = uncachedSymbols.filter(s => !batchPrices.has(s));
      
      // Fetch missed symbols in parallel (max 5 at a time)
      if (missedSymbols.length > 0) {
        const results = await this._fetchParallel(missedSymbols, 5);
        for (const { symbol, price } of results) {
          if (price !== null) {
            priceMap.set(symbol, price);
            const cacheKey = `yahoo:price:${symbol}`;
            this.cacheService.set(cacheKey, price, this.cacheTTL);
          }
        }
      }
    } catch (error) {
      // Check if it's a rate limit error
      if (error.message?.includes('429') || error.message?.includes('Too Many Requests')) {
        console.warn('Rate limited by Yahoo Finance, backing off...');
        this.lastRateLimitTime = Date.now();
        return priceMap;
      }
      
      // If batch fails, try parallel individual requests
      console.warn('Batch quote failed, falling back to parallel requests:', error.message);
      
      const results = await this._fetchParallel(uncachedSymbols, 5);
      for (const { symbol, price } of results) {
        if (price !== null) {
          priceMap.set(symbol, price);
          const cacheKey = `yahoo:price:${symbol}`;
          this.cacheService.set(cacheKey, price, this.cacheTTL);
        }
      }
    }

    return priceMap;
  }

  /**
   * Fetch price with exponential backoff retry logic
   * @private
   * @param {string} symbol - Stock symbol
   * @returns {Promise<number>} Current market price
   */
  async _fetchPriceWithRetry(symbol) {
    let lastError;
    
    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        const price = await this._fetchPriceFromYahoo(symbol);
        return price;
      } catch (error) {
        lastError = error;
        
        // Don't retry on certain errors
        if (error.message.includes('Invalid symbol') || 
            error.message.includes('not found')) {
          throw error;
        }
        
        // Calculate exponential backoff delay
        if (attempt < this.maxRetries - 1) {
          const delay = this.initialRetryDelay * Math.pow(2, attempt);
          await this._sleep(delay);
        }
      }
    }
    
    // All retries failed
    throw lastError;
  }

  /**
   * Fetch price from Yahoo Finance using direct HTTP request
   * @private
   * @param {string} symbol - Stock symbol
   * @returns {Promise<number>} Current market price
   */
  async _fetchPriceFromYahoo(symbol) {
    try {
      // Use Yahoo Finance chart API (more reliable than quote API)
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`;
      
      const response = await this.httpClient.get(url);
      
      if (!response.data || !response.data.chart || !response.data.chart.result) {
        throw createYahooError(`No data returned for symbol: ${symbol}`, symbol);
      }
      
      const result = response.data.chart.result[0];
      
      if (!result || !result.meta) {
        throw createYahooError(`Invalid response for symbol: ${symbol}`, symbol);
      }
      
      // Get the regular market price from meta
      const price = result.meta.regularMarketPrice;
      
      if (price === undefined || price === null || isNaN(price)) {
        throw createYahooError(`Unable to get price for symbol: ${symbol}`, symbol);
      }

      return price;
    } catch (error) {
      if (error.source === 'yahoo') {
        throw error;
      }
      
      // Handle HTTP errors
      if (error.response) {
        if (error.response.status === 429) {
          throw createYahooError(`Rate limited for ${symbol}`, symbol);
        }
        if (error.response.status === 404) {
          throw createYahooError(`Symbol not found: ${symbol}`, symbol);
        }
      }
      
      throw createYahooError(
        `Failed to fetch price for ${symbol}: ${error.message}`,
        symbol
      );
    }
  }
  
  /**
   * Fetch prices for multiple symbols using batch API
   * @private
   * @param {string[]} symbols - Array of stock symbols
   * @returns {Promise<Map<string, number>>} Map of symbol to price
   */
  async _fetchBatchPricesFromYahoo(symbols) {
    const priceMap = new Map();
    
    try {
      // Use Yahoo Finance quote API for batch requests
      const symbolsParam = symbols.join(',');
      const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(symbolsParam)}`;
      
      const response = await this.httpClient.get(url);
      
      if (response.data && response.data.quoteResponse && response.data.quoteResponse.result) {
        for (const quote of response.data.quoteResponse.result) {
          if (quote && quote.symbol && quote.regularMarketPrice !== undefined) {
            priceMap.set(quote.symbol, quote.regularMarketPrice);
          }
        }
      }
    } catch (error) {
      // If batch fails, throw to trigger individual fetches
      if (error.response?.status === 429) {
        throw new Error('Too Many Requests');
      }
      throw error;
    }
    
    return priceMap;
  }

  /**
   * Fetch multiple symbols in parallel with concurrency limit
   * @private
   * @param {string[]} symbols - Array of stock symbols
   * @param {number} concurrency - Max concurrent requests
   * @returns {Promise<Array<{symbol: string, price: number|null}>>}
   */
  async _fetchParallel(symbols, concurrency = 5) {
    const results = [];
    
    // Process in batches of 'concurrency' size
    for (let i = 0; i < symbols.length; i += concurrency) {
      const batch = symbols.slice(i, i + concurrency);
      
      const batchResults = await Promise.all(
        batch.map(async (symbol) => {
          try {
            const price = await this._fetchPriceFromYahoo(symbol);
            return { symbol, price };
          } catch (err) {
            if (err.message?.includes('429') || err.message?.includes('Rate limited')) {
              this.lastRateLimitTime = Date.now();
            }
            return { symbol, price: null };
          }
        })
      );
      
      results.push(...batchResults);
      
      // Small delay between batches to avoid rate limiting
      if (i + concurrency < symbols.length) {
        await this._sleep(200);
      }
    }
    
    return results;
  }

  /**
   * Sleep utility for delays
   * @private
   * @param {number} ms - Milliseconds to sleep
   * @returns {Promise<void>}
   */
  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Clear all cached prices
   */
  clearCache() {
    const keys = this.cacheService.keys();
    keys.forEach(key => {
      if (key.startsWith('yahoo:price:')) {
        this.cacheService.delete(key);
      }
    });
  }

  /**
   * Get service statistics
   * @returns {Object} Service statistics including cache stats
   */
  getStats() {
    const cacheStats = this.cacheService.getStats();
    return {
      cache: cacheStats
    };
  }
}

export default YahooFinanceService;
