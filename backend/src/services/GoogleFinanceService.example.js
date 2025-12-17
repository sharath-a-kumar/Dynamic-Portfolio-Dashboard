import GoogleFinanceService from './GoogleFinanceService.js';
import CacheService from './CacheService.js';

/**
 * Example usage of GoogleFinanceService
 * 
 * This demonstrates how to:
 * 1. Initialize the service with caching
 * 2. Fetch P/E ratio for a single stock
 * 3. Fetch latest earnings for a single stock
 * 4. Batch fetch financial metrics for multiple stocks
 */

async function main() {
  // Initialize cache service
  const cacheService = new CacheService();
  
  // Initialize Google Finance service with 1-hour cache TTL
  const googleFinanceService = new GoogleFinanceService(cacheService, {
    cacheTTL: 3600, // 1 hour
    maxRetries: 3,
    timeout: 5000
  });

  console.log('=== Google Finance Service Example ===\n');

  // Example 1: Get P/E ratio for a single stock
  try {
    console.log('1. Fetching P/E ratio for RELIANCE.NS...');
    const peRatio = await googleFinanceService.getPERatio('RELIANCE.NS');
    console.log(`   P/E Ratio: ${peRatio !== null ? peRatio : 'Not available'}\n`);
  } catch (error) {
    console.error('   Error:', error.message, '\n');
  }

  // Example 2: Get latest earnings for a single stock
  try {
    console.log('2. Fetching latest earnings for TCS.NS...');
    const earnings = await googleFinanceService.getLatestEarnings('TCS.NS');
    console.log(`   Latest Earnings: ${earnings !== null ? earnings : 'Not available'}\n`);
  } catch (error) {
    console.error('   Error:', error.message, '\n');
  }

  // Example 3: Batch fetch financial metrics for multiple stocks
  try {
    console.log('3. Batch fetching financial metrics for multiple stocks...');
    const symbols = ['RELIANCE.NS', 'TCS.NS', 'INFY.NS', 'HDFCBANK.NS'];
    const financialMap = await googleFinanceService.getBatchFinancials(symbols);
    
    console.log(`   Fetched data for ${financialMap.size} stocks:`);
    financialMap.forEach((data, symbol) => {
      console.log(`   - ${symbol}:`);
      console.log(`     P/E Ratio: ${data.peRatio !== null ? data.peRatio : 'N/A'}`);
      console.log(`     Latest Earnings: ${data.latestEarnings !== null ? data.latestEarnings : 'N/A'}`);
    });
    console.log();
  } catch (error) {
    console.error('   Error:', error.message, '\n');
  }

  // Example 4: Demonstrate caching
  try {
    console.log('4. Demonstrating cache (fetching same data again)...');
    const startTime = Date.now();
    const peRatio = await googleFinanceService.getPERatio('RELIANCE.NS');
    const endTime = Date.now();
    console.log(`   P/E Ratio: ${peRatio !== null ? peRatio : 'Not available'}`);
    console.log(`   Fetch time: ${endTime - startTime}ms (should be fast due to cache)\n`);
  } catch (error) {
    console.error('   Error:', error.message, '\n');
  }

  // Example 5: Get service statistics
  console.log('5. Service statistics:');
  const stats = googleFinanceService.getStats();
  console.log('   Cache stats:', stats.cache);
  console.log('   Queue length:', stats.queueLength);
  console.log('   Processing queue:', stats.isProcessingQueue);
}

// Run the example
main().catch(console.error);
