import express from 'express';
import PortfolioService from '../services/PortfolioService.js';
import YahooFinanceService from '../services/YahooFinanceService.js';
import GoogleFinanceService from '../services/GoogleFinanceService.js';
import CacheService from '../services/CacheService.js';

const router = express.Router();

// Initialize services
const cacheService = new CacheService();
const yahooFinanceService = new YahooFinanceService(cacheService, {
  cacheTTL: parseInt(process.env.CACHE_TTL_CMP) || 120, // 120 seconds default - reduced API calls
  maxRetries: 2,
  initialRetryDelay: 1000
});
const googleFinanceService = new GoogleFinanceService(cacheService, {
  cacheTTL: parseInt(process.env.CACHE_TTL_FINANCIALS) || 3600
});
const portfolioService = new PortfolioService();

// Store portfolio data in memory (could be moved to a database later)
let cachedPortfolioData = null;
let lastLoadTime = null;

// Cache for enriched response to reduce API calls
let cachedEnrichedResponse = null;
let lastEnrichTime = null;
const ENRICH_CACHE_TTL = 30000; // 30 seconds - balance between freshness and API limits

/**
 * GET /api/portfolio
 * Fetch complete portfolio data with live prices
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

    // Check if we have a recent cached response (within 15 seconds)
    const now = Date.now();
    if (cachedEnrichedResponse && lastEnrichTime && (now - lastEnrichTime < ENRICH_CACHE_TTL)) {
      // Return cached response with updated timestamp
      return res.json({
        ...cachedEnrichedResponse,
        lastUpdated: new Date().toISOString(),
        cached: true
      });
    }

    // Load portfolio from Excel if not cached or if it's been more than 5 minutes
    const shouldReload = !cachedPortfolioData || 
                        !lastLoadTime || 
                        (now - lastLoadTime > 5 * 60 * 1000);

    let baseHoldings;
    let parseErrors = [];

    if (shouldReload) {
      const result = await portfolioService.loadPortfolioFromExcel(excelFilePath);
      baseHoldings = result.holdings;
      // Add source to parse errors so frontend can categorize them properly
      parseErrors = (result.errors || []).map(err => ({
        ...err,
        source: 'excel',
        message: err.error || err.message || 'Excel parsing error'
      }));
      cachedPortfolioData = baseHoldings;
      lastLoadTime = now;
      
      // Log parse summary
      if (result.invalidRows > 0) {
        console.log(`Excel parsed: ${result.validRows} valid, ${result.invalidRows} invalid rows`);
      }
    } else {
      baseHoldings = cachedPortfolioData;
    }

    // Enrich with live data
    const { holdings, errors } = await portfolioService.enrichWithLiveData(
      baseHoldings,
      yahooFinanceService,
      googleFinanceService
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

    // Only cache if we have valid CMP data (at least one holding with CMP > 0)
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
    googleFinanceService.clearCache();
    
    // Clear response cache
    cachedEnrichedResponse = null;
    lastEnrichTime = null;

    // Force reload from Excel
    const result = await portfolioService.loadPortfolioFromExcel(excelFilePath);
    const baseHoldings = result.holdings;
    // Add source to parse errors
    const parseErrors = (result.errors || []).map(err => ({
      ...err,
      source: 'excel',
      message: err.error || err.message || 'Excel parsing error'
    }));
    
    cachedPortfolioData = baseHoldings;
    lastLoadTime = Date.now();

    // Enrich with live data
    const { holdings, errors } = await portfolioService.enrichWithLiveData(
      baseHoldings,
      yahooFinanceService,
      googleFinanceService
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