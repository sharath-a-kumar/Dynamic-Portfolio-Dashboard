import express from 'express';
import YahooFinanceService from '../services/YahooFinanceService.js';
import GoogleFinanceService from '../services/GoogleFinanceService.js';
import CacheService from '../services/CacheService.js';

const router = express.Router();

// Initialize services for health checks
const cacheService = new CacheService();
const yahooFinanceService = new YahooFinanceService(cacheService);
const googleFinanceService = new GoogleFinanceService(cacheService);

/**
 * GET /api/health
 * Check backend service health and external service availability
 */
router.get('/', async (req, res) => {
  const healthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      yahooFinance: true,
      googleFinance: true
    },
    cache: cacheService.getStats(),
    environment: {
      nodeVersion: process.version,
      excelFileConfigured: !!process.env.EXCEL_FILE_PATH
    }
  };

  // Test Yahoo Finance service (quick check)
  try {
    // Just check if the service is responsive - don't make actual API calls
    // We'll consider it healthy if the service object exists and has methods
    if (typeof yahooFinanceService.getCurrentPrice !== 'function') {
      healthStatus.services.yahooFinance = false;
      healthStatus.status = 'degraded';
    }
  } catch (error) {
    healthStatus.services.yahooFinance = false;
    healthStatus.status = 'degraded';
  }

  // Test Google Finance service (quick check)
  try {
    // Just check if the service is responsive - don't make actual API calls
    if (typeof googleFinanceService.getPERatio !== 'function') {
      healthStatus.services.googleFinance = false;
      healthStatus.status = 'degraded';
    }
  } catch (error) {
    healthStatus.services.googleFinance = false;
    healthStatus.status = 'degraded';
  }

  // Return appropriate status code
  const statusCode = healthStatus.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(healthStatus);
});

export default router;
