/**
 * Mapping of BSE codes to NSE symbols for Yahoo Finance
 * This is needed because Yahoo Finance works better with NSE symbols
 */

const BSE_TO_NSE_MAP = {
  // Financial Sector
  '532174': 'ICICIBANK',    // ICICI Bank
  '544252': 'BAJAJHFL',     // Bajaj Housing Finance
  // '511577': 'SAVANIFIN',    // Savani Financials (Not listed on NSE, fallback to .BO)
  '540719': 'SBILIFE',      // SBI Life
  
  // Tech Sector
  '542651': 'KPITTECH',     // KPIT Tech
  '544028': 'TATATECH',     // Tata Tech
  '544107': 'BLS',          // BLS E-Services
  '532790': 'TANLA',        // Tanla Platforms
  '532540': 'TATACONSUM',   // Tata Consumer
  '500331': 'PIDILITIND',   // Pidilite
  '500400': 'TATAPOWER',    // Tata Power
  '542323': 'KPIGREEN',     // KPI Green
  '532667': 'SUZLON',       // Suzlon
  '542851': 'GENSOL',       // Gensol Engineering
  
  // Pipe/Industrial Sector
  '543517': 'HARIOMPIPE',   // Hariom Pipes
  '542652': 'POLYCAB',      // Polycab
  '543318': 'CLEAN',        // Clean Science
  '506401': 'DEEPAKNTR',    // Deepak Nitrite
  '541557': 'FINEORG',      // Fine Organic
  '533282': 'GRAVITA',      // Gravita India
  
  // Others
  '500209': 'INFY',         // Infosys
  '543237': 'HAPPSTMNDS',   // Happiest Minds
  '543272': 'EASEMYTRIP',   // EaseMyTrip
};

/**
 * Get NSE symbol from BSE code
 * @param {string} bseCode - BSE numeric code
 * @returns {string|null} NSE symbol or null if not found
 */
export function getNseFromBse(bseCode) {
  return BSE_TO_NSE_MAP[bseCode] || null;
}

/**
 * Check if a BSE code has a known NSE mapping
 * @param {string} bseCode - BSE numeric code
 * @returns {boolean}
 */
export function hasBseMapping(bseCode) {
  return bseCode in BSE_TO_NSE_MAP;
}

export default BSE_TO_NSE_MAP;
