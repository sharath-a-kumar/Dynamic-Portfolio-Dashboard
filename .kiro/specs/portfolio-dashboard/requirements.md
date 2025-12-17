# Requirements Document

## Introduction

This document outlines the requirements for a Dynamic Portfolio Dashboard web application that displays real-time stock portfolio information. The system fetches live financial data from external sources (Yahoo Finance and Google Finance) and presents it in an interactive, visually appealing interface. The application enables investors to monitor their portfolio performance with automatic updates, sector-wise grouping, and visual indicators for gains and losses.

## Glossary

- **Portfolio Dashboard**: The web application that displays stock holdings and their performance metrics
- **CMP (Current Market Price)**: The real-time trading price of a stock
- **P/E Ratio (Price-to-Earnings Ratio)**: A valuation metric comparing stock price to earnings per share
- **Present Value**: The current market value of a stock position (CMP × Quantity)
- **Gain/Loss**: The difference between Present Value and Investment amount
- **Investment**: The total amount invested in a stock position (Purchase Price × Quantity)
- **Sector**: A category grouping stocks by industry (e.g., Financials, Technology)
- **NSE/BSE**: National Stock Exchange / Bombay Stock Exchange codes
- **Yahoo Finance Data Source**: External service providing real-time stock prices
- **Google Finance Data Source**: External service providing P/E ratios and earnings data
- **Frontend Application**: The Next.js React application serving the user interface
- **Backend Service**: The Node.js server handling API requests and data processing
- **Data Refresh Interval**: The periodic time interval for updating live data (15 seconds)

## Requirements

### Requirement 1

**User Story:** As an investor, I want to view my complete portfolio holdings in a structured table format, so that I can see all my investments at a glance.

#### Acceptance Criteria

1. WHEN the Portfolio Dashboard loads THEN the system SHALL display a table containing all stock holdings
2. WHEN displaying holdings THEN the system SHALL show columns for Particulars, Purchase Price, Quantity, Investment, Portfolio percentage, NSE/BSE code, CMP, Present Value, Gain/Loss, P/E Ratio, and Latest Earnings
3. WHEN calculating Investment THEN the system SHALL compute it as Purchase Price multiplied by Quantity
4. WHEN calculating Portfolio percentage THEN the system SHALL compute the proportional weight of each holding relative to total portfolio value
5. WHEN calculating Present Value THEN the system SHALL compute it as CMP multiplied by Quantity

### Requirement 2

**User Story:** As an investor, I want to see real-time stock prices from Yahoo Finance, so that I can track current market values of my holdings.

#### Acceptance Criteria

1. WHEN the Portfolio Dashboard initializes THEN the Backend Service SHALL fetch CMP data from Yahoo Finance Data Source for all holdings
2. WHEN Yahoo Finance Data Source is unavailable THEN the Backend Service SHALL handle the error gracefully and display an appropriate message
3. WHEN CMP data is received THEN the Frontend Application SHALL update the CMP column in the portfolio table
4. WHEN fetching CMP data THEN the Backend Service SHALL implement rate limiting to prevent API blocks
5. WHEN multiple stocks require CMP updates THEN the Backend Service SHALL batch requests efficiently

### Requirement 3

**User Story:** As an investor, I want to see P/E ratios and latest earnings from Google Finance, so that I can evaluate stock valuations and recent performance.

#### Acceptance Criteria

1. WHEN the Portfolio Dashboard initializes THEN the Backend Service SHALL fetch P/E Ratio and Latest Earnings from Google Finance Data Source for all holdings
2. WHEN Google Finance Data Source is unavailable THEN the Backend Service SHALL handle the error gracefully and display an appropriate message
3. WHEN P/E Ratio and Latest Earnings data is received THEN the Frontend Application SHALL update the respective columns in the portfolio table
4. WHEN fetching financial metrics THEN the Backend Service SHALL implement caching to reduce redundant API calls
5. WHEN data is stale THEN the Backend Service SHALL refresh cached data appropriately

### Requirement 4

**User Story:** As an investor, I want automatic updates of stock prices and values every 15 seconds, so that I can monitor real-time changes without manual refresh.

#### Acceptance Criteria

1. WHEN the Portfolio Dashboard is active THEN the system SHALL automatically refresh CMP data at the Data Refresh Interval
2. WHEN CMP updates THEN the system SHALL recalculate Present Value for affected holdings
3. WHEN Present Value updates THEN the system SHALL recalculate Gain/Loss for affected holdings
4. WHEN automatic updates occur THEN the Frontend Application SHALL update the display without full page reload
5. WHEN the user navigates away from the dashboard THEN the system SHALL stop automatic updates to conserve resources

### Requirement 5

**User Story:** As an investor, I want visual indicators for gains and losses, so that I can quickly identify profitable and losing positions.

