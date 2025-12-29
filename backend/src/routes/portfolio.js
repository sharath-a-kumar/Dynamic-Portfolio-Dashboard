import express from 'express';
import PortfolioService from '../services/PortfolioService.js';
import YahooFinanceService from '../services/YahooFinanceService.js';
import CacheService from '../services/CacheService.js';

const router = express.Router();

// Initialize services
const cacheService = new CacheService();
const yahooFinanceService = new YahooFinanceService(cacheService, {
  cacheTTL: parseInt(process.env.CACHE_TTL_CMP) || 300, // 5 minutes - stock prices don't change that fast
  maxRetries: 2,
  initialRetryDelay: 1000
});
// Google Finance scraping disabled - unreliable and slow
// P/E and Earnings data comes from Excel file instead
const googleFinanceService = null;
const portfolioService = new PortfolioService();

// Store portfolio data in memory (could be moved to a database later)
let cachedPortfolioData = null;
let lastLoadTime = null;

// Cache for enriched response to reduce API calls
let cachedEnrichedResponse = null;
let lastEnrichTime = null;
const ENRICH_CACHE_TTL = 60000; // 60 seconds - better caching for faster responses

// Background refresh state
let isBackgroundRefreshing = false;

/**
 * Background refresh function - updates cache without blocking response
 */
async function refreshInBackground(excelFilePath) {
  if (isBackgroundRefreshing) return;
  
  isBackgroundRefreshing = true;
  try {
    const now = Date.now();
    
    // Check if Excel needs reloading
    const shouldReload = !cachedPortfolioData || 
                        !lastLoadTime || 
                        (now - lastLoadTime > 5 * 60 * 1000);

    let baseHoldings = cachedPortfolioData;
    let parseErrors = [];

    if (shouldReload) {
      const result = await portfolioService.loadPortfolioFromExcel(excelFilePath);
      baseHoldings = result.holdings;
      parseErrors = (result.errors || []).map(err => ({
        ...err,
        source: 'excel',
        message: err.error || err.message || 'Excel parsing error'
      }));
      cachedPortfolioData = baseHoldings;
      lastLoadTime = now;
    }

    // Enrich with live data (Google Finance disabled - uses Excel P/E and Earnings)
    const { holdings, errors } = await portfolioService.enrichWithLiveData(
      baseHoldings,
      yahooFinanceService,
      null // Google Finance disabled
    );

    // Group by sector
    const sectorMap = portfolioService.groupBySector(holdings);
    const sectors = [];

    for (const [sectorName, sectorHoldings] of sectorMap) {
      const summary = portfolioService.calculateSectorSummary(sectorHoldings, sectorName);
      sectors.push({
        sector: sectorName,
        holdings: sectorHoldings,
        summary
      });
    }

    // Update cache
    const hasValidCMP = holdings.some(h => h.cmp > 0);
    if (hasValidCMP) {
      cachedEnrichedResponse = {
        holdings,
        sectors,
        errors: [...parseErrors, ...errors]
      };
      lastEnrichTime = Date.now();
    }
  } catch (error) {
    console.error('Background refresh failed:', error.message);
  } finally {
    isBackgroundRefreshing = false;
  }
}

/**
 * GET /api/portfolio
 * Fetch complete portfolio data with live prices
 * Uses stale-while-revalidate pattern for fast responses
 */
