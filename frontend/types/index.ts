/**
 * Core data models for the Portfolio Dashboard
 */

/**
 * Represents a single stock holding in the portfolio
 */
export interface Holding {
  id: string;
  particulars: string; // Stock name
  purchasePrice: number;
  quantity: number;
  investment: number; // Calculated: purchasePrice * quantity
  portfolioPercentage: number; // Calculated
  nseCode: string;
  bseCode?: string;
  cmp: number; // Current Market Price from Yahoo Finance
  presentValue: number; // Calculated: cmp * quantity
  gainLoss: number; // Calculated: presentValue - investment
  gainLossPercentage: number; // Calculated
  peRatio: number | null; // From Google Finance
  latestEarnings: string | null; // From Google Finance
  sector: string;
  lastUpdated: Date;
}

/**
 * Summary statistics for a sector group
 */
export interface SectorSummary {
  sector: string;
  totalInvestment: number;
  totalPresentValue: number;
  totalGainLoss: number;
  gainLossPercentage: number;
  holdingsCount: number;
}

/**
 * Error information from API calls
 */
export interface ApiError {
  source: 'yahoo' | 'google' | 'system';
  message: string;
  symbol?: string;
  timestamp: Date;
}

/**
 * Raw Excel row structure
 */
export interface ExcelRow {
  Particulars: string;
  'Purchase Price': number;
  Qty: number;
  'NSE/BSE': string;
  Sector: string;
}

/**
 * API Response Types
 */

/**
 * Response from /api/portfolio endpoint
 */
export interface PortfolioResponse {
  holdings: Holding[];
  lastUpdated: string;
  errors: ApiError[];
}

/**
 * Response from /api/portfolio/refresh endpoint
 */
export interface RefreshResponse {
  holdings: Holding[];
  lastUpdated: string;
}

/**
 * Response from /api/health endpoint
 */
export interface HealthResponse {
  status: 'healthy' | 'degraded';
  services: {
    yahooFinance: boolean;
    googleFinance: boolean;
  };
}

/**
 * Financial data from Google Finance
 */
export interface FinancialData {
  peRatio: number | null;
  latestEarnings: string | null;
}

/**
 * Utility type for partial holding updates
 */
export type PartialHolding = Partial<Holding> & Pick<Holding, 'id'>;

/**
 * Type guard to check if a value is a valid Holding
 */
export function isHolding(value: unknown): value is Holding {
  if (typeof value !== 'object' || value === null) return false;
  
  const holding = value as Holding;
  
  return (
    typeof holding.id === 'string' &&
    typeof holding.particulars === 'string' &&
    typeof holding.purchasePrice === 'number' &&
    typeof holding.quantity === 'number' &&
    typeof holding.investment === 'number' &&
    typeof holding.portfolioPercentage === 'number' &&
    typeof holding.nseCode === 'string' &&
    typeof holding.cmp === 'number' &&
    typeof holding.presentValue === 'number' &&
    typeof holding.gainLoss === 'number' &&
    typeof holding.gainLossPercentage === 'number' &&
    typeof holding.sector === 'string' &&
    (holding.peRatio === null || typeof holding.peRatio === 'number') &&
    (holding.latestEarnings === null || typeof holding.latestEarnings === 'string')
  );
}

/**
 * Type guard to check if a value is a valid SectorSummary
 */
export function isSectorSummary(value: unknown): value is SectorSummary {
  if (typeof value !== 'object' || value === null) return false;
  
  const summary = value as SectorSummary;
  
  return (
    typeof summary.sector === 'string' &&
    typeof summary.totalInvestment === 'number' &&
    typeof summary.totalPresentValue === 'number' &&
    typeof summary.totalGainLoss === 'number' &&
    typeof summary.gainLossPercentage === 'number' &&
    typeof summary.holdingsCount === 'number'
  );
}
