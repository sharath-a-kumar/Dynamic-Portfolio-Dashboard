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

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `PORT` | Server port number | `3001` | No |
| `EXCEL_FILE_PATH` | Path to the portfolio Excel file (relative to backend directory) | `../E555815F_58D029050B.xlsx` | Yes |
| `CACHE_TTL_CMP` | Cache TTL for CMP (Current Market Price) data in seconds | `10` | No |
| `CACHE_TTL_FINANCIALS` | Cache TTL for financial metrics (P/E Ratio, Earnings) in seconds | `3600` | No |
| `NODE_ENV` | Environment mode (`development` or `production`) | `development` | No |
| `FRONTEND_URL` | Frontend URL for CORS configuration | `http://localhost:3000` | No |

### Configuration Notes

- **CACHE_TTL_CMP**: Set to 10 seconds by default to balance real-time updates with API rate limiting
- **CACHE_TTL_FINANCIALS**: Set to 1 hour (3600 seconds) since P/E ratios and earnings change less frequently
- **EXCEL_FILE_PATH**: Supports relative paths from the backend directory
- **FRONTEND_URL**: Used for CORS configuration to allow frontend requests

## API Endpoints

- `GET /api/health` - Health check endpoint
- `GET /api/portfolio` - Get portfolio data with live prices
- `GET /api/portfolio/refresh` - Trigger manual refresh of live data
