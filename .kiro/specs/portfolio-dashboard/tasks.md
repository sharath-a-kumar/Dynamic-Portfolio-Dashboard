# Implementation Plan

> **Note**: Do not create test files during task implementation. Focus only on core functionality implementation. Test files are marked with `*` and are optional.

- [x] 1. Initialize project structure and dependencies






  - Create Next.js project with TypeScript and Tailwind CSS
  - Create Node.js backend project with Express (JavaScript)
  - Install required dependencies (axios, xlsx, cheerio, node-cache, fast-check)
  - Set up project folder structure for both frontend and backend
  - Configure TypeScript for frontend project
  - Set up environment variable files (.env.local for frontend, .env for backend)
  - _Requirements: 9.2, 10.4_

- [x] 2. Implement data models and types








  - Create TypeScript interfaces for frontend (Holding, SectorSummary, ApiError, ExcelRow)
  - Create JavaScript data model factories/validators for backend
  - Create utility types for API responses (frontend)
  - Create validation functions for data models (backend)
  - _Requirements: 1.2, 11.2_

- [x] 3. Implement Excel parsing service





  - Create PortfolioService with loadPortfolioFromExcel method
  - Implement Excel file reading using xlsx library
  - Parse Excel rows into Holding objects
  - Validate Excel data structure and handle errors
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [ ]* 3.1 Write property test for Excel parsing
  - **Property 10: Excel parsing extracts all required fields**
  - **Validates: Requirements 11.2**

- [x] 4. Implement caching service





  - Create CacheService class with get, set, delete, and clear methods
  - Implement TTL-based expiration
  - Add cache statistics for monitoring
  - _Requirements: 2.4, 3.4, 10.1_

- [ ]* 4.1 Write property test for cache behavior
  - **Property 9: Cache reduces redundant API calls**
  - **Validates: Requirements 10.1**

- [x] 5. Implement Yahoo Finance service





  - Create YahooFinanceService class
  - Implement getCurrentPrice method using web scraping or unofficial library
  - Implement getBatchPrices for fetching multiple stocks
  - Add retry logic with exponential backoff
  - Integrate with CacheService (10-second TTL)
  - Handle rate limiting and errors gracefully
  - _Requirements: 2.1, 2.2, 2.4, 2.5, 8.1, 8.4_

- [ ]* 5.1 Write unit tests for Yahoo Finance service
  - Test getCurrentPrice with mock data
  - Test getBatchPrices with multiple symbols
  - Test error handling and retry logic
  - Test cache integration
  - _Requirements: 2.1, 2.2_

- [x] 6. Implement Google Finance service





  - Create GoogleFinanceService class
  - Implement getPERatio method using web scraping
  - Implement getLatestEarnings method
  - Implement getBatchFinancials for multiple stocks
  - Integrate with CacheService (1-hour TTL)
  - Handle missing data and errors gracefully
  - _Requirements: 3.1, 3.2, 3.4, 3.5, 8.2, 8.4_

- [ ]* 6.1 Write unit tests for Google Finance service
  - Test getPERatio with mock data
  - Test getLatestEarnings with mock data
  - Test getBatchFinancials with multiple symbols
  - Test cache integration
  - _Requirements: 3.1, 3.2_

- [x] 7. Implement portfolio calculation logic





  - Create calculateMetrics method in PortfolioService
  - Implement Investment calculation (Purchase Price × Quantity)
  - Implement Present Value calculation (CMP × Quantity)
  - Implement Gain/Loss calculation (Present Value - Investment)
  - Implement Gain/Loss percentage calculation
  - Implement Portfolio percentage calculation
  - _Requirements: 1.3, 1.4, 1.5, 4.2, 4.3_

- [ ]* 7.1 Write property test for calculation correctness
  - **Property 3: Calculated fields are mathematically correct**
  - **Validates: Requirements 1.3, 1.5, 4.3**

- [ ]* 7.2 Write property test for portfolio percentages
  - **Property 4: Portfolio percentages sum to 100%**
  - **Validates: Requirements 1.4**

- [x] 8. Implement sector grouping and aggregation





  - Create groupBySector method in PortfolioService
  - Create calculateSectorSummary method
  - Implement Total Investment aggregation per sector
  - Implement Total Present Value aggregation per sector
  - Implement Gain/Loss aggregation per sector
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ]* 8.1 Write property test for sector aggregation
  - **Property 8: Sector summaries are correctly aggregated**
  - **Validates: Requirements 6.3, 6.4, 6.5**

- [x] 9. Implement data enrichment orchestration





  - Create enrichWithLiveData method in PortfolioService
  - Orchestrate parallel fetching of CMP data from Yahoo Finance
  - Orchestrate parallel fetching of financial metrics from Google Finance
  - Merge live data with portfolio holdings
  - Handle partial failures and return available data
  - _Requirements: 2.1, 2.5, 3.1, 10.4_

- [ ]* 9.1 Write integration tests for data enrichment
  - Test complete flow from Excel to enriched holdings
  - Test parallel API calls
  - Test error handling with partial failures
  - _Requirements: 2.1, 3.1_

- [x] 10. Implement backend API endpoints





  - Set up Express server with TypeScript
  - Create GET /api/portfolio endpoint
  - Create GET /api/portfolio/refresh endpoint
  - Create GET /api/health endpoint
  - Add error handling middleware
  - Add request logging
  - Enable CORS with proper configuration
  - _Requirements: 9.3, 10.4_

