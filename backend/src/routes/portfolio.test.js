/**
 * Integration tests for portfolio API endpoints
 * These tests verify the API structure and basic functionality
 */

import { describe, test, expect } from '@jest/globals';

describe('Portfolio API Endpoints', () => {
  test('API routes module exports a router', async () => {
    const portfolioRoutes = await import('./portfolio.js');
    expect(portfolioRoutes.default).toBeDefined();
    expect(typeof portfolioRoutes.default).toBe('function');
  });

  test('Health routes module exports a router', async () => {
    const healthRoutes = await import('./health.js');
    expect(healthRoutes.default).toBeDefined();
    expect(typeof healthRoutes.default).toBe('function');
  });
});

describe('Middleware', () => {
  test('Error handler middleware is properly exported', async () => {
    const { errorHandler, notFoundHandler } = await import('../middleware/errorHandler.js');
    expect(errorHandler).toBeDefined();
    expect(typeof errorHandler).toBe('function');
    expect(notFoundHandler).toBeDefined();
    expect(typeof notFoundHandler).toBe('function');
  });

  test('Request logger middleware is properly exported', async () => {
    const { requestLogger } = await import('../middleware/requestLogger.js');
    expect(requestLogger).toBeDefined();
    expect(typeof requestLogger).toBe('function');
  });
});
