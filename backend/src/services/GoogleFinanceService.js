import axios from 'axios';
import * as cheerio from 'cheerio';
import { createGoogleError } from '../models/ApiError.js';

/**
 * GoogleFinanceService - Fetches financial metrics from Google Finance
 * 
 * Features:
 * - Fetch P/E ratio for individual stocks
 * - Fetch latest earnings data
 * - Batch fetch financial metrics for multiple stocks
 * - Retry logic with exponential backoff
 * - Integration with CacheService (1-hour TTL)
 * - Handle missing data and errors gracefully
 */
class GoogleFinanceService {
  /**
   * @param {CacheService} cacheService - Cache service instance
   * @param {Object} options - Configuration options
   */
  constructor(cacheService, options = {}) {
    this.cacheService = cacheService;
    this.cacheTTL = options.cacheTTL || 3600; // 1 hour default
    this.maxRetries = options.maxRetries || 1; // Faster fallback
    this.initialRetryDelay = options.initialRetryDelay || 500; // 0.5 second
    this.timeout = options.timeout || 3000; // 3 seconds
    
    // Rate limiting
    this.requestQueue = [];
    this.isProcessingQueue = false;
    this.minRequestInterval = options.minRequestInterval || 50; // 50ms between starts
    this.lastRequestTime = 0;
    this.maxConcurrent = options.maxConcurrent || 5; // Allow 5 concurrent requests
    this.activeRequests = 0;
  }

  /**
   * Get P/E ratio for a single stock symbol
   * @param {string} symbol - Stock symbol (e.g., 'RELIANCE.NS' for NSE)
   * @returns {Promise<number|null>} P/E ratio or null if not available
   * @throws {Error} If data cannot be fetched
   */
  async getPERatio(symbol) {
    if (!symbol || typeof symbol !== 'string') {
      throw new Error('Invalid symbol: must be a non-empty string');
    }

    // Check cache first
    const cacheKey = `google:pe:${symbol}`;
    const cachedPE = this.cacheService.get(cacheKey);
    
    if (cachedPE !== undefined) {
      return cachedPE;
    }

    // Fetch with retry logic
    const peRatio = await this._fetchPERatioWithRetry(symbol);
    
    // Cache the result (even if null)
    this.cacheService.set(cacheKey, peRatio, this.cacheTTL);
    
    return peRatio;
  }

  /**
   * Get latest earnings for a single stock symbol
   * @param {string} symbol - Stock symbol
   * @returns {Promise<string|null>} Latest earnings or null if not available
   * @throws {Error} If data cannot be fetched
   */
  async getLatestEarnings(symbol) {
    if (!symbol || typeof symbol !== 'string') {
      throw new Error('Invalid symbol: must be a non-empty string');
    }

    // Check cache first
    const cacheKey = `google:earnings:${symbol}`;
    const cachedEarnings = this.cacheService.get(cacheKey);
    
    if (cachedEarnings !== undefined) {
      return cachedEarnings;
    }

    // Fetch with retry logic
    const earnings = await this._fetchLatestEarningsWithRetry(symbol);
    
    // Cache the result (even if null)
    this.cacheService.set(cacheKey, earnings, this.cacheTTL);
    
    return earnings;
  }

  /**
   * Get financial metrics (P/E ratio and earnings) for multiple stock symbols in batch
   * @param {string[]} symbols - Array of stock symbols
   * @returns {Promise<Map<string, {peRatio: number|null, latestEarnings: string|null}>>} Map of symbol to financial data
   */
  async getBatchFinancials(symbols) {
    if (!Array.isArray(symbols) || symbols.length === 0) {
      return new Map();
    }

    // Filter out invalid symbols
    const validSymbols = symbols.filter(s => s && typeof s === 'string');
    
    if (validSymbols.length === 0) {
      return new Map();
    }

    // Fetch financial data in parallel with rate limiting
    const financialPromises = validSymbols.map(symbol => 
      this._queueRequest(() => this._getFinancialData(symbol))
        .then(data => ({ symbol, data, error: null }))
        .catch(error => ({ symbol, data: null, error }))
    );

    const results = await Promise.all(financialPromises);
    
    // Build result map
    const financialMap = new Map();
    results.forEach(({ symbol, data, error }) => {
      if (data !== null) {
        financialMap.set(symbol, data);
      }
    });

    return financialMap;
  }

  /**
   * Get both P/E ratio and earnings for a symbol
   * @private
   * @param {string} symbol - Stock symbol
   * @returns {Promise<{peRatio: number|null, latestEarnings: string|null}>}
   */
  async _getFinancialData(symbol) {
    const [peRatio, latestEarnings] = await Promise.all([
      this.getPERatio(symbol),
      this.getLatestEarnings(symbol)
    ]);

    return { peRatio, latestEarnings };
  }

  /**
   * Fetch P/E ratio with exponential backoff retry logic
   * @private
   * @param {string} symbol - Stock symbol
   * @returns {Promise<number|null>} P/E ratio or null
   */
  async _fetchPERatioWithRetry(symbol) {
    let lastError;
    
    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        const peRatio = await this._fetchPERatioFromGoogle(symbol);
        return peRatio;
      } catch (error) {
        lastError = error;
        
        // Don't retry on certain errors
        if (error.message.includes('Invalid symbol') || 
            error.message.includes('not found')) {
          // Return null for missing data instead of throwing
          return null;
        }
        
        // Calculate exponential backoff delay
        if (attempt < this.maxRetries - 1) {
          const delay = this.initialRetryDelay * Math.pow(2, attempt);
          await this._sleep(delay);
        }
      }
    }
    
    // All retries failed - return null to handle gracefully
    console.warn(`Failed to fetch P/E ratio for ${symbol} after ${this.maxRetries} attempts:`, lastError.message);
    return null;
  }

  /**
   * Fetch latest earnings with exponential backoff retry logic
   * @private
   * @param {string} symbol - Stock symbol
   * @returns {Promise<string|null>} Latest earnings or null
   */
  async _fetchLatestEarningsWithRetry(symbol) {
    let lastError;
    
    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        const earnings = await this._fetchLatestEarningsFromGoogle(symbol);
        return earnings;
      } catch (error) {
        lastError = error;
        
        // Don't retry on certain errors
        if (error.message.includes('Invalid symbol') || 
            error.message.includes('not found')) {
          // Return null for missing data instead of throwing
          return null;
        }
        
        // Calculate exponential backoff delay
        if (attempt < this.maxRetries - 1) {
          const delay = this.initialRetryDelay * Math.pow(2, attempt);
          await this._sleep(delay);
        }
      }
    }
    
    // All retries failed - return null to handle gracefully
    console.warn(`Failed to fetch earnings for ${symbol} after ${this.maxRetries} attempts:`, lastError.message);
    return null;
  }

  /**
   * Fetch P/E ratio from Google Finance using web scraping
   * @private
   * @param {string} symbol - Stock symbol
   * @returns {Promise<number|null>} P/E ratio or null if not available
   */
  async _fetchPERatioFromGoogle(symbol) {
    try {
      // Convert symbol format for Google Finance (e.g., RELIANCE.NS -> NSE:RELIANCE)
      const googleSymbol = this._convertToGoogleSymbol(symbol);
      
      // Google Finance URL for the stock
      const url = `https://www.google.com/finance/quote/${googleSymbol}`;
      
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
      
      // Try to find P/E ratio in the page
      let peRatio = null;
      
      // Look for P/E ratio in various possible locations
      // Google Finance typically shows P/E ratio in a data section
      $('div[class*="gyFHrc"]').each((i, elem) => {
        const text = $(elem).text();
        if (text.includes('P/E ratio') || text.includes('PE ratio')) {
          // Try to find the value in the next sibling or nearby element
          const value = $(elem).next().text() || $(elem).parent().find('div[class*="P6K39c"]').text();
          const parsed = parseFloat(value.replace(/,/g, ''));
          if (!isNaN(parsed)) {
            peRatio = parsed;
          }
        }
      });

      // Alternative selector approach
      if (peRatio === null) {
        $('div').each((i, elem) => {
          const text = $(elem).text();
          if (text === 'P/E ratio' || text === 'PE ratio') {
            const parent = $(elem).parent();
            const valueDiv = parent.find('div').last();
            const value = valueDiv.text();
            const parsed = parseFloat(value.replace(/,/g, ''));
            if (!isNaN(parsed)) {
              peRatio = parsed;
            }
          }
        });
      }

      // Return null if not found (not an error, just missing data)
      return peRatio;
    } catch (error) {
      if (error.response) {
        // HTTP error
        if (error.response.status === 404) {
          throw createGoogleError(`Symbol not found: ${symbol}`, symbol);
        } else if (error.response.status === 429) {
          throw createGoogleError(`Rate limit exceeded for symbol: ${symbol}`, symbol);
        } else {
          throw createGoogleError(
            `HTTP error ${error.response.status} for symbol: ${symbol}`,
            symbol
          );
        }
      } else if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
        throw createGoogleError(`Timeout fetching P/E ratio for symbol: ${symbol}`, symbol);
      } else if (error.source === 'google') {
        // Already a Google error, rethrow
        throw error;
      } else {
        throw createGoogleError(
          `Failed to fetch P/E ratio for ${symbol}: ${error.message}`,
          symbol
        );
      }
    }
  }

  /**
   * Fetch latest earnings from Google Finance using web scraping
   * @private
   * @param {string} symbol - Stock symbol
   * @returns {Promise<string|null>} Latest earnings or null if not available
   */
  async _fetchLatestEarningsFromGoogle(symbol) {
    try {
      // Convert symbol format for Google Finance
      const googleSymbol = this._convertToGoogleSymbol(symbol);
      
      // Google Finance URL for the stock
      const url = `https://www.google.com/finance/quote/${googleSymbol}`;
      
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
      
      // Try to find latest earnings in the page
      let earnings = null;
      
      // Look for earnings data in various possible locations
      $('div[class*="gyFHrc"]').each((i, elem) => {
        const text = $(elem).text();
        if (text.includes('Earnings') || text.includes('EPS')) {
          // Try to find the value in the next sibling or nearby element
          const value = $(elem).next().text() || $(elem).parent().find('div[class*="P6K39c"]').text();
          if (value && value.trim()) {
            earnings = value.trim();
          }
        }
      });

      // Alternative approach: look for earnings date or latest earnings announcement
      if (earnings === null) {
        $('div').each((i, elem) => {
          const text = $(elem).text();
          if (text.includes('Latest earnings') || text.includes('Earnings date')) {
            const parent = $(elem).parent();
            const valueDiv = parent.find('div').last();
            const value = valueDiv.text();
            if (value && value.trim()) {
              earnings = value.trim();
            }
          }
        });
      }

      // Return null if not found (not an error, just missing data)
      return earnings;
    } catch (error) {
      if (error.response) {
        // HTTP error
        if (error.response.status === 404) {
          throw createGoogleError(`Symbol not found: ${symbol}`, symbol);
        } else if (error.response.status === 429) {
          throw createGoogleError(`Rate limit exceeded for symbol: ${symbol}`, symbol);
        } else {
          throw createGoogleError(
            `HTTP error ${error.response.status} for symbol: ${symbol}`,
            symbol
          );
        }
      } else if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
        throw createGoogleError(`Timeout fetching earnings for symbol: ${symbol}`, symbol);
      } else if (error.source === 'google') {
        // Already a Google error, rethrow
        throw error;
      } else {
        throw createGoogleError(
          `Failed to fetch earnings for ${symbol}: ${error.message}`,
          symbol
        );
      }
    }
  }

  /**
   * Convert Yahoo Finance symbol format to Google Finance format
   * @private
   * @param {string} symbol - Yahoo Finance symbol (e.g., 'RELIANCE.NS', 'TCS.BO')
   * @returns {string} Google Finance symbol (e.g., 'NSE:RELIANCE', 'BOM:TCS')
   */
  _convertToGoogleSymbol(symbol) {
    // Handle NSE symbols (e.g., RELIANCE.NS -> NSE:RELIANCE)
    if (symbol.endsWith('.NS')) {
      return `NSE:${symbol.replace('.NS', '')}`;
    }
    
    // Handle BSE symbols (e.g., TCS.BO -> BOM:TCS)
    if (symbol.endsWith('.BO')) {
      return `BOM:${symbol.replace('.BO', '')}`;
    }
    
    // For other symbols, return as-is
    return symbol;
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
    if (this.requestQueue.length === 0) {
      return;
    }

    if (this.activeRequests >= this.maxConcurrent) {
      return;
    }

    while (this.requestQueue.length > 0 && this.activeRequests < this.maxConcurrent) {
      const now = Date.now();
      const timeSinceLastRequest = now - this.lastRequestTime;
      
      // Wait if we need to respect rate limit
      if (timeSinceLastRequest < this.minRequestInterval) {
        await this._sleep(this.minRequestInterval - timeSinceLastRequest);
      }

      const { requestFn, resolve, reject } = this.requestQueue.shift();
      this.lastRequestTime = Date.now();
      this.activeRequests++;

      // Execute request without awaiting here to allow parallel processing
      requestFn()
        .then(resolve)
        .catch(reject)
        .finally(() => {
          this.activeRequests--;
          this._processQueue(); // Check for more work
        });
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
   * Clear all cached financial data
   */
  clearCache() {
    const keys = this.cacheService.keys();
    keys.forEach(key => {
      if (key.startsWith('google:pe:') || key.startsWith('google:earnings:')) {
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

export default GoogleFinanceService;
