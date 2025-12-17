/**
 * Example usage of YahooFinanceService
 * 
 * This file demonstrates how to use the Yahoo Finance service
 * to fetch real-time stock prices with caching and error handling.
 */

import YahooFinanceService from './YahooFinanceService.js';
import CacheService from './CacheService.js';

async function main() {
  // Initialize cache service
  const cacheService = new CacheService();
  
  // Initialize Yahoo Finance service with custom options
  const yahooService = new YahooFinanceService(cacheService, {
    cacheTTL: 10,              // Cache for 10 seconds
    maxRetries: 3,             // Retry up to 3 times
    initialRetryDelay: 1000,   // Start with 1 second delay
    timeout: 5000,             // 5 second timeout per request
    minRequestInterval: 100    // 100ms between requests
  });

  console.log('=== Yahoo Finance Service Example ===\n');

  // Example 1: Fetch single stock price
  console.log('Example 1: Fetching single stock price');
  try {
    const symbol = 'RELIANCE.NS'; // Reliance Industries on NSE
    console.log(`Fetching price for ${symbol}...`);
    const price = await yahooService.getCurrentPrice(symbol);
    console.log(`✓ Current price: ₹${price.toFixed(2)}\n`);
  } catch (error) {
    console.error(`✗ Error: ${error.message}\n`);
  }

  // Example 2: Fetch multiple stock prices in batch
  console.log('Example 2: Fetching multiple stock prices');
  try {
    const symbols = [
      'RELIANCE.NS',  // Reliance Industries
      'TCS.NS',       // Tata Consultancy Services
      'INFY.NS',      // Infosys
      'HDFCBANK.NS',  // HDFC Bank
      'ICICIBANK.NS'  // ICICI Bank
    ];
    
    console.log(`Fetching prices for ${symbols.length} stocks...`);
    const priceMap = await yahooService.getBatchPrices(symbols);
    
    console.log(`✓ Successfully fetched ${priceMap.size} prices:`);
    priceMap.forEach((price, symbol) => {
      console.log(`  ${symbol}: ₹${price.toFixed(2)}`);
    });
    console.log();
  } catch (error) {
    console.error(`✗ Error: ${error.message}\n`);
  }

  // Example 3: Demonstrate caching
  console.log('Example 3: Demonstrating cache behavior');
  try {
    const symbol = 'TCS.NS';
    
    console.log(`First fetch for ${symbol} (will hit API)...`);
    const startTime1 = Date.now();
    await yahooService.getCurrentPrice(symbol);
    const duration1 = Date.now() - startTime1;
    console.log(`✓ Completed in ${duration1}ms`);
    
    console.log(`Second fetch for ${symbol} (will use cache)...`);
    const startTime2 = Date.now();
    await yahooService.getCurrentPrice(symbol);
    const duration2 = Date.now() - startTime2;
    console.log(`✓ Completed in ${duration2}ms (much faster!)\n`);
  } catch (error) {
    console.error(`✗ Error: ${error.message}\n`);
  }

  // Example 4: View service statistics
  console.log('Example 4: Service statistics');
  const stats = yahooService.getStats();
  console.log('Cache statistics:');
  console.log(`  Hits: ${stats.cache.hits}`);
  console.log(`  Misses: ${stats.cache.misses}`);
  console.log(`  Hit Rate: ${stats.cache.hitRate}`);
  console.log(`  Cached Keys: ${stats.cache.keys}`);
  console.log(`  Queue Length: ${stats.queueLength}`);
  console.log();

  // Example 5: Error handling
  console.log('Example 5: Error handling');
  try {
    const invalidSymbol = 'INVALID_SYMBOL_XYZ';
    console.log(`Attempting to fetch invalid symbol: ${invalidSymbol}...`);
    await yahooService.getCurrentPrice(invalidSymbol);
  } catch (error) {
    console.log(`✓ Error caught successfully:`);
    console.log(`  Source: ${error.source}`);
    console.log(`  Message: ${error.message}`);
    console.log(`  Symbol: ${error.symbol}`);
    console.log();
  }

  // Example 6: Clear cache
  console.log('Example 6: Clearing cache');
  console.log('Clearing all Yahoo Finance cache entries...');
  yahooService.clearCache();
  const statsAfterClear = yahooService.getStats();
  console.log(`✓ Cache cleared. Remaining keys: ${statsAfterClear.cache.keys}\n`);

  console.log('=== Examples Complete ===');
}

// Run examples if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export default main;
