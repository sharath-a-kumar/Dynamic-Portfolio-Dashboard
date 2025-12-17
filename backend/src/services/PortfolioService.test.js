/**
 * Tests for PortfolioService
 */

import PortfolioService from './PortfolioService.js';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('PortfolioService', () => {
  let service;

  beforeEach(() => {
    service = new PortfolioService();
  });

  describe('loadPortfolioFromExcel', () => {
    test('should load and parse Excel file successfully', async () => {
      const excelPath = resolve(__dirname, '../../../E555815F_58D029050B.xlsx');
      
      const result = await service.loadPortfolioFromExcel(excelPath);
      
      expect(result).toBeDefined();
      expect(result.holdings).toBeDefined();
      expect(Array.isArray(result.holdings)).toBe(true);
      expect(result.totalRows).toBeGreaterThan(0);
    });

    test('should extract all required fields from Excel', async () => {
      const excelPath = resolve(__dirname, '../../../E555815F_58D029050B.xlsx');
      
      const result = await service.loadPortfolioFromExcel(excelPath);
      
      if (result.holdings.length > 0) {
        const holding = result.holdings[0];
        
        // Check all required fields are present
        expect(holding.particulars).toBeDefined();
        expect(typeof holding.particulars).toBe('string');
        
        expect(holding.purchasePrice).toBeDefined();
        expect(typeof holding.purchasePrice).toBe('number');
        
        expect(holding.quantity).toBeDefined();
        expect(typeof holding.quantity).toBe('number');
        
        expect(holding.nseCode).toBeDefined();
        expect(typeof holding.nseCode).toBe('string');
        
        expect(holding.sector).toBeDefined();
        expect(typeof holding.sector).toBe('string');
        
        // Check calculated fields
        expect(holding.investment).toBe(holding.purchasePrice * holding.quantity);
      }
    });

    test('should throw error for non-existent file', async () => {
      await expect(
        service.loadPortfolioFromExcel('/path/to/nonexistent/file.xlsx')
      ).rejects.toThrow('Excel file not found');
    });

    test('should handle invalid Excel file gracefully', async () => {
      const invalidPath = resolve(__dirname, '../index.js'); // Not an Excel file
      
      await expect(
        service.loadPortfolioFromExcel(invalidPath)
      ).rejects.toThrow();
    });
  });

  describe('calculateMetrics', () => {
    test('should calculate Investment correctly (Purchase Price × Quantity)', () => {
      const holding = {
        purchasePrice: 100,
        quantity: 10
      };

      const result = service.calculateMetrics(holding, 120);

      expect(result.investment).toBe(1000); // 100 × 10
    });

    test('should calculate Present Value correctly (CMP × Quantity)', () => {
      const holding = {
        purchasePrice: 100,
        quantity: 10
      };

      const result = service.calculateMetrics(holding, 120);

      expect(result.presentValue).toBe(1200); // 120 × 10
    });

    test('should calculate Gain/Loss correctly (Present Value - Investment)', () => {
      const holding = {
        purchasePrice: 100,
        quantity: 10
      };

      const result = service.calculateMetrics(holding, 120);

      expect(result.gainLoss).toBe(200); // 1200 - 1000
    });

    test('should calculate Gain/Loss percentage correctly', () => {
      const holding = {
        purchasePrice: 100,
        quantity: 10
      };

      const result = service.calculateMetrics(holding, 120);

      expect(result.gainLossPercentage).toBe(20); // (200 / 1000) × 100
    });

    test('should handle negative Gain/Loss', () => {
      const holding = {
        purchasePrice: 100,
        quantity: 10
      };

      const result = service.calculateMetrics(holding, 80);

      expect(result.investment).toBe(1000);
      expect(result.presentValue).toBe(800);
      expect(result.gainLoss).toBe(-200);
      expect(result.gainLossPercentage).toBe(-20);
    });

    test('should handle zero investment', () => {
      const holding = {
        purchasePrice: 0,
        quantity: 10
      };

      const result = service.calculateMetrics(holding, 100);

      expect(result.investment).toBe(0);
      expect(result.presentValue).toBe(1000);
      expect(result.gainLoss).toBe(1000);
      expect(result.gainLossPercentage).toBe(0); // Avoid division by zero
    });

    test('should update CMP in the holding', () => {
      const holding = {
        purchasePrice: 100,
        quantity: 10,
        cmp: 0
      };

      const result = service.calculateMetrics(holding, 120);

      expect(result.cmp).toBe(120);
    });

    test('should update lastUpdated timestamp', () => {
      const holding = {
        purchasePrice: 100,
        quantity: 10
      };

      const result = service.calculateMetrics(holding, 120);

      expect(result.lastUpdated).toBeInstanceOf(Date);
    });

    test('should preserve other holding properties', () => {
      const holding = {
        id: 'test-123',
        particulars: 'Test Stock',
        purchasePrice: 100,
        quantity: 10,
        nseCode: 'TEST',
        sector: 'Technology'
      };

      const result = service.calculateMetrics(holding, 120);

      expect(result.id).toBe('test-123');
      expect(result.particulars).toBe('Test Stock');
      expect(result.nseCode).toBe('TEST');
      expect(result.sector).toBe('Technology');
    });
  });

  describe('calculatePortfolioPercentages', () => {
    test('should calculate correct portfolio percentages', () => {
      const holdings = [
        { investment: 100, portfolioPercentage: 0 },
        { investment: 200, portfolioPercentage: 0 },
        { investment: 300, portfolioPercentage: 0 }
      ];

      const result = service.calculatePortfolioPercentages(holdings);

      expect(result[0].portfolioPercentage).toBeCloseTo(16.67, 1);
      expect(result[1].portfolioPercentage).toBeCloseTo(33.33, 1);
      expect(result[2].portfolioPercentage).toBeCloseTo(50.00, 1);
    });

    test('should handle zero total investment', () => {
      const holdings = [
        { investment: 0, portfolioPercentage: 0 },
        { investment: 0, portfolioPercentage: 0 }
      ];

      const result = service.calculatePortfolioPercentages(holdings);

      expect(result[0].portfolioPercentage).toBe(0);
      expect(result[1].portfolioPercentage).toBe(0);
    });
  });

  describe('groupBySector', () => {
    test('should group holdings by sector', () => {
      const holdings = [
        { sector: 'Technology', particulars: 'Stock A' },
        { sector: 'Finance', particulars: 'Stock B' },
        { sector: 'Technology', particulars: 'Stock C' }
      ];

      const result = service.groupBySector(holdings);

      expect(result.size).toBe(2);
      expect(result.get('Technology').length).toBe(2);
      expect(result.get('Finance').length).toBe(1);
    });

    test('should handle uncategorized holdings', () => {
      const holdings = [
        { sector: '', particulars: 'Stock A' },
        { particulars: 'Stock B' }
      ];

      const result = service.groupBySector(holdings);

      expect(result.has('Uncategorized')).toBe(true);
      expect(result.get('Uncategorized').length).toBe(2);
    });
  });

  describe('calculateSectorSummary', () => {
    test('should calculate correct sector summary', () => {
      const holdings = [
        { investment: 100, presentValue: 120 },
        { investment: 200, presentValue: 180 }
      ];

      const result = service.calculateSectorSummary(holdings, 'Technology');

      expect(result.sector).toBe('Technology');
      expect(result.totalInvestment).toBe(300);
      expect(result.totalPresentValue).toBe(300);
      expect(result.totalGainLoss).toBe(0);
      expect(result.gainLossPercentage).toBe(0);
      expect(result.holdingsCount).toBe(2);
    });
  });

  describe('enrichWithLiveData', () => {
    let mockYahooService;
    let mockGoogleService;

    beforeEach(() => {
      // Create mock services with simple mock functions
      mockYahooService = {
        getBatchPrices: async () => new Map()
      };

      mockGoogleService = {
        getBatchFinancials: async () => new Map()
      };
    });

    test('should enrich holdings with CMP and financial data', async () => {
      const holdings = [
        {
          id: '1',
          particulars: 'Reliance Industries',
          purchasePrice: 2000,
          quantity: 10,
          nseCode: 'RELIANCE',
          sector: 'Energy'
        },
        {
          id: '2',
          particulars: 'TCS',
          purchasePrice: 3000,
          quantity: 5,
          nseCode: 'TCS',
          sector: 'Technology'
        }
      ];

      // Mock Yahoo Finance responses
      mockYahooService.getBatchPrices = async () => new Map([
        ['RELIANCE.NS', 2500],
        ['TCS.NS', 3500]
      ]);

      // Mock Google Finance responses
      mockGoogleService.getBatchFinancials = async () => new Map([
        ['RELIANCE.NS', { peRatio: 25.5, latestEarnings: 'Q4 2024' }],
        ['TCS.NS', { peRatio: 30.2, latestEarnings: 'Q3 2024' }]
      ]);

      const result = await service.enrichWithLiveData(
        holdings,
        mockYahooService,
        mockGoogleService
      );

      expect(result.holdings).toHaveLength(2);
      expect(result.errors).toHaveLength(0);

      // Check first holding
      const reliance = result.holdings[0];
      expect(reliance.cmp).toBe(2500);
      expect(reliance.investment).toBe(20000); // 2000 × 10
      expect(reliance.presentValue).toBe(25000); // 2500 × 10
      expect(reliance.gainLoss).toBe(5000); // 25000 - 20000
      expect(reliance.peRatio).toBe(25.5);
      expect(reliance.latestEarnings).toBe('Q4 2024');

      // Check second holding
      const tcs = result.holdings[1];
      expect(tcs.cmp).toBe(3500);
      expect(tcs.investment).toBe(15000); // 3000 × 5
      expect(tcs.presentValue).toBe(17500); // 3500 × 5
      expect(tcs.gainLoss).toBe(2500); // 17500 - 15000
      expect(tcs.peRatio).toBe(30.2);
      expect(tcs.latestEarnings).toBe('Q3 2024');
    });

    test('should calculate portfolio percentages correctly', async () => {
      const holdings = [
        {
          id: '1',
          particulars: 'Stock A',
          purchasePrice: 100,
          quantity: 10,
          nseCode: 'STOCKA',
          sector: 'Technology'
        },
        {
          id: '2',
          particulars: 'Stock B',
          purchasePrice: 200,
          quantity: 10,
          nseCode: 'STOCKB',
          sector: 'Finance'
        }
      ];

      mockYahooService.getBatchPrices = async () => new Map([
        ['STOCKA.NS', 150],
        ['STOCKB.NS', 250]
      ]);

      mockGoogleService.getBatchFinancials = async () => new Map();

      const result = await service.enrichWithLiveData(
        holdings,
        mockYahooService,
        mockGoogleService
      );

      // Total investment: 1000 + 2000 = 3000
      // Stock A: 1000/3000 = 33.33%
      // Stock B: 2000/3000 = 66.67%
      expect(result.holdings[0].portfolioPercentage).toBeCloseTo(33.33, 1);
      expect(result.holdings[1].portfolioPercentage).toBeCloseTo(66.67, 1);
    });

    test('should handle partial failures gracefully', async () => {
      const holdings = [
        {
          id: '1',
          particulars: 'Stock A',
          purchasePrice: 100,
          quantity: 10,
          nseCode: 'STOCKA',
          sector: 'Technology'
        },
        {
          id: '2',
          particulars: 'Stock B',
          purchasePrice: 200,
          quantity: 10,
          nseCode: 'STOCKB',
          sector: 'Finance'
        }
      ];

      // Only one stock has CMP data
      mockYahooService.getBatchPrices = async () => new Map([
        ['STOCKA.NS', 150]
        // STOCKB.NS is missing
      ]);

      mockGoogleService.getBatchFinancials = async () => new Map();

      const result = await service.enrichWithLiveData(
        holdings,
        mockYahooService,
        mockGoogleService
      );

      expect(result.holdings).toHaveLength(2);
      expect(result.errors.length).toBeGreaterThan(0);

      // First holding should have CMP data
      expect(result.holdings[0].cmp).toBe(150);
      expect(result.holdings[0].presentValue).toBe(1500);

      // Second holding should not have updated CMP
      expect(result.holdings[1].cmp).toBeUndefined();
    });

    test('should handle Yahoo Finance service failure', async () => {
      const holdings = [
        {
          id: '1',
          particulars: 'Stock A',
          purchasePrice: 100,
          quantity: 10,
          nseCode: 'STOCKA',
          sector: 'Technology'
        }
      ];

      // Yahoo Finance fails
      mockYahooService.getBatchPrices = async () => {
        throw new Error('Yahoo Finance API error');
      };

      mockGoogleService.getBatchFinancials = async () => new Map([
        ['STOCKA.NS', { peRatio: 25.0, latestEarnings: 'Q4 2024' }]
      ]);

      const result = await service.enrichWithLiveData(
        holdings,
        mockYahooService,
        mockGoogleService
      );

      expect(result.holdings).toHaveLength(1);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(e => e.source === 'yahoo')).toBe(true);

      // Should still have financial data from Google
      expect(result.holdings[0].peRatio).toBe(25.0);
      expect(result.holdings[0].latestEarnings).toBe('Q4 2024');
    });

    test('should handle Google Finance service failure', async () => {
      const holdings = [
        {
          id: '1',
          particulars: 'Stock A',
          purchasePrice: 100,
          quantity: 10,
          nseCode: 'STOCKA',
          sector: 'Technology'
        }
      ];

      mockYahooService.getBatchPrices = async () => new Map([
        ['STOCKA.NS', 150]
      ]);

      // Google Finance fails
      mockGoogleService.getBatchFinancials = async () => {
        throw new Error('Google Finance API error');
      };

      const result = await service.enrichWithLiveData(
        holdings,
        mockYahooService,
        mockGoogleService
      );

      expect(result.holdings).toHaveLength(1);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(e => e.source === 'google')).toBe(true);

      // Should still have CMP data from Yahoo
      expect(result.holdings[0].cmp).toBe(150);
      expect(result.holdings[0].presentValue).toBe(1500);
    });

    test('should handle both services failing', async () => {
      const holdings = [
        {
          id: '1',
          particulars: 'Stock A',
          purchasePrice: 100,
          quantity: 10,
          nseCode: 'STOCKA',
          sector: 'Technology'
        }
      ];

      mockYahooService.getBatchPrices = async () => {
        throw new Error('Yahoo Finance API error');
      };

      mockGoogleService.getBatchFinancials = async () => {
        throw new Error('Google Finance API error');
      };

      const result = await service.enrichWithLiveData(
        holdings,
        mockYahooService,
        mockGoogleService
      );

      expect(result.holdings).toHaveLength(1);
      expect(result.errors.length).toBeGreaterThanOrEqual(2);
      expect(result.errors.some(e => e.source === 'yahoo')).toBe(true);
      expect(result.errors.some(e => e.source === 'google')).toBe(true);
    });

    test('should handle empty holdings array', async () => {
      const result = await service.enrichWithLiveData(
        [],
        mockYahooService,
        mockGoogleService
      );

      expect(result.holdings).toHaveLength(0);
      expect(result.errors).toHaveLength(0);
    });

    test('should fetch data in parallel', async () => {
      const holdings = [
        {
          id: '1',
          particulars: 'Stock A',
          purchasePrice: 100,
          quantity: 10,
          nseCode: 'STOCKA',
          sector: 'Technology'
        }
      ];

      let yahooCallTime;
      let googleCallTime;

      mockYahooService.getBatchPrices = async () => {
        yahooCallTime = Date.now();
        await new Promise(resolve => setTimeout(resolve, 50));
        return new Map([['STOCKA.NS', 150]]);
      };

      mockGoogleService.getBatchFinancials = async () => {
        googleCallTime = Date.now();
        await new Promise(resolve => setTimeout(resolve, 50));
        return new Map([['STOCKA.NS', { peRatio: 25.0, latestEarnings: 'Q4 2024' }]]);
      };

      await service.enrichWithLiveData(
        holdings,
        mockYahooService,
        mockGoogleService
      );

      // Both services should be called at approximately the same time (parallel)
      expect(Math.abs(yahooCallTime - googleCallTime)).toBeLessThan(10);
    });

    test('should handle missing financial data gracefully', async () => {
      const holdings = [
        {
          id: '1',
          particulars: 'Stock A',
          purchasePrice: 100,
          quantity: 10,
          nseCode: 'STOCKA',
          sector: 'Technology'
        }
      ];

      mockYahooService.getBatchPrices = async () => new Map([
        ['STOCKA.NS', 150]
      ]);

      // Google Finance returns data with null values
      mockGoogleService.getBatchFinancials = async () => new Map([
        ['STOCKA.NS', { peRatio: null, latestEarnings: null }]
      ]);

      const result = await service.enrichWithLiveData(
        holdings,
        mockYahooService,
        mockGoogleService
      );

      expect(result.holdings[0].peRatio).toBeNull();
      expect(result.holdings[0].latestEarnings).toBeNull();
      expect(result.holdings[0].cmp).toBe(150);
    });
  });
});
