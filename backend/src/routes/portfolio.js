import express from 'express';
import PortfolioService from '../services/PortfolioService.js';
import YahooFinanceService from '../services/YahooFinanceService.js';
import GoogleFinanceService from '../services/GoogleFinanceService.js';
import CacheService from '../services/CacheService.js';

const router = express.Router();

// Initialize services
const cacheService = new CacheService();
const yahooFinanceService = new YahooFinanceService(cacheService, {
  cacheTTL: parseInt(process.env.CACHE_TTL_CMP) || 10
});
const googleFinanceService = new GoogleFinanceService(cacheService, {
  cacheTTL: parseInt(process.env.CACHE_TTL_FINANCIALS) || 3600
});
const portfolioService = new PortfolioService();

// Store portfolio data in memory (could be moved to a database later)
let cachedPortfolioData = null;
let lastLoadTime = null;

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

    // Load portfolio from Excel if not cached or if it's been more than 5 minutes
    const shouldReload = !cachedPortfolioData || 
                        !lastLoadTime || 
                        (Date.now() - lastLoadTime > 5 * 60 * 1000);

    let baseHoldings;
    let parseErrors = [];

    if (shouldReload) {
      const result = await portfolioService.loadPortfolioFromExcel(excelFilePath);
      baseHoldings = result.holdings;
      parseErrors = result.errors || [];
      cachedPortfolioData = baseHoldings;
      lastLoadTime = Date.now();
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

    // Clear caches
    yahooFinanceService.clearCache();
    googleFinanceService.clearCache();

    // Force reload from Excel
    const result = await portfolioService.loadPortfolioFromExcel(excelFilePath);
    const baseHoldings = result.holdings;
    const parseErrors = result.errors || [];
    
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
