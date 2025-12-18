# Design Document

## Overview

The Dynamic Portfolio Dashboard is a full-stack web application built with Next.js (React) for the frontend and Node.js for the backend. The system fetches real-time financial data from Yahoo Finance and Google Finance, processes it, and presents it in an interactive dashboard with automatic updates every 15 seconds.

The architecture follows a client-server model where the Next.js frontend communicates with a Node.js backend API. The backend handles all external API calls, data transformation, and caching, while the frontend focuses on presentation and user interaction.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (Next.js)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Portfolio  │  │    Sector    │  │   Auto       │      │
│  │   Table      │  │    Groups    │  │   Refresh    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTP/REST API
                            │
┌─────────────────────────────────────────────────────────────┐
│                    Backend (Node.js)                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   API        │  │   Data       │  │   Cache      │      │
│  │   Routes     │  │   Service    │  │   Layer      │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ External APIs
                            │
┌─────────────────────────────────────────────────────────────┐
│              External Data Sources                           │
│  ┌──────────────┐              ┌──────────────┐            │
│  │   Yahoo      │              │   Google     │            │
│  │   Finance    │              │   Finance    │            │
│  └──────────────┘              └──────────────┘            │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

**Frontend:**
- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS
- Axios for HTTP requests
- React Query for data fetching and caching

**Backend:**
- Node.js with Express
- TypeScript
- Axios for external API calls
- Node-cache for in-memory caching
- XLSX library for Excel parsing
- Cheerio for web scraping (Yahoo/Google Finance)

## Components and Interfaces

### Frontend Components

#### 1. PortfolioTable Component
**Purpose:** Displays the main portfolio holdings table

**Props:**
```typescript
interface PortfolioTableProps {
  holdings: Holding[];
  isLoading: boolean;
  error: Error | null;
}
```

**Responsibilities:**
- Render table with all required columns
- Apply color coding to Gain/Loss values
- Handle sorting and filtering
- Display loading and error states

#### 2. SectorGroup Component
**Purpose:** Groups holdings by sector with summaries

**Props:**
```typescript
interface SectorGroupProps {
  sector: string;
  holdings: Holding[];
  summary: SectorSummary;
}
```

**Responsibilities:**
- Display sector header
- Render holdings within the sector
- Show sector-level summaries (Total Investment, Present Value, Gain/Loss)

#### 3. AutoRefresh Component
**Purpose:** Manages automatic data refresh

**Props:**
```typescript
interface AutoRefreshProps {
  interval: number; // milliseconds
  onRefresh: () => Promise<void>;
  enabled: boolean;
}
```

**Responsibilities:**
- Set up interval timer for automatic refresh
- Clean up timer on unmount
- Provide manual refresh button

#### 4. ErrorBoundary Component
**Purpose:** Catches and displays errors gracefully

**Responsibilities:**
- Catch React errors
- Display user-friendly error messages
- Provide retry mechanism

### Backend API Endpoints

#### 1. GET /api/portfolio
**Purpose:** Fetch complete portfolio data with live prices

**Response:**
```typescript
{
  holdings: Holding[];
  lastUpdated: string;
  errors: ApiError[];
}
```

#### 2. GET /api/portfolio/refresh
**Purpose:** Trigger manual refresh of live data

**Response:**
```typescript
{
  holdings: Holding[];
  lastUpdated: string;
}
```

#### 3. GET /api/health
**Purpose:** Check backend service health

**Response:**
```typescript
{
  status: 'healthy' | 'degraded';
  services: {
    yahooFinance: boolean;
    googleFinance: boolean;
  };
}
```

### Backend Services

#### 1. YahooFinanceService
**Purpose:** Fetch CMP data from Yahoo Finance

**Methods:**
```typescript
class YahooFinanceService {
  async getCurrentPrice(symbol: string): Promise<number>;
  async getBatchPrices(symbols: string[]): Promise<Map<string, number>>;
}
```

**Implementation Notes:**
- Use web scraping with Cheerio or unofficial Yahoo Finance library
- Implement retry logic with exponential backoff
- Cache results for 10 seconds to reduce API calls
- Handle rate limiting gracefully

