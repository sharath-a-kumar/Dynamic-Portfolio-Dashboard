# Portfolio Services

## YahooFinanceService

The `YahooFinanceService` class fetches real-time stock prices from Yahoo Finance with caching, retry logic, and rate limiting.

### Features

- **Real-time Price Fetching**: Retrieves current market prices (CMP) for stocks
- **Batch Processing**: Fetches multiple stock prices efficiently
- **Caching**: 10-second TTL cache to reduce API calls
- **Retry Logic**: Exponential backoff for transient errors
- **Rate Limiting**: Prevents API blocks with request queuing
- **Error Handling**: Graceful handling of network errors, timeouts, and invalid symbols

### Usage

```javascript
import YahooFinanceService from './services/YahooFinanceService.js';
import CacheService from './services/CacheService.js';

const cacheService = new CacheService();
const yahooService = new YahooFinanceService(cacheService, {
  cacheTTL: 10,              // Cache for 10 seconds
  maxRetries: 3,             // Retry up to 3 times
  initialRetryDelay: 1000,   // Start with 1 second delay
  timeout: 5000,             // 5 second timeout
  minRequestInterval: 100    // 100ms between requests
});

// Fetch single stock price
const price = await yahooService.getCurrentPrice('RELIANCE.NS');
console.log(`Current price: ₹${price}`);

// Fetch multiple stock prices
const symbols = ['RELIANCE.NS', 'TCS.NS', 'INFY.NS'];
const priceMap = await yahooService.getBatchPrices(symbols);
priceMap.forEach((price, symbol) => {
  console.log(`${symbol}: ₹${price}`);
});

// View statistics
const stats = yahooService.getStats();
console.log(`Cache hit rate: ${stats.cache.hitRate}`);

// Clear cache
yahooService.clearCache();
```

### Methods

#### `getCurrentPrice(symbol)`

Fetches the current market price for a single stock symbol.

**Parameters:**
- `symbol` (string): Stock symbol (e.g., 'RELIANCE.NS' for NSE, 'RELIANCE.BO' for BSE)

**Returns:**
- Promise<number>: Current market price

**Throws:**
- Error if symbol is invalid or price cannot be fetched

**Caching:**
- Results are cached for 10 seconds (configurable)
- Subsequent calls within TTL return cached value

#### `getBatchPrices(symbols)`

Fetches prices for multiple stock symbols in parallel with rate limiting.

**Parameters:**
- `symbols` (string[]): Array of stock symbols

**Returns:**
- Promise<Map<string, number>>: Map of symbol to price

**Features:**
- Filters out invalid symbols automatically
- Handles partial failures gracefully
- Returns available prices even if some fail
- Respects rate limiting between requests

#### `clearCache()`

Clears all cached Yahoo Finance prices.

#### `getStats()`

Returns service statistics including cache performance.

**Returns:**
- Object with:
  - `cache`: Cache statistics (hits, misses, hit rate, keys)
  - `queueLength`: Number of queued requests
  - `isProcessingQueue`: Whether queue is being processed

### Configuration Options

| Option | Default | Description |
|--------|---------|-------------|
| `cacheTTL` | 10 | Cache time-to-live in seconds |
| `maxRetries` | 3 | Maximum retry attempts for failed requests |
| `initialRetryDelay` | 1000 | Initial retry delay in milliseconds (exponential backoff) |
| `timeout` | 5000 | Request timeout in milliseconds |
| `minRequestInterval` | 100 | Minimum time between requests in milliseconds |

### Error Handling

The service creates structured error objects with:
- `source`: 'yahoo'
- `message`: Descriptive error message
- `symbol`: Stock symbol (if applicable)
- `timestamp`: Error timestamp

**Error Types:**
- **Invalid Symbol**: Symbol not found (404)
- **Rate Limit**: Too many requests (429)
- **Timeout**: Request exceeded timeout
- **Network Error**: Connection issues
- **Parse Error**: Unable to extract price from response

### Requirements Validated

This implementation satisfies the following requirements:

