import CacheService from './CacheService.js';

/**
 * Example usage of CacheService
 * This demonstrates how to use the cache service in the portfolio application
 */

// Create a cache service instance
const cache = new CacheService();

// Example 1: Caching stock prices (10-second TTL as per requirements)
console.log('=== Example 1: Caching Stock Prices ===');
cache.set('AAPL:price', 150.25, 10); // Cache for 10 seconds
console.log('Cached AAPL price:', cache.get('AAPL:price'));

// Example 2: Caching financial metrics (1-hour TTL as per requirements)
console.log('\n=== Example 2: Caching Financial Metrics ===');
const financialData = {
  peRatio: 28.5,
  latestEarnings: 'Q4 2024'
};
cache.set('AAPL:financials', financialData, 3600); // Cache for 1 hour
console.log('Cached AAPL financials:', cache.get('AAPL:financials'));

// Example 3: Checking cache statistics
console.log('\n=== Example 3: Cache Statistics ===');
cache.get('AAPL:price'); // Hit
cache.get('AAPL:financials'); // Hit
cache.get('GOOGL:price'); // Miss
console.log('Cache stats:', cache.getStats());

// Example 4: Checking if key exists
console.log('\n=== Example 4: Key Existence ===');
console.log('AAPL:price exists:', cache.has('AAPL:price'));
console.log('GOOGL:price exists:', cache.has('GOOGL:price'));

// Example 5: Getting all cached keys
console.log('\n=== Example 5: All Cached Keys ===');
cache.set('MSFT:price', 380.50, 10);
console.log('All keys:', cache.keys());

// Example 6: Deleting a specific key
console.log('\n=== Example 6: Deleting Keys ===');
cache.delete('MSFT:price');
console.log('Keys after delete:', cache.keys());

// Example 7: Batch caching for multiple stocks
console.log('\n=== Example 7: Batch Caching ===');
const stockPrices = {
  'AAPL': 150.25,
  'GOOGL': 140.50,
  'MSFT': 380.50,
  'TSLA': 245.75
};

Object.entries(stockPrices).forEach(([symbol, price]) => {
  cache.set(`${symbol}:price`, price, 10);
});

console.log('Cached prices:', cache.keys().filter(k => k.includes(':price')));
console.log('Final stats:', cache.getStats());

// Example 8: Clearing all cache
console.log('\n=== Example 8: Clearing Cache ===');
cache.clear();
console.log('Keys after clear:', cache.keys());
console.log('Stats after clear:', cache.getStats());
