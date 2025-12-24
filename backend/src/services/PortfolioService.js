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
      
      // Build column mapping from headerRow
      // Find the best mapping for each required column
      const findKey = (possibleNames) => {
        return Object.keys(headerRow).find(key => {
          const val = headerRow[key];
          return val && typeof val === 'string' && possibleNames.some(name => 
            val.toLowerCase().includes(name.toLowerCase())
          );
        });
      };

      const keys = {
        number: findKey(['No', 'S.No']),
        particulars: findKey(['Particulars', 'Name']),
        purchasePrice: findKey(['Purchase Price', 'Buy Price']),
        quantity: findKey(['Qty', 'Quantity']),
        stockCode: findKey(['NSE/BSE', 'Code', 'Symbol']),
        pe: findKey(['P/E', 'PE Ratio']),
        earnings: findKey(['Latest Earnings', 'Earnings']),
        sector: findKey(['Sector', 'Category'])
      };

      console.log('Detected Excel Column Mapping:', keys);
      
      const errors = [];
      const holdings = [];
      let currentSector = 'Uncategorized';
      
      // Process rows starting from index 1 (skip header row)
      for (let i = 1; i < rawRows.length; i++) {
        const row = rawRows[i];
        
        // Particulars is required for both sector and stock rows
        const particularsValue = row[keys.particulars];
        if (!particularsValue || typeof particularsValue !== 'string') continue;

        // Check if this is a sector header row
        const hasStockNumber = row[keys.number] !== undefined && typeof row[keys.number] === 'number';
        const stockCode = row[keys.stockCode];
        const hasStockCode = stockCode !== undefined && stockCode !== null && stockCode !== '';
        
        // Sector rows typically have only the name and includes "Sector" or no stock number/code
        if (!hasStockNumber && !hasStockCode && (particularsValue.includes('Sector') || particularsValue.includes('Total'))) {
          currentSector = particularsValue.replace(/\s*Sector\s*/i, '').replace(/Total/i, '').trim();
          continue; 
        }
        
        // This is a stock row - parse it
        try {
          const purchasePriceValue = row[keys.purchasePrice];
          const quantityValue = row[keys.quantity];
          
          // Validate required fields
          if (purchasePriceValue === undefined || quantityValue === undefined || !hasStockCode) {
            continue;
          }
          
          // Parse NSE/BSE codes
          const [nse, bse] = this._parseNseBseCodes(stockCode);
          
          // Extract P/E ratio and Latest Earnings
          const peRatioValue = row[keys.pe];
          const latestEarningsValue = row[keys.earnings];
          
          // Parse P/E ratio (can be number, string like "#N/A", or empty)
          let peRatio = null;
          if (peRatioValue !== undefined && peRatioValue !== null && peRatioValue !== '') {
            const parsed = Number(peRatioValue);
            if (!isNaN(parsed) && parsed > 0) {
              peRatio = parsed;
            } else {
              // Might be string like "#N/A" or "-"
              // console.debug(`Non-numeric PE for ${particularsValue}: ${peRatioValue}`);
            }
          }
          
          let latestEarnings = null;
          if (latestEarningsValue !== undefined && latestEarningsValue !== null && latestEarningsValue !== '' && latestEarningsValue !== '#N/A') {
            latestEarnings = String(latestEarningsValue).trim();
          }
          
          // Create holding
          const holding = createHolding({
            particulars: particularsValue.trim(),
            purchasePrice: Number(purchasePriceValue) || 0,
            quantity: Number(quantityValue) || 0,
            nseCode: nse,
            bseCode: bse,
            sector: currentSector,
            cmp: 0,
            peRatio: peRatio,
            latestEarnings: latestEarnings
          });
          
          holdings.push(holding);
          
        } catch (error) {
          errors.push({
            row: i + 1,
            error: `Failed to create holding for ${particularsValue}: ${error.message}`
          });
        }
      }
      
      console.log(`Successfully loaded ${holdings.length} holdings in ${new Set(holdings.map(h => h.sector)).size} sectors`);
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

    // Fetch financial metrics from Google Finance (P/E ratio, earnings)
    let financialMap = new Map();
    try {
      if (googleFinanceService) {
        financialMap = await googleFinanceService.getBatchFinancials(symbols);
      }
    } catch (error) {
      errors.push({
        source: 'google',
        message: `Failed to fetch financial metrics: ${error.message}`,
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
      const peRatio = (financialData && financialData.peRatio) ? financialData.peRatio : (holding.peRatio || null);
      const latestEarnings = (financialData && financialData.latestEarnings) ? financialData.latestEarnings : (holding.latestEarnings || null);

      // If CMP is available, calculate all metrics
      if (cmp !== undefined && cmp !== null) {
        const enrichedHolding = this.calculateMetrics(holding, cmp);
        
        // Add financial metrics (preserve Excel values if Google Finance not available)
        enrichedHolding.peRatio = peRatio;
        enrichedHolding.latestEarnings = latestEarnings;
        
        return enrichedHolding;
      } else {
        // CMP not available - skip calculation but report error
        errors.push({
          source: 'yahoo',
          symbol: yahooSymbol,
          message: `Missing CMP for ${holding.particulars}`,
          timestamp: new Date()
        });

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