#### 2. GoogleFinanceService
**Purpose:** Fetch P/E ratio and earnings data from Google Finance

**Methods:**
```typescript
class GoogleFinanceService {
  async getPERatio(symbol: string): Promise<number>;
  async getLatestEarnings(symbol: string): Promise<string>;
  async getBatchFinancials(symbols: string[]): Promise<Map<string, FinancialData>>;
}
```

**Implementation Notes:**
- Use web scraping with Cheerio
- Cache results for 1 hour (financial metrics change less frequently)
- Handle missing data gracefully

#### 3. PortfolioService
**Purpose:** Orchestrate data fetching and calculations

**Methods:**
```typescript
class PortfolioService {
  async loadPortfolioFromExcel(filePath: string): Promise<Holding[]>;
  async enrichWithLiveData(holdings: Holding[]): Promise<Holding[]>;
  calculateMetrics(holding: Holding, cmp: number): Holding;
  groupBySector(holdings: Holding[]): Map<string, Holding[]>;
  calculateSectorSummary(holdings: Holding[]): SectorSummary;
}
```

#### 4. CacheService
**Purpose:** Manage in-memory caching

**Methods:**
```typescript
class CacheService {
  get<T>(key: string): T | undefined;
  set<T>(key: string, value: T, ttl: number): void;
  delete(key: string): void;
  clear(): void;
}
```

## Data Models

### Holding
```typescript
interface Holding {
  id: string;
  particulars: string; // Stock name
  purchasePrice: number;
  quantity: number;
  investment: number; // Calculated: purchasePrice * quantity
  portfolioPercentage: number; // Calculated
  nseCode: string;
  bseCode?: string;
  cmp: number; // From Yahoo Finance
  presentValue: number; // Calculated: cmp * quantity
  gainLoss: number; // Calculated: presentValue - investment
  gainLossPercentage: number; // Calculated
  peRatio: number | null; // From Google Finance
  latestEarnings: string | null; // From Google Finance
  sector: string;
  lastUpdated: Date;
}
```

### SectorSummary
```typescript
interface SectorSummary {
  sector: string;
  totalInvestment: number;
  totalPresentValue: number;
  totalGainLoss: number;
  gainLossPercentage: number;
  holdingsCount: number;
}
```

### ApiError
```typescript
interface ApiError {
  source: 'yahoo' | 'google' | 'system';
  message: string;
  symbol?: string;
  timestamp: Date;
}
```

