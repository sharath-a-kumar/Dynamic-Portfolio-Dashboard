/**
 * Holding model factory and validators
 */

/**
 * Creates a new Holding object
 * @param {Object} data - The holding data
 * @returns {Object} A validated Holding object
 */
export function createHolding(data) {
  const holding = {
    id: data.id || generateId(),
    particulars: data.particulars || '',
    purchasePrice: Number(data.purchasePrice) || 0,
    quantity: Number(data.quantity) || 0,
    investment: 0, // Will be calculated
    portfolioPercentage: 0, // Will be calculated
    nseCode: data.nseCode || '',
    bseCode: data.bseCode || null,
    cmp: Number(data.cmp) || 0,
    presentValue: 0, // Will be calculated
    gainLoss: 0, // Will be calculated
    gainLossPercentage: 0, // Will be calculated
    peRatio: data.peRatio !== undefined ? Number(data.peRatio) : null,
    latestEarnings: data.latestEarnings || null,
    sector: data.sector || '',
    lastUpdated: data.lastUpdated || new Date()
  };

  // Calculate derived fields
  holding.investment = holding.purchasePrice * holding.quantity;
  holding.presentValue = holding.cmp * holding.quantity;
  holding.gainLoss = holding.presentValue - holding.investment;
  holding.gainLossPercentage = holding.investment !== 0 
    ? (holding.gainLoss / holding.investment) * 100 
    : 0;

  return holding;
}

/**
 * Validates a Holding object
 * @param {Object} holding - The holding to validate
 * @returns {Object} Validation result with isValid and errors
 */
export function validateHolding(holding) {
  const errors = [];

  if (!holding.id || typeof holding.id !== 'string') {
    errors.push('Invalid or missing id');
  }

  if (!holding.particulars || typeof holding.particulars !== 'string') {
    errors.push('Invalid or missing particulars');
  }

  if (typeof holding.purchasePrice !== 'number' || holding.purchasePrice < 0) {
    errors.push('Invalid purchasePrice: must be a non-negative number');
  }

  if (typeof holding.quantity !== 'number' || holding.quantity < 0) {
    errors.push('Invalid quantity: must be a non-negative number');
  }

  if (!holding.nseCode || typeof holding.nseCode !== 'string') {
    errors.push('Invalid or missing nseCode');
  }

  if (typeof holding.cmp !== 'number' || holding.cmp < 0) {
    errors.push('Invalid cmp: must be a non-negative number');
  }

  if (!holding.sector || typeof holding.sector !== 'string') {
    errors.push('Invalid or missing sector');
  }

  if (holding.peRatio !== null && typeof holding.peRatio !== 'number') {
    errors.push('Invalid peRatio: must be a number or null');
  }

  if (holding.latestEarnings !== null && typeof holding.latestEarnings !== 'string') {
    errors.push('Invalid latestEarnings: must be a string or null');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Generates a unique ID for a holding
 * @returns {string} A unique identifier
 */
function generateId() {
  return `holding_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Updates calculated fields for a holding
 * @param {Object} holding - The holding to update
 * @param {number} cmp - New current market price
 * @returns {Object} Updated holding
 */
export function updateHoldingMetrics(holding, cmp) {
  const updated = { ...holding };
  updated.cmp = cmp;
  updated.presentValue = cmp * updated.quantity;
  updated.gainLoss = updated.presentValue - updated.investment;
  updated.gainLossPercentage = updated.investment !== 0 
    ? (updated.gainLoss / updated.investment) * 100 
    : 0;
  updated.lastUpdated = new Date();
  
  return updated;
}

/**
 * Creates a Holding from an Excel row
 * @param {Object} excelRow - Raw Excel row data
 * @returns {Object} A Holding object
 */
export function createHoldingFromExcel(excelRow) {
  const [nseCode, bseCode] = parseNseBseCodes(excelRow['NSE/BSE']);
  
  return createHolding({
    particulars: excelRow.Particulars,
    purchasePrice: excelRow['Purchase Price'],
    quantity: excelRow.Qty,
    nseCode,
    bseCode,
    sector: excelRow.Sector,
    cmp: 0, // Will be fetched from Yahoo Finance
    peRatio: null, // Will be fetched from Google Finance
    latestEarnings: null // Will be fetched from Google Finance
  });
}

/**
 * Parses NSE/BSE codes from the Excel format
 * @param {string} nseBseString - The NSE/BSE string from Excel
 * @returns {Array} [nseCode, bseCode]
 */
function parseNseBseCodes(nseBseString) {
  if (!nseBseString) return ['', null];
  
  const codes = nseBseString.split('/').map(code => code.trim());
  return [codes[0] || '', codes[1] || null];
}