router.get('/', async (req, res, next) => {
  try {
    const excelFilePath = process.env.EXCEL_FILE_PATH;
    
    if (!excelFilePath) {
      return res.status(500).json({
        error: 'EXCEL_FILE_PATH not configured',
        message: 'Server configuration error: Excel file path not set'
      });
    }

    const now = Date.now();
    
    // Stale-while-revalidate: Return cached data immediately if available
    // Then trigger background refresh if cache is getting stale
    if (cachedEnrichedResponse && lastEnrichTime) {
      const cacheAge = now - lastEnrichTime;
      
      // If cache is fresh (< 60s), return it directly
      if (cacheAge < ENRICH_CACHE_TTL) {
        return res.json({
          ...cachedEnrichedResponse,
          lastUpdated: new Date(lastEnrichTime).toISOString(),
          cached: true,
          cacheAge: Math.round(cacheAge / 1000)
        });
      }
      
      // If cache is stale but exists (< 5 min), return it and refresh in background
      if (cacheAge < 5 * 60 * 1000) {
        // Trigger background refresh (non-blocking)
        refreshInBackground(excelFilePath);
        
        return res.json({
          ...cachedEnrichedResponse,
          lastUpdated: new Date(lastEnrichTime).toISOString(),
          cached: true,
          stale: true,
          cacheAge: Math.round(cacheAge / 1000)
        });
      }
    }

    // No cache or cache too old - do a fresh fetch
    const shouldReload = !cachedPortfolioData || 
                        !lastLoadTime || 
                        (now - lastLoadTime > 5 * 60 * 1000);

    let baseHoldings;
    let parseErrors = [];

    if (shouldReload) {
      const result = await portfolioService.loadPortfolioFromExcel(excelFilePath);
      baseHoldings = result.holdings;
      parseErrors = (result.errors || []).map(err => ({
        ...err,
        source: 'excel',
        message: err.error || err.message || 'Excel parsing error'
      }));
      cachedPortfolioData = baseHoldings;
      lastLoadTime = now;
      
      if (result.invalidRows > 0) {
        console.log(`Excel parsed: ${result.validRows} valid, ${result.invalidRows} invalid rows`);
      }
    } else {
      baseHoldings = cachedPortfolioData;
    }

    // Enrich with live data (Google Finance disabled - uses Excel P/E and Earnings)
    const { holdings, errors } = await portfolioService.enrichWithLiveData(
      baseHoldings,
      yahooFinanceService,
      null // Google Finance disabled for faster loading
    );

    // Group by sector for response
    const sectorMap = portfolioService.groupBySector(holdings);
    const sectors = [];

    for (const [sectorName, sectorHoldings] of sectorMap) {
      const summary = portfolioService.calculateSectorSummary(sectorHoldings, sectorName);
      sectors.push({
        sector: sectorName,
        holdings: sectorHoldings,
        summary
      });
    }

    // Cache the response
    const hasValidCMP = holdings.some(h => h.cmp > 0);
    if (hasValidCMP) {
      cachedEnrichedResponse = {
        holdings,
        sectors,
        errors: [...parseErrors, ...errors]
      };
      lastEnrichTime = now;
    }

    res.json({
      holdings,
      sectors,
      lastUpdated: new Date().toISOString(),
      errors: [...parseErrors, ...errors]
    });

  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/portfolio/refresh
 * Trigger manual refresh of live data (clears cache and reloads)
 */
router.get('/refresh', async (req, res, next) => {
  try {
    const excelFilePath = process.env.EXCEL_FILE_PATH;
    
    if (!excelFilePath) {
      return res.status(500).json({
        error: 'EXCEL_FILE_PATH not configured',
        message: 'Server configuration error: Excel file path not set'
      });
    }

    // Clear caches and reset rate limit
    yahooFinanceService.clearCache();
    yahooFinanceService.lastRateLimitTime = 0; // Reset rate limit on manual refresh
    
    // Clear response cache
    cachedEnrichedResponse = null;
    lastEnrichTime = null;

    // Force reload from Excel
    const result = await portfolioService.loadPortfolioFromExcel(excelFilePath);
    const baseHoldings = result.holdings;
    const parseErrors = (result.errors || []).map(err => ({
      ...err,
      source: 'excel',
      message: err.error || err.message || 'Excel parsing error'
    }));
    
    cachedPortfolioData = baseHoldings;
    lastLoadTime = Date.now();

    // Enrich with live data (Google Finance disabled)
    const { holdings, errors } = await portfolioService.enrichWithLiveData(
      baseHoldings,
      yahooFinanceService,
      null // Google Finance disabled for faster loading
    );

    // Group by sector for response
    const sectorMap = portfolioService.groupBySector(holdings);
    const sectors = [];

    for (const [sectorName, sectorHoldings] of sectorMap) {
      const summary = portfolioService.calculateSectorSummary(sectorHoldings, sectorName);
      sectors.push({
        sector: sectorName,
        holdings: sectorHoldings,
        summary
      });
    }

    // Update cache
    const hasValidCMP = holdings.some(h => h.cmp > 0);
    if (hasValidCMP) {
      cachedEnrichedResponse = {
        holdings,
        sectors,
        errors: [...parseErrors, ...errors]
      };
      lastEnrichTime = Date.now();
    }

    res.json({
      holdings,
      sectors,
      lastUpdated: new Date().toISOString(),
      errors: [...parseErrors, ...errors],
      refreshed: true
    });

  } catch (error) {
    next(error);
  }
});

export default router;
``