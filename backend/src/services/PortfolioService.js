/**
 * PortfolioService - Handles portfolio data loading, parsing, and enrichment
 */

import xlsx from 'xlsx';
import { createHolding } from '../models/Holding.js';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { getNseFromBse } from '../utils/bseToNseMapping.js';

class PortfolioService {
  /**
   * Loads portfolio data from an Excel file
   * @param {string} filePath - Path to the Excel file
   * @returns {Promise<Object>} Object containing holdings array and any errors
   * @throws {Error} If file cannot be read or parsed
   */
  async loadPortfolioFromExcel(filePath) {
    try {
      // Resolve the file path
      const resolvedPath = resolve(filePath);
      
      // Read the Excel file
      const fileBuffer = readFileSync(resolvedPath);
      
      // Parse the workbook
      const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
      
      // Get the first sheet
      if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
        throw new Error('Excel file contains no sheets');
      }
      
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      // Convert sheet to JSON (raw format)
      const rawRows = xlsx.utils.sheet_to_json(worksheet);
      
      if (!rawRows || rawRows.length === 0) {
        throw new Error('Excel file contains no data rows');
      }
      
      // Parse the Excel structure
      // Row 0: Headers (in __EMPTY_X format with values as header names)
      // Row 1+: Either sector headers or stock data
      const headerRow = rawRows[0];
      
      // Build column mapping from __EMPTY_X to actual column names
      const columnMap = {};
      Object.keys(headerRow).forEach(key => {
        const value = headerRow[key];
        if (value && typeof value === 'string') {
          columnMap[key] = value.trim();
        }
      });
      
      const errors = [];
      const holdings = [];
      let currentSector = 'Uncategorized';
      
      // Process rows starting from index 1 (skip header row)
      for (let i = 1; i < rawRows.length; i++) {
        const row = rawRows[i];
        
        // Check if this is a sector header row
        // Sector rows typically have only the name in __EMPTY_1 and summary data
        const particularsValue = row['__EMPTY_1'];
        const hasStockNumber = row['__EMPTY'] !== undefined && typeof row['__EMPTY'] === 'number';
        const stockCode = row['__EMPTY_6'];
        const hasStockCode = stockCode !== undefined && stockCode !== null && stockCode !== '';
        
        if (particularsValue && typeof particularsValue === 'string') {
          // Check if this looks like a sector header (no stock number, no stock code)
          if (!hasStockNumber && !hasStockCode && particularsValue.includes('Sector')) {
            currentSector = particularsValue.replace(/\s*Sector\s*/i, '').trim();
            continue; // Skip to next row
          }
          
          // This is a stock row - parse it
          try {
            const purchasePrice = row['__EMPTY_2'];
            const quantity = row['__EMPTY_3'];
            
            // Validate required fields
            if (!particularsValue || purchasePrice === undefined || quantity === undefined || !hasStockCode) {
              errors.push({
                row: i + 1,
                error: 'Missing required fields (Particulars, Purchase Price, Qty, or NSE/BSE)'
              });
              continue;
            }
            
            // Parse NSE/BSE codes (can be string NSE code or numeric BSE code)
            const [nse, bse] = this._parseNseBseCodes(stockCode);
            
            // Extract P/E ratio and Latest Earnings from Excel if available
            const peRatioValue = row['__EMPTY_12'];
            const latestEarningsValue = row['__EMPTY_13'];
            
            // Parse P/E ratio (can be number or string)
            let peRatio = null;
            if (peRatioValue !== undefined && peRatioValue !== null && peRatioValue !== '') {
              const parsed = Number(peRatioValue);
              if (!isNaN(parsed) && parsed !== 0) {
                peRatio = parsed;
              }
            }
            
            // Parse Latest Earnings (can be number or string)
            let latestEarnings = null;
            if (latestEarningsValue !== undefined && latestEarningsValue !== null && latestEarningsValue !== '') {
              // Convert to string and trim
              latestEarnings = String(latestEarningsValue).trim();
            }
            
            // Create holding
            const holding = createHolding({
              particulars: particularsValue.trim(),
              purchasePrice: Number(purchasePrice) || 0,
              quantity: Number(quantity) || 0,
              nseCode: nse,
              bseCode: bse,
              sector: currentSector,
              cmp: 0, // Will be fetched from Yahoo Finance
              peRatio: peRatio, // Read from Excel
              latestEarnings: latestEarnings // Read from Excel
            });
            
            holdings.push(holding);
            
          } catch (error) {
            errors.push({
              row: i + 1,
              error: `Failed to create holding: ${error.message}`
            });
          }
        }
      }
      
      return {
        holdings,
        errors,
        totalRows: rawRows.length - 1, // Exclude header row
        validRows: holdings.length,
        invalidRows: errors.length
      };
      
    } catch (error) {
      // Handle file reading and parsing errors
      if (error.code === 'ENOENT') {
        throw new Error(`Excel file not found: ${filePath}`);
      } else if (error.message.includes('Excel file')) {
        throw error;
      } else {
        throw new Error(`Failed to parse Excel file: ${error.message}`);
      }
    }
  }
  
  /**
   * Parses NSE/BSE codes from a string or number
   * @param {string|number} stockCode - The NSE/BSE code (can be string NSE code or numeric BSE code)
   * @returns {Array} [nseCode, bseCode]
   * @private
   */
  _parseNseBseCodes(stockCode) {
    if (stockCode === undefined || stockCode === null || stockCode === '') {
      return ['', null];
    }
    
    // If it's a number, it's a BSE code
    if (typeof stockCode === 'number') {
      return ['', String(stockCode)];
    }
    
    // If it's a string
    const codeStr = String(stockCode).trim();
    
    // Check if it's a numeric string (BSE code)
    if (/^\d+$/.test(codeStr)) {
      return ['', codeStr];
    }
    
    // It's an NSE code (or NSE/BSE format)
    if (codeStr.includes('/')) {
      const codes = codeStr.split('/').map(code => code.trim());
      return [codes[0] || '', codes[1] || null];
    }
    
    // Single NSE code
    return [codeStr, null];
  }

  /**
   * Calculates all metrics for a holding based on current market price
   * @param {Object} holding - The holding object
   * @param {number} cmp - Current market price
   * @returns {Object} Updated holding with calculated metrics
   */
  calculateMetrics(holding, cmp) {
    // Calculate Investment (Purchase Price × Quantity)
    const investment = holding.purchasePrice * holding.quantity;
    
    // Calculate Present Value (CMP × Quantity)
    const presentValue = cmp * holding.quantity;
    
    // Calculate Gain/Loss (Present Value - Investment)
    const gainLoss = presentValue - investment;
    
    // Calculate Gain/Loss percentage
    const gainLossPercentage = investment !== 0 
      ? (gainLoss / investment) * 100 
      : 0;
    
    // Return updated holding with all calculated fields
    return {
      ...holding,
      cmp,
      investment,
      presentValue,
      gainLoss,
      gainLossPercentage,
      lastUpdated: new Date()
    };
  }

  /**
   * Calculates portfolio percentages for all holdings
   * @param {Array} holdings - Array of holding objects
   * @returns {Array} Holdings with updated portfolio percentages
   */
  calculatePortfolioPercentages(holdings) {
    const totalInvestment = holdings.reduce((sum, h) => sum + h.investment, 0);
    
    if (totalInvestment === 0) {
      return holdings.map(h => ({ ...h, portfolioPercentage: 0 }));
    }
    
    return holdings.map(h => ({
      ...h,
      portfolioPercentage: (h.investment / totalInvestment) * 100
    }));
  }

  /**
   * Groups holdings by sector
   * @param {Array} holdings - Array of holding objects
   * @returns {Map} Map of sector name to holdings array
   */
  groupBySector(holdings) {
    const sectorMap = new Map();
    
    holdings.forEach(holding => {
      const sector = holding.sector || 'Uncategorized';
      if (!sectorMap.has(sector)) {
        sectorMap.set(sector, []);
      }
      sectorMap.get(sector).push(holding);
    });
    
    return sectorMap;
  }

  /**
   * Calculates summary statistics for a sector
   * @param {Array} holdings - Array of holdings in the sector
   * @param {string} sector - Sector name
   * @returns {Object} Sector summary object
   */
  calculateSectorSummary(holdings, sector) {
    const totalInvestment = holdings.reduce((sum, h) => sum + h.investment, 0);
    const totalPresentValue = holdings.reduce((sum, h) => sum + h.presentValue, 0);
    const totalGainLoss = totalPresentValue - totalInvestment;
    const gainLossPercentage = totalInvestment !== 0 
      ? (totalGainLoss / totalInvestment) * 100 
      : 0;
    
    return {
      sector,
      totalInvestment,
      totalPresentValue,
      totalGainLoss,
      gainLossPercentage,
      holdingsCount: holdings.length
    };
  }

  /**
   * Enriches portfolio holdings with live data from Yahoo Finance and Google Finance
   * Orchestrates parallel fetching of CMP and financial metrics
   * Handles partial failures gracefully and returns available data
   * 
   * @param {Array} holdings - Array of holding objects to enrich
   * @param {Object} yahooFinanceService - Yahoo Finance service instance
   * @param {Object} googleFinanceService - Google Finance service instance
   * @returns {Promise<Object>} Object containing enriched holdings and any errors
   */
  async enrichWithLiveData(holdings, yahooFinanceService, googleFinanceService) {
    if (!holdings || holdings.length === 0) {
      return {
        holdings: [],
        errors: []
      };
    }

    const errors = [];
    
    // Extract symbols for batch fetching
    // Convert NSE codes to Yahoo Finance format (e.g., RELIANCE -> RELIANCE.NS)
    // For BSE codes, try to map to NSE symbol first
    const symbolMap = new Map();
    holdings.forEach(holding => {
      if (holding.nseCode) {
        // NSE code available - use .NS suffix
        const yahooSymbol = `${holding.nseCode}.NS`;
        symbolMap.set(holding.id, yahooSymbol);
      } else if (holding.bseCode) {
        // Try to get NSE symbol from BSE code mapping
        const nseSymbol = getNseFromBse(holding.bseCode);
        if (nseSymbol) {
          const yahooSymbol = `${nseSymbol}.NS`;
          symbolMap.set(holding.id, yahooSymbol);
        } else {
          // Fallback to BSE code with .BO suffix (may not work for all stocks)
          const yahooSymbol = `${holding.bseCode}.BO`;
          symbolMap.set(holding.id, yahooSymbol);
        }
      }
    });

    const symbols = Array.from(symbolMap.values());

    // Fetch CMP data from Yahoo Finance (skip Google Finance for faster loading)
    // P/E ratio and earnings data is already in the Excel file
    let cmpMap = new Map();
    
    try {
      cmpMap = await yahooFinanceService.getBatchPrices(symbols);
    } catch (error) {
      errors.push({
        source: 'yahoo',
        message: `Failed to fetch CMP data: ${error.message}`,
        timestamp: new Date()
      });
    }

    // Skip Google Finance for now - data is in Excel
    const financialMap = new Map();
    
    // Note: Google Finance fetching is disabled for faster loading
    // P/E ratio and earnings are read from Excel file instead
    if (false && googleFinanceService) { // Disabled
      errors.push({
        source: 'google',
        message: `Failed to fetch financial metrics: ${financialResults.reason.message}`,
        timestamp: new Date()
      });
    }

    // Enrich each holding with live data
    const enrichedHoldings = holdings.map(holding => {
      const yahooSymbol = symbolMap.get(holding.id);
      
      // Get CMP from Yahoo Finance
      const cmp = cmpMap.get(yahooSymbol);
      
      // Get financial metrics from Google Finance (if available)
      // Otherwise, preserve the values already read from Excel
      const financialData = financialMap.get(yahooSymbol);
      const peRatio = financialData?.peRatio ?? holding.peRatio;
      const latestEarnings = financialData?.latestEarnings ?? holding.latestEarnings;

      // If CMP is available, calculate all metrics
      if (cmp !== undefined && cmp !== null) {
        const enrichedHolding = this.calculateMetrics(holding, cmp);
        
        // Add financial metrics (preserve Excel values if Google Finance not available)
        enrichedHolding.peRatio = peRatio;
        enrichedHolding.latestEarnings = latestEarnings;
        
        return enrichedHolding;
      } else {
        // CMP not available - silently skip
        // Small-cap stocks may not be available on Yahoo Finance
        // Return holding with financial metrics but no CMP updates
        return {
          ...holding,
          peRatio,
          latestEarnings,
          lastUpdated: new Date()
        };
      }
    });

    // Calculate portfolio percentages for all enriched holdings
    const holdingsWithPercentages = this.calculatePortfolioPercentages(enrichedHoldings);

    return {
      holdings: holdingsWithPercentages,
      errors
    };
  }
}

export default PortfolioService;