### ExcelRow
```typescript
interface ExcelRow {
  Particulars: string;
  'Purchase Price': number;
  Qty: number;
  'NSE/BSE': string;
  Sector: string;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Acceptance Criteria Testing Prework

1.1 WHEN the Portfolio Dashboard loads THEN the system SHALL display a table containing all stock holdings
Thoughts: This is testing that the UI renders correctly with data. We can generate random portfolio data and verify that all holdings appear in the rendered table.
Testable: yes - property

1.2 WHEN displaying holdings THEN the system SHALL show columns for Particulars, Purchase Price, Quantity, Investment, Portfolio percentage, NSE/BSE code, CMP, Present Value, Gain/Loss, P/E Ratio, and Latest Earnings
Thoughts: This verifies that all required columns are present in the table. We can check that the rendered table contains all specified column headers.
Testable: yes - property

1.3 WHEN calculating Investment THEN the system SHALL compute it as Purchase Price multiplied by Quantity
Thoughts: This is a mathematical property that should hold for all holdings. We can generate random purchase prices and quantities and verify the calculation.
Testable: yes - property

1.4 WHEN calculating Portfolio percentage THEN the system SHALL compute the proportional weight of each holding relative to total portfolio value
Thoughts: This is a mathematical property. The sum of all portfolio percentages should equal 100%, and each percentage should be proportional to the holding's value.
Testable: yes - property

1.5 WHEN calculating Present Value THEN the system SHALL compute it as CMP multiplied by Quantity
Thoughts: This is a mathematical property that should hold for all holdings with valid CMP data.
Testable: yes - property

2.1 WHEN the Portfolio Dashboard initializes THEN the Backend Service SHALL fetch CMP data from Yahoo Finance Data Source for all holdings
Thoughts: This tests that the backend makes the appropriate API calls. We can verify that for any set of holdings, the service attempts to fetch CMP for each.
Testable: yes - property

2.3 WHEN CMP data is received THEN the Frontend Application SHALL update the CMP column in the portfolio table
Thoughts: This tests that UI updates reflect data changes. For any CMP update, the table should show the new value.
Testable: yes - property

3.3 WHEN P/E Ratio and Latest Earnings data is received THEN the Frontend Application SHALL update the respective columns in the portfolio table
Thoughts: Similar to 2.3, this tests UI updates for financial metrics.
Testable: yes - property

4.3 WHEN Present Value updates THEN the system SHALL recalculate Gain/Loss for affected holdings
Thoughts: This is a dependency property - when Present Value changes, Gain/Loss must be recalculated. This should hold for all holdings.
Testable: yes - property

5.1 WHEN displaying Gain/Loss values THEN the Frontend Application SHALL color-code positive values in green
Thoughts: This is a UI rendering property. For any positive Gain/Loss value, the rendered element should have green styling.
Testable: yes - property

5.2 WHEN displaying Gain/Loss values THEN the Frontend Application SHALL color-code negative values in red
Thoughts: For any negative Gain/Loss value, the rendered element should have red styling.
Testable: yes - property

6.3 WHEN displaying sector summaries THEN the Frontend Application SHALL calculate and display Total Investment per sector
Thoughts: This is a mathematical aggregation property. The sector's total investment should equal the sum of all holdings' investments in that sector.
Testable: yes - property

6.4 WHEN displaying sector summaries THEN the Frontend Application SHALL calculate and display Total Present Value per sector
Thoughts: Similar aggregation property for present values.
Testable: yes - property

6.5 WHEN displaying sector summaries THEN the Frontend Application SHALL calculate and display Gain/Loss per sector
Thoughts: The sector Gain/Loss should equal the sum of all holdings' Gain/Loss in that sector.
Testable: yes - property

8.1 WHEN Yahoo Finance Data Source fails THEN the Frontend Application SHALL display a clear error message indicating CMP data is unavailable
Thoughts: This tests error handling. When the Yahoo Finance service fails, an appropriate error message should be displayed.
Testable: yes - example

8.2 WHEN Google Finance Data Source fails THEN the Frontend Application SHALL display a clear error message indicating financial metrics are unavailable
Thoughts: Similar error handling test for Google Finance.
Testable: yes - example

10.1 WHEN fetching repeated data THEN the Backend Service SHALL implement caching to reduce redundant API calls
Thoughts: This tests that the cache is used. If we request the same data twice within the cache TTL, only one external API call should be made.
Testable: yes - property

11.2 WHEN parsing Excel data THEN the Backend Service SHALL extract Particulars, Purchase Price, Quantity, NSE/BSE codes, and Sector information
Thoughts: This is a parsing property. For any valid Excel file, all required fields should be extracted correctly.
Testable: yes - property

### Property Reflection

After reviewing all identified properties, the following consolidations and eliminations are recommended:

**Redundant Properties:**
- Properties 1.3, 1.5, and 4.3 all test calculation correctness. These can be combined into a single comprehensive property: "All calculated fields are derived correctly from their inputs"
- Properties 5.1 and 5.2 test the same UI behavior (color coding) with different conditions. These can be combined into: "Gain/Loss values are color-coded correctly based on sign"
- Properties 6.3, 6.4, and 6.5 all test sector aggregation. These can be combined into: "Sector summaries correctly aggregate all holdings within the sector"

**Unique Properties to Keep:**
- Property 1.1: Table rendering with all holdings
- Property 1.2: All required columns present
- Property 1.4: Portfolio percentages sum to 100%
- Property 2.1: Backend fetches CMP for all holdings
- Property 2.3 & 3.3: UI updates reflect data changes (can be combined)
- Property 8.1 & 8.2: Error handling (examples, not properties)
- Property 10.1: Caching reduces redundant calls
- Property 11.2: Excel parsing extracts all fields

### Correctness Properties

**Property 1: All holdings are rendered**
*For any* valid portfolio dataset, when the table is rendered, every holding in the dataset should appear as a row in the table
**Validates: Requirements 1.1**

**Property 2: All required columns are present**
*For any* rendered portfolio table, the table should contain columns for Particulars, Purchase Price, Quantity, Investment, Portfolio %, NSE/BSE, CMP, Present Value, Gain/Loss, P/E Ratio, and Latest Earnings
**Validates: Requirements 1.2**

**Property 3: Calculated fields are mathematically correct**
*For any* holding with valid input data:
- Investment = Purchase Price × Quantity
- Present Value = CMP × Quantity
- Gain/Loss = Present Value - Investment
- Gain/Loss % = (Gain/Loss / Investment) × 100
**Validates: Requirements 1.3, 1.5, 4.3**

**Property 4: Portfolio percentages sum to 100%**
*For any* portfolio with at least one holding, the sum of all portfolio percentages should equal 100% (within floating-point tolerance of 0.01%)
**Validates: Requirements 1.4**

**Property 5: CMP data is fetched for all holdings**
*For any* portfolio initialization, the backend service should attempt to fetch CMP data from Yahoo Finance for every holding with a valid NSE/BSE code
**Validates: Requirements 2.1**

**Property 6: UI updates reflect data changes**
*For any* data update (CMP, P/E Ratio, or Latest Earnings), the corresponding table cell should display the new value within one render cycle
**Validates: Requirements 2.3, 3.3**

**Property 7: Gain/Loss color coding is correct**
*For any* Gain/Loss value displayed:
- If value > 0, the element should have green color styling
- If value < 0, the element should have red color styling
- If value = 0, the element should have neutral color styling
**Validates: Requirements 5.1, 5.2, 5.3**

**Property 8: Sector summaries are correctly aggregated**
*For any* sector group, the sector summary values should equal the sum of all holdings within that sector:
- Sector Total Investment = Σ(holding.investment) for all holdings in sector
- Sector Total Present Value = Σ(holding.presentValue) for all holdings in sector
- Sector Gain/Loss = Σ(holding.gainLoss) for all holdings in sector
**Validates: Requirements 6.3, 6.4, 6.5**

**Property 9: Cache reduces redundant API calls**
*For any* data request made within the cache TTL period, if the same data was previously fetched and cached, no new external API call should be made
**Validates: Requirements 10.1**

**Property 10: Excel parsing extracts all required fields**
*For any* valid Excel file with portfolio data, the parser should successfully extract Particulars, Purchase Price, Quantity, NSE/BSE codes, and Sector for every row
**Validates: Requirements 11.2**

## Error Handling

### Frontend Error Handling

1. **API Errors**: Display toast notifications for failed API calls
2. **Network Errors**: Show connection status indicator
3. **Data Validation Errors**: Highlight invalid data with error messages
4. **Component Errors**: Use Error Boundaries to catch and display React errors

### Backend Error Handling

1. **External API Failures**: 
   - Implement retry logic with exponential backoff (3 attempts)
   - Return partial data with error indicators
   - Log errors for monitoring

2. **Rate Limiting**:
   - Implement request throttling
   - Queue requests when rate limit is approached
   - Return cached data when available

3. **Data Parsing Errors**:
   - Validate Excel data structure
   - Provide detailed error messages for invalid data
   - Skip invalid rows and continue processing

4. **Server Errors**:
   - Return appropriate HTTP status codes
   - Include error details in response
   - Log stack traces for debugging

## Testing Strategy

### Unit Testing

**Frontend:**
- Component rendering tests (React Testing Library)
- Calculation logic tests (Jest)
- Hook behavior tests
- Utility function tests

**Backend:**
- Service method tests
- API endpoint tests (Supertest)
- Data transformation tests
- Cache behavior tests

### Property-Based Testing

We will use **fast-check** (JavaScript/TypeScript property-based testing library) for implementing correctness properties.

**Configuration:**
- Minimum 100 iterations per property test
- Custom generators for financial data (prices, quantities, percentages)
- Shrinking enabled for minimal failing examples

**Property Tests:**
1. Test calculation correctness across random inputs
2. Test aggregation properties with random portfolio sizes
3. Test UI rendering with random data sets
4. Test cache behavior with random request patterns

**Example Property Test Structure:**
```typescript
import fc from 'fast-check';

