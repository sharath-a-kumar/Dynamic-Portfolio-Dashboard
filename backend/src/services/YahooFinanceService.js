import YahooFinance from 'yahoo-finance2';
import { createYahooError } from '../models/ApiError.js';

/**
 * YahooFinanceService - Fetches real-time stock prices from Yahoo Finance
 * 
 * Features:
 * - Fetch current market price (CMP) for individual stocks
 * - Batch fetch prices for multiple stocks
 * - Retry logic with exponential backoff
 * - Integration with CacheService (10-second TTL)
 * - Rate limiting and error handling
 */
class YahooFinanceService {
  /**
   * @param {CacheService} cacheService - Cache service instance
   * @param {Object} options - Configuration options
   */
  constructor(cacheService, options = {}) {
    this.cacheService = cacheService;
    this.cacheTTL = options.cacheTTL || 10; // 10 seconds default
    this.maxRetries = options.maxRetries || 1; // Reduced retries for faster loading
    this.initialRetryDelay = options.initialRetryDelay || 500; // 500ms
    
    // Initialize yahoo-finance2 instance
    this.yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey'] });
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

    // Fetch all uncached symbols in a single batch API call
    try {
      const quotes = await this.yahooFinance.quote(uncachedSymbols);
      
      // Handle both single quote and array of quotes
      const quotesArray = Array.isArray(quotes) ? quotes : [quotes];
      
      for (const quote of quotesArray) {
        if (quote && quote.symbol && quote.regularMarketPrice !== undefined) {
          const price = quote.regularMarketPrice;
          priceMap.set(quote.symbol, price);
          
          // Cache the result
          const cacheKey = `yahoo:price:${quote.symbol}`;
          this.cacheService.set(cacheKey, price, this.cacheTTL);
        }
      }
    } catch (error) {
      // If batch fails, fall back to individual requests
      console.warn('Batch quote failed, falling back to individual requests:', error.message);
      
      const pricePromises = uncachedSymbols.map(symbol => 
        this.getCurrentPrice(symbol)
          .then(price => ({ symbol, price }))
          .catch(() => ({ symbol, price: null }))
      );

      const results = await Promise.all(pricePromises);
      
      for (const { symbol, price } of results) {
        if (price !== null) {
          priceMap.set(symbol, price);
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
   * Fetch price from Yahoo Finance using yahoo-finance2 library
   * @private
   * @param {string} symbol - Stock symbol
   * @returns {Promise<number>} Current market price
   */
  async _fetchPriceFromYahoo(symbol) {
    try {
      // Use yahoo-finance2 quote method
      const quote = await this.yahooFinance.quote(symbol);
      
      if (!quote) {
        throw createYahooError(`No data returned for symbol: ${symbol}`, symbol);
      }

      // Get the regular market price
      const price = quote.regularMarketPrice;
      
      if (price === undefined || price === null || isNaN(price)) {
        throw createYahooError(`Unable to get price for symbol: ${symbol}`, symbol);
      }

      return price;
    } catch (error) {
      if (error.source === 'yahoo') {
        throw error;
      }
      
      // Handle yahoo-finance2 specific errors
      if (error.message?.includes('Not Found') || error.message?.includes('no results')) {
        throw createYahooError(`Symbol not found: ${symbol}`, symbol);
      }
      
      throw createYahooError(
        `Failed to fetch price for ${symbol}: ${error.message}`,
        symbol
      );
    }
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
