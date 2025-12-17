/**
 * ExcelRow model validators
 */

/**
 * Validates an Excel row
 * @param {Object} row - The Excel row to validate
 * @returns {Object} Validation result with isValid and errors
 */
export function validateExcelRow(row) {
  const errors = [];

  if (!row.Particulars || typeof row.Particulars !== 'string') {
    errors.push('Invalid or missing Particulars');
  }

  if (typeof row['Purchase Price'] !== 'number' || row['Purchase Price'] < 0) {
    errors.push('Invalid Purchase Price: must be a non-negative number');
  }

  if (typeof row.Qty !== 'number' || row.Qty < 0) {
    errors.push('Invalid Qty: must be a non-negative number');
  }

  if (!row['NSE/BSE'] || typeof row['NSE/BSE'] !== 'string') {
    errors.push('Invalid or missing NSE/BSE');
  }

  if (!row.Sector || typeof row.Sector !== 'string') {
    errors.push('Invalid or missing Sector');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates an array of Excel rows
 * @param {Array} rows - Array of Excel rows
 * @returns {Object} Validation result with isValid, errors, and validRows
 */
export function validateExcelRows(rows) {
  if (!Array.isArray(rows)) {
    return {
      isValid: false,
      errors: ['Input must be an array'],
      validRows: []
    };
  }

  const allErrors = [];
  const validRows = [];

  rows.forEach((row, index) => {
    const validation = validateExcelRow(row);
    if (validation.isValid) {
      validRows.push(row);
    } else {
      allErrors.push({
        row: index + 1,
        errors: validation.errors
      });
    }
  });

  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
    validRows
  };
}

/**
 * Normalizes an Excel row by trimming strings and ensuring proper types
 * @param {Object} row - The Excel row to normalize
 * @returns {Object} Normalized Excel row
 */
export function normalizeExcelRow(row) {
  return {
    Particulars: String(row.Particulars || '').trim(),
    'Purchase Price': Number(row['Purchase Price']) || 0,
    Qty: Number(row.Qty) || 0,
    'NSE/BSE': String(row['NSE/BSE'] || '').trim(),
    Sector: String(row.Sector || '').trim()
  };
}