#### Acceptance Criteria

1. WHEN displaying Gain/Loss values THEN the Frontend Application SHALL color-code positive values in green
2. WHEN displaying Gain/Loss values THEN the Frontend Application SHALL color-code negative values in red
3. WHEN displaying Gain/Loss values THEN the Frontend Application SHALL color-code zero values in a neutral color
4. WHEN Gain/Loss values update THEN the Frontend Application SHALL maintain appropriate color coding
5. WHEN rendering color indicators THEN the Frontend Application SHALL ensure sufficient contrast for accessibility

### Requirement 6

**User Story:** As an investor, I want to see my holdings grouped by sector with sector-level summaries, so that I can understand my portfolio diversification and sector performance.

#### Acceptance Criteria

1. WHEN displaying the portfolio THEN the Frontend Application SHALL group stocks by Sector
2. WHEN displaying sector groups THEN the Frontend Application SHALL show a sector header for each group
3. WHEN displaying sector summaries THEN the Frontend Application SHALL calculate and display Total Investment per sector
4. WHEN displaying sector summaries THEN the Frontend Application SHALL calculate and display Total Present Value per sector
5. WHEN displaying sector summaries THEN the Frontend Application SHALL calculate and display Gain/Loss per sector

### Requirement 7

**User Story:** As an investor, I want the dashboard to be responsive across devices, so that I can monitor my portfolio on desktop, tablet, or mobile.

#### Acceptance Criteria

1. WHEN accessing the Portfolio Dashboard on desktop THEN the Frontend Application SHALL display the full table layout optimally
2. WHEN accessing the Portfolio Dashboard on tablet THEN the Frontend Application SHALL adapt the layout for medium screens
3. WHEN accessing the Portfolio Dashboard on mobile THEN the Frontend Application SHALL adapt the layout for small screens
4. WHEN the viewport size changes THEN the Frontend Application SHALL adjust the layout responsively
5. WHEN displaying on small screens THEN the Frontend Application SHALL maintain readability and usability

### Requirement 8

**User Story:** As an investor, I want clear error messages when data cannot be fetched, so that I understand when information is unavailable or outdated.

#### Acceptance Criteria

1. WHEN Yahoo Finance Data Source fails THEN the Frontend Application SHALL display a clear error message indicating CMP data is unavailable
2. WHEN Google Finance Data Source fails THEN the Frontend Application SHALL display a clear error message indicating financial metrics are unavailable
3. WHEN network connectivity is lost THEN the Frontend Application SHALL display a message indicating connection issues
4. WHEN API rate limits are exceeded THEN the Frontend Application SHALL display a message indicating temporary unavailability
5. WHEN errors are resolved THEN the Frontend Application SHALL automatically resume normal operation

### Requirement 9

**User Story:** As a developer, I want the Backend Service to handle API requests securely, so that sensitive data and API keys are protected.

#### Acceptance Criteria

1. WHEN the Backend Service makes API requests THEN the system SHALL not expose API keys or credentials in client-side code
2. WHEN the Backend Service stores configuration THEN the system SHALL use environment variables for sensitive data
3. WHEN the Frontend Application communicates with the Backend Service THEN the system SHALL use secure protocols
4. WHEN handling user data THEN the Backend Service SHALL implement appropriate security measures
5. WHEN logging errors THEN the Backend Service SHALL not log sensitive information

### Requirement 10

**User Story:** As a developer, I want the application to perform efficiently with caching and optimization, so that users experience fast load times and smooth interactions.

#### Acceptance Criteria

1. WHEN fetching repeated data THEN the Backend Service SHALL implement caching to reduce redundant API calls
2. WHEN rendering the portfolio table THEN the Frontend Application SHALL use memoization to prevent unnecessary re-renders
3. WHEN processing large datasets THEN the system SHALL implement efficient data transformation algorithms
4. WHEN multiple API requests are needed THEN the Backend Service SHALL execute them in parallel where possible
5. WHEN the application loads THEN the Frontend Application SHALL display initial data within 3 seconds under normal conditions

### Requirement 11

**User Story:** As an investor, I want to see portfolio data structured from an Excel file, so that I can easily import my existing holdings.

#### Acceptance Criteria

1. WHEN the system initializes THEN the Backend Service SHALL read portfolio data from the provided Excel file format
2. WHEN parsing Excel data THEN the Backend Service SHALL extract Particulars, Purchase Price, Quantity, NSE/BSE codes, and Sector information
3. WHEN Excel data is invalid THEN the Backend Service SHALL validate the data and report errors clearly
4. WHEN Excel data is successfully parsed THEN the Backend Service SHALL transform it into the required JSON format
5. WHEN portfolio data is loaded THEN the Frontend Application SHALL display all holdings from the Excel source