- [ ]* 10.1 Write unit tests for API endpoints
  - Test /api/portfolio returns correct data structure
  - Test /api/portfolio/refresh triggers data update
  - Test /api/health returns service status
  - Test error responses
  - _Requirements: 8.1, 8.2, 8.3_

- [ ] 11. Checkpoint - Ensure backend tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 12. Create frontend data fetching hooks



  - Create usePortfolio hook using React Query
  - Implement automatic refetching every 15 seconds
  - Add manual refresh functionality
  - Handle loading and error states
  - _Requirements: 4.1, 4.4_

- [ ]* 12.1 Write property test for data fetching
  - **Property 5: CMP data is fetched for all holdings**
  - **Validates: Requirements 2.1**

- [ ] 13. Implement PortfolioTable component
  - Create table structure with all required columns
  - Implement responsive table layout with Tailwind CSS
  - Add loading skeleton for better UX
  - Add empty state handling
  - _Requirements: 1.1, 1.2, 7.1, 7.2, 7.3_

- [ ]* 13.1 Write property test for table rendering
  - **Property 1: All holdings are rendered**
  - **Validates: Requirements 1.1**

- [ ]* 13.2 Write property test for column presence
  - **Property 2: All required columns are present**
  - **Validates: Requirements 1.2**

- [ ] 14. Implement Gain/Loss color coding
  - Create utility function for determining color based on value
  - Apply green color for positive Gain/Loss
  - Apply red color for negative Gain/Loss
  - Apply neutral color for zero Gain/Loss
  - Ensure sufficient contrast for accessibility
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ]* 14.1 Write property test for color coding
  - **Property 7: Gain/Loss color coding is correct**
  - **Validates: Requirements 5.1, 5.2, 5.3**

- [ ] 15. Implement SectorGroup component
  - Create sector header with sector name
  - Display holdings within each sector
  - Create sector summary section
  - Display Total Investment, Total Present Value, and Gain/Loss for sector
  - Apply color coding to sector Gain/Loss
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 16. Implement main Dashboard page
  - Create Next.js page component
  - Integrate usePortfolio hook
  - Render portfolio grouped by sectors
  - Add page header with last updated timestamp
  - Add manual refresh button
  - _Requirements: 1.1, 6.1_

- [ ] 17. Implement AutoRefresh component
  - Create component with configurable interval
  - Set up interval timer for 15-second refresh
  - Clean up timer on component unmount
  - Pause refresh when user navigates away (use Page Visibility API)
  - Add visual indicator for auto-refresh status
  - _Requirements: 4.1, 4.4, 4.5_

- [ ] 18. Implement error handling UI
  - Create ErrorBoundary component for React errors
  - Create error toast notification component
  - Display specific error messages for Yahoo Finance failures
  - Display specific error messages for Google Finance failures
  - Display network connectivity error messages
  - Add retry functionality for failed requests
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 19. Implement responsive design
  - Optimize table layout for desktop screens
  - Create responsive layout for tablet screens
  - Create mobile-friendly layout with horizontal scroll or card view
  - Test layout on different viewport sizes
  - Ensure touch-friendly interactions on mobile
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ]* 19.1 Write integration tests for responsive behavior
  - Test layout rendering at different viewport sizes
  - Test mobile card view if implemented
  - _Requirements: 7.1, 7.2, 7.3_

- [ ] 20. Implement UI updates for live data
  - Ensure CMP updates trigger table re-render
  - Ensure Present Value recalculates when CMP updates
  - Ensure Gain/Loss recalculates when Present Value updates
  - Add smooth transition animations for value changes
  - _Requirements: 2.3, 4.2, 4.3, 4.4_

- [ ]* 20.1 Write property test for UI updates
  - **Property 6: UI updates reflect data changes**
  - **Validates: Requirements 2.3, 3.3**

- [ ] 21. Add performance optimizations
  - Apply React.memo to PortfolioTable component
  - Apply React.memo to SectorGroup component
  - Use useMemo for expensive calculations (sector summaries, aggregations)
  - Use useCallback for event handlers
  - Implement virtual scrolling if portfolio has >100 holdings
  - _Requirements: 10.2, 10.3_

- [ ]* 21.1 Write performance tests
  - Test rendering performance with large portfolios (100+ holdings)
  - Test memoization effectiveness
  - _Requirements: 10.2, 10.3_

- [ ] 22. Add loading states and skeletons
  - Create skeleton loader for portfolio table
  - Show loading indicator during data fetch
  - Show loading indicator during refresh
  - Ensure smooth transition from loading to loaded state
  - _Requirements: 10.5_

- [ ] 23. Configure environment variables
  - Set up frontend environment variables (API URL)
  - Set up backend environment variables (PORT, Excel path, cache TTLs)
  - Create .env.example files for both projects
  - Document all environment variables
  - _Requirements: 9.1, 9.2_

- [ ] 24. Add logging and monitoring
  - Add request logging in backend
  - Log API errors with details
  - Log cache hit/miss statistics
  - Add health check endpoint monitoring
  - Ensure no sensitive data in logs
  - _Requirements: 9.5_

- [ ] 25. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ]* 26. Write end-to-end tests (optional)
  - Test complete user workflow from page load to data display
  - Test automatic refresh functionality
  - Test manual refresh functionality
  - Test error recovery scenarios
  - _Requirements: 4.1, 4.4, 8.5_

- [ ]* 27. Create deployment documentation
  - Document frontend deployment steps (Vercel)
  - Document backend deployment steps
  - Document environment variable configuration
  - Create README with setup instructions
  - _Requirements: 9.2_
