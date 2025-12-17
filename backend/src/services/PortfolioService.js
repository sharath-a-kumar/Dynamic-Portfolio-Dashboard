/**
 * PortfolioService - Handles portfolio data loading, parsing, and enrichment
 */

import xlsx from 'xlsx';
import { createHolding } from '../models/Holding.js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

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
        const hasNseCode = row['__EMPTY_6'] !== undefined && typeof row['__EMPTY_6'] === 'string';
        
        if (particularsValue && typeof particularsValue === 'string') {
          // Check if this looks like a sector header (no stock number, no NSE code)
          if (!hasStockNumber && !hasNseCode && particularsValue.includes('Sector')) {
            currentSector = particularsValue.replace(/\s*Sector\s*/i, '').trim();
            continue; // Skip to next row
          }
          
          // This is a stock row - parse it
          try {
            const purchasePrice = row['__EMPTY_2'];
            const quantity = row['__EMPTY_3'];
            const nseCode = row['__EMPTY_6'];
            
            // Validate required fields
            if (!particularsValue || purchasePrice === undefined || quantity === undefined || !nseCode) {
              errors.push({
                row: i + 1,
                error: 'Missing required fields (Particulars, Purchase Price, Qty, or NSE/BSE)'
              });
              continue;
            }
            
            // Parse NSE/BSE codes
            const [nse, bse] = this._parseNseBseCodes(nseCode);
            
            // Create holding
            const holding = createHolding({
              particulars: particularsValue.trim(),
              purchasePrice: Number(purchasePrice) || 0,
              quantity: Number(quantity) || 0,
              nseCode: nse,
              bseCode: bse,
              sector: currentSector,
              cmp: 0, // Will be fetched from Yahoo Finance
              peRatio: null, // Will be fetched from Google Finance
              latestEarnings: null // Will be fetched from Google Finance
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
   * Parses NSE/BSE codes from a string
   * @param {string} nseBseString - The NSE/BSE string
   * @returns {Array} [nseCode, bseCode]
   * @private
   */
  _parseNseBseCodes(nseBseString) {
    if (!nseBseString || typeof nseBseString !== 'string') {
      return ['', null];
    }
    
    const codes = nseBseString.split('/').map(code => code.trim());
    return [codes[0] || '', codes[1] || null];
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
}

export default PortfolioService;