- **2.1**: Fetches CMP data from Yahoo Finance for all holdings
- **2.2**: Handles Yahoo Finance unavailability gracefully
- **2.4**: Implements rate limiting to prevent API blocks
- **2.5**: Batches requests efficiently for multiple stocks
- **8.1**: Displays clear error messages when data unavailable
- **8.4**: Handles API rate limits appropriately

### Testing

Run the test suite:

```bash
npm test YahooFinanceService.test.js
```

Run the example usage:

```bash
node src/services/YahooFinanceService.example.js
```

## PortfolioService

The `PortfolioService` class handles portfolio data loading, parsing, and calculations.

### Features

- **Excel Parsing**: Loads portfolio data from Excel files with automatic sector detection
- **Data Validation**: Validates Excel structure and handles errors gracefully
- **Portfolio Calculations**: Calculates portfolio percentages, sector summaries, and metrics
- **Sector Grouping**: Automatically groups holdings by sector

### Usage

```javascript
import PortfolioService from './services/PortfolioService.js';

const service = new PortfolioService();

// Load portfolio from Excel
const result = await service.loadPortfolioFromExcel('./path/to/portfolio.xlsx');

console.log(`Loaded ${result.holdings.length} holdings`);
console.log(`Errors: ${result.errors.length}`);

// Calculate portfolio percentages
const holdingsWithPercentages = service.calculatePortfolioPercentages(result.holdings);

// Group by sector
const sectorGroups = service.groupBySector(holdingsWithPercentages);

// Calculate sector summary
sectorGroups.forEach((holdings, sector) => {
  const summary = service.calculateSectorSummary(holdings, sector);
  console.log(`${sector}: ${summary.totalInvestment}`);
});
```

### Excel File Format

The service expects an Excel file with the following structure:

- **Row 1**: Headers (No, Particulars, Purchase Price, Qty, NSE/BSE, etc.)
- **Row 2+**: Data rows with sector headers interspersed

Sector headers are identified by:
- Having text ending with "Sector" in the Particulars column
- No stock number or NSE/BSE code

Stock rows must have:
- Particulars (stock name)
- Purchase Price
- Quantity (Qty)
- NSE/BSE code

### Methods

#### `loadPortfolioFromExcel(filePath)`

Loads and parses portfolio data from an Excel file.

**Parameters:**
- `filePath` (string): Path to the Excel file

**Returns:**
- Object with:
  - `holdings` (Array): Array of parsed holding objects
  - `errors` (Array): Array of parsing errors
  - `totalRows` (number): Total rows processed
  - `validRows` (number): Successfully parsed rows
  - `invalidRows` (number): Rows with errors

**Throws:**
- Error if file not found or cannot be parsed

#### `calculatePortfolioPercentages(holdings)`

Calculates portfolio percentage for each holding.

**Parameters:**
- `holdings` (Array): Array of holding objects

**Returns:**
- Array of holdings with updated `portfolioPercentage` field

#### `groupBySector(holdings)`

Groups holdings by sector.

**Parameters:**
- `holdings` (Array): Array of holding objects

**Returns:**
- Map of sector name to array of holdings

#### `calculateSectorSummary(holdings, sector)`

Calculates summary statistics for a sector.

**Parameters:**
- `holdings` (Array): Array of holdings in the sector
- `sector` (string): Sector name

**Returns:**
- Object with:
  - `sector` (string): Sector name
  - `totalInvestment` (number): Total investment in sector
  - `totalPresentValue` (number): Total present value
  - `totalGainLoss` (number): Total gain/loss
  - `gainLossPercentage` (number): Gain/loss percentage
  - `holdingsCount` (number): Number of holdings

### Requirements Validated

This implementation satisfies the following requirements:

- **11.1**: Reads portfolio data from Excel file
- **11.2**: Extracts Particulars, Purchase Price, Quantity, NSE/BSE codes, and Sector
- **11.3**: Validates Excel data and reports errors clearly
- **11.4**: Transforms Excel data into JSON format (Holding objects)
- **11.5**: Displays all holdings from Excel source

### Testing

Run the test script to verify functionality:

```bash
node src/services/test-portfolio.js
```

Or run the example usage:

```bash
node src/services/example-usage.js
```
