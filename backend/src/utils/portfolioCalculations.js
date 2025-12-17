/**
 * Portfolio calculation utilities
 */

/**
 * Calculates portfolio percentages for all holdings
 * @param {Array} holdings - Array of holdings
 * @returns {Array} Holdings with updated portfolio percentages
 */
export function calculatePortfolioPercentages(holdings) {
  const totalValue = holdings.reduce((sum, h) => sum + h.presentValue, 0);
  
  if (totalValue === 0) {
    return holdings.map(h => ({ ...h, portfolioPercentage: 0 }));
  }

  return holdings.map(h => ({
    ...h,
    portfolioPercentage: (h.presentValue / totalValue) * 100
  }));
}

/**
 * Validates that portfolio percentages sum to approximately 100%
 * @param {Array} holdings - Array of holdings with portfolio percentages
 * @returns {boolean} True if sum is within tolerance
 */
export function validatePortfolioPercentages(holdings) {
  const sum = holdings.reduce((total, h) => total + h.portfolioPercentage, 0);
  const tolerance = 0.01; // 0.01% tolerance for floating point errors
  
  return Math.abs(sum - 100) <= tolerance || (holdings.length === 0 && sum === 0);
}

/**
 * Calculates total portfolio value
 * @param {Array} holdings - Array of holdings
 * @returns {Object} Portfolio totals
 */
export function calculatePortfolioTotals(holdings) {
  const totalInvestment = holdings.reduce((sum, h) => sum + h.investment, 0);
  const totalPresentValue = holdings.reduce((sum, h) => sum + h.presentValue, 0);
  const totalGainLoss = totalPresentValue - totalInvestment;
  const totalGainLossPercentage = totalInvestment !== 0 
    ? (totalGainLoss / totalInvestment) * 100 
    : 0;

  return {
    totalInvestment,
    totalPresentValue,
    totalGainLoss,
    totalGainLossPercentage,
    holdingsCount: holdings.length
  };
}
