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
});
