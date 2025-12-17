/**
 * SectorSummary model factory and validators
 */

/**
 * Creates a SectorSummary from an array of holdings
 * @param {string} sector - The sector name
 * @param {Array} holdings - Array of holdings in this sector
 * @returns {Object} A SectorSummary object
 */
export function createSectorSummary(sector, holdings) {
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
 * Validates a SectorSummary object
 * @param {Object} summary - The sector summary to validate
 * @returns {Object} Validation result with isValid and errors
 */
export function validateSectorSummary(summary) {
  const errors = [];

  if (!summary.sector || typeof summary.sector !== 'string') {
    errors.push('Invalid or missing sector');
  }

  if (typeof summary.totalInvestment !== 'number') {
    errors.push('Invalid totalInvestment: must be a number');
  }

  if (typeof summary.totalPresentValue !== 'number') {
    errors.push('Invalid totalPresentValue: must be a number');
  }

  if (typeof summary.totalGainLoss !== 'number') {
    errors.push('Invalid totalGainLoss: must be a number');
  }

  if (typeof summary.gainLossPercentage !== 'number') {
    errors.push('Invalid gainLossPercentage: must be a number');
  }

  if (typeof summary.holdingsCount !== 'number' || summary.holdingsCount < 0) {
    errors.push('Invalid holdingsCount: must be a non-negative number');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Groups holdings by sector and creates summaries
 * @param {Array} holdings - Array of all holdings
 * @returns {Map} Map of sector name to SectorSummary
 */
export function groupHoldingsBySector(holdings) {
  const sectorMap = new Map();

  // Group holdings by sector
  holdings.forEach(holding => {
    if (!sectorMap.has(holding.sector)) {
      sectorMap.set(holding.sector, []);
    }
    sectorMap.get(holding.sector).push(holding);
  });

  // Create summaries for each sector
  const summaries = new Map();
  sectorMap.forEach((sectorHoldings, sector) => {
    summaries.set(sector, createSectorSummary(sector, sectorHoldings));
  });

  return summaries;
}
