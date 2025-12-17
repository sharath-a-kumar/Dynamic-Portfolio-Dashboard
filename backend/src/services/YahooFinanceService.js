import axios from 'axios';
import * as cheerio from 'cheerio';
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
    this.maxRetries = options.maxRetries || 3;
    this.initialRetryDelay = options.initialRetryDelay || 1000; // 1 second
    this.timeout = options.timeout || 5000; // 5 seconds
    
    // Rate limiting
    this.requestQueue = [];
    this.isProcessingQueue = false;
    this.minRequestInterval = options.minRequestInterval || 100; // 100ms between requests
    this.lastRequestTime = 0;
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
    this.cacheService.set(cacheKey, price, this.cacheTTL);
    
    return price;
  }

  /**
   * Get prices for multiple stock symbols in batch
   * @param {string[]} symbols - Array of stock symbols
   * @returns {Promise<Map<string, number>>} Map of symbol to price
   */
  async getBatchPrices(symbols) {
    if (!Array.isArray(symbols) || symbols.length === 0) {
      return new Map();
    }

    // Filter out invalid symbols
    const validSymbols = symbols.filter(s => s && typeof s === 'string');
    
    if (validSymbols.length === 0) {
      return new Map();
    }

    // Fetch prices in parallel with rate limiting
    const pricePromises = validSymbols.map(symbol => 
      this._queueRequest(() => this.getCurrentPrice(symbol))
        .then(price => ({ symbol, price, error: null }))
        .catch(error => ({ symbol, price: null, error }))
    );

    const results = await Promise.all(pricePromises);
    
    // Build result map
    const priceMap = new Map();
    results.forEach(({ symbol, price, error }) => {
      if (price !== null) {
        priceMap.set(symbol, price);
      }
    });

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
   * Fetch price from Yahoo Finance using web scraping
   * @private
   * @param {string} symbol - Stock symbol
   * @returns {Promise<number>} Current market price
   */
  async _fetchPriceFromYahoo(symbol) {
    try {
      // Yahoo Finance URL for the stock
      const url = `https://finance.yahoo.com/quote/${symbol}`;
      
      const response = await axios.get(url, {
        timeout: this.timeout,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1'
        }
      });

      // Parse HTML with cheerio
      const $ = cheerio.load(response.data);
      
      // Try multiple selectors as Yahoo Finance layout can vary
      let price = null;
      
      // Selector 1: fin-streamer with data-symbol attribute
      const finStreamer = $(`fin-streamer[data-symbol="${symbol}"][data-field="regularMarketPrice"]`).attr('data-value');
      if (finStreamer) {
        price = parseFloat(finStreamer);
      }
      
      // Selector 2: Look for price in specific div structure
      if (!price) {
        const priceText = $('fin-streamer[data-field="regularMarketPrice"]').first().text();
        if (priceText) {
          price = parseFloat(priceText.replace(/,/g, ''));
        }
      }
      
      // Selector 3: Fallback to meta tags
      if (!price) {
        const metaPrice = $('meta[name="price"]').attr('content');
        if (metaPrice) {
          price = parseFloat(metaPrice);
        }
      }

      if (!price || isNaN(price)) {
        throw createYahooError(`Unable to parse price for symbol: ${symbol}`, symbol);
      }

      return price;
    } catch (error) {
      if (error.response) {
        // HTTP error
        if (error.response.status === 404) {
          throw createYahooError(`Symbol not found: ${symbol}`, symbol);
        } else if (error.response.status === 429) {
          throw createYahooError(`Rate limit exceeded for symbol: ${symbol}`, symbol);
        } else {
          throw createYahooError(
            `HTTP error ${error.response.status} for symbol: ${symbol}`,
            symbol
          );
        }
      } else if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
        throw createYahooError(`Timeout fetching price for symbol: ${symbol}`, symbol);
      } else if (error.source === 'yahoo') {
        // Already a Yahoo error, rethrow
        throw error;
      } else {
        throw createYahooError(
          `Failed to fetch price for ${symbol}: ${error.message}`,
          symbol
        );
      }
    }
  }

  /**
   * Queue a request to implement rate limiting
   * @private
   * @param {Function} requestFn - Function that returns a promise
   * @returns {Promise} Result of the request
   */
  async _queueRequest(requestFn) {
    return new Promise((resolve, reject) => {
      this.requestQueue.push({ requestFn, resolve, reject });
      this._processQueue();
    });
  }

  /**
   * Process queued requests with rate limiting
   * @private
   */
  async _processQueue() {
    if (this.isProcessingQueue || this.requestQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    while (this.requestQueue.length > 0) {
      const now = Date.now();
      const timeSinceLastRequest = now - this.lastRequestTime;
      
      // Wait if we need to respect rate limit
      if (timeSinceLastRequest < this.minRequestInterval) {
        await this._sleep(this.minRequestInterval - timeSinceLastRequest);
      }

      const { requestFn, resolve, reject } = this.requestQueue.shift();
      this.lastRequestTime = Date.now();

      try {
        const result = await requestFn();
        resolve(result);
      } catch (error) {
        reject(error);
      }
    }

    this.isProcessingQueue = false;
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
      cache: cacheStats,
      queueLength: this.requestQueue.length,
      isProcessingQueue: this.isProcessingQueue
    };
  }
}

export default YahooFinanceService;
