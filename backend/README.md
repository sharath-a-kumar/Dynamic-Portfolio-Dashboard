# Portfolio Dashboard Backend

Node.js backend service for the Dynamic Portfolio Dashboard application.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
   - Copy `.env.example` to `.env`
   - Update the values as needed

3. Run the development server:
```bash
npm run dev
```

4. Run the production server:
```bash
npm start
```

## Project Structure

```
backend/
├── src/
│   ├── index.js          # Main application entry point
│   ├── models/           # Data models
│   ├── services/         # Business logic services
│   │   ├── YahooFinanceService.js
│   │   ├── GoogleFinanceService.js
│   │   ├── PortfolioService.js
│   │   └── CacheService.js
│   ├── routes/           # API routes
│   └── utils/            # Utility functions
├── .env                  # Environment variables (not in git)
├── .env.example          # Example environment variables
└── package.json
```

## Environment Variables

- `PORT`: Server port (default: 3001)
- `EXCEL_FILE_PATH`: Path to the portfolio Excel file
- `CACHE_TTL_CMP`: Cache TTL for CMP data in seconds (default: 10)
- `CACHE_TTL_FINANCIALS`: Cache TTL for financial metrics in seconds (default: 3600)
- `NODE_ENV`: Environment (development/production)

## API Endpoints

- `GET /api/health` - Health check endpoint
- `GET /api/portfolio` - Get portfolio data with live prices
- `GET /api/portfolio/refresh` - Trigger manual refresh of live data
