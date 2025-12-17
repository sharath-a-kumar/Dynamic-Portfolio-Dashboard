# Portfolio Services

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