// Property 3: Calculated fields are mathematically correct
test('Property 3: Investment calculation', () => {
  fc.assert(
    fc.property(
      fc.float({ min: 0.01, max: 10000 }), // purchase price
      fc.integer({ min: 1, max: 10000 }), // quantity
      (purchasePrice, quantity) => {
        const holding = createHolding({ purchasePrice, quantity });
        const expectedInvestment = purchasePrice * quantity;
        expect(holding.investment).toBeCloseTo(expectedInvestment, 2);
      }
    ),
    { numRuns: 100 }
  );
});
```

### Integration Testing

- Test complete data flow from Excel to UI
- Test automatic refresh mechanism
- Test error recovery scenarios
- Test caching behavior across requests

### End-to-End Testing

- Test complete user workflows (optional, using Playwright)
- Test responsive behavior across devices
- Test performance under load

## Performance Optimization

### Frontend Optimizations

1. **React Memoization**:
   - Use `React.memo` for PortfolioTable and SectorGroup components
   - Use `useMemo` for expensive calculations
   - Use `useCallback` for event handlers

2. **Virtual Scrolling**:
   - Implement virtual scrolling for large portfolios (>100 holdings)
   - Use react-window or similar library

3. **Code Splitting**:
   - Lazy load non-critical components
   - Split by route using Next.js dynamic imports

4. **Image Optimization**:
   - Use Next.js Image component for any images
   - Implement lazy loading

### Backend Optimizations

1. **Caching Strategy**:
   - CMP data: 10-second TTL
   - Financial metrics: 1-hour TTL
   - Excel data: Cache until manual refresh

2. **Parallel Processing**:
   - Fetch CMP data for all stocks in parallel
   - Use Promise.all for batch operations
   - Implement connection pooling

3. **Request Batching**:
   - Batch multiple stock requests into single API calls where possible
   - Implement request deduplication

4. **Response Compression**:
   - Enable gzip compression for API responses
   - Minimize JSON payload size

## Security Considerations

1. **API Key Management**:
   - Store all API keys in environment variables
   - Never expose keys in client-side code
   - Use .env.local for local development

2. **Input Validation**:
   - Validate all user inputs
   - Sanitize Excel file data
   - Implement rate limiting on API endpoints

3. **CORS Configuration**:
   - Configure CORS to allow only frontend origin
   - Implement CSRF protection

4. **Error Messages**:
   - Don't expose sensitive information in error messages
   - Log detailed errors server-side only

## Deployment Considerations

### Frontend Deployment (Vercel)
- Deploy Next.js app to Vercel
- Configure environment variables
- Enable automatic deployments from Git

### Backend Deployment (Options)
- Deploy to Vercel as API routes (serverless)
- Or deploy to Railway/Render as standalone Node.js service
- Configure environment variables
- Set up monitoring and logging

### Environment Variables

**Frontend (.env.local):**
```
NEXT_PUBLIC_API_URL=http://localhost:3001
```

**Backend (.env):**
```
PORT=3001
EXCEL_FILE_PATH=./data/portfolio.xlsx
CACHE_TTL_CMP=10
CACHE_TTL_FINANCIALS=3600
NODE_ENV=development
```

## Development Workflow

1. **Setup**: Initialize Next.js and Node.js projects
2. **Data Layer**: Implement Excel parsing and data models
3. **Backend Services**: Build Yahoo/Google Finance services with caching
4. **API Layer**: Create Express API endpoints
5. **Frontend Components**: Build React components with Tailwind
6. **Integration**: Connect frontend to backend API
7. **Auto-refresh**: Implement periodic data updates
8. **Testing**: Write unit and property-based tests
9. **Optimization**: Apply performance improvements
10. **Deployment**: Deploy to production environment
