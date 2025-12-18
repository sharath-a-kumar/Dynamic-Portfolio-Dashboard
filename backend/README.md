# Portfolio Dashboard Backend

Node.js backend service for the Dynamic Portfolio Dashboard application.

## Setup

### Development

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
```bash
cp .env.example .env
```

3. Edit `.env`:
```env
PORT=3001
EXCEL_FILE_PATH=../E555815F_58D029050B.xlsx
CACHE_TTL_CMP=10
CACHE_TTL_FINANCIALS=3600
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

4. Run the development server:
```bash
npm run dev
```

5. Run the production server:
```bash
npm start
```

## Project Structure

```
backend/
├── src/
│   ├── index.js              # Main application entry point
│   ├── models/               # Data models and validators
│   │   ├── Holding.js
│   │   ├── SectorSummary.js
│   │   ├── ApiError.js
│   │   └── ExcelRow.js
│   ├── services/             # Business logic services
│   │   ├── YahooFinanceService.js   # CMP data fetching
│   │   ├── GoogleFinanceService.js  # P/E and earnings data
│   │   ├── PortfolioService.js      # Portfolio orchestration
│   │   └── CacheService.js          # In-memory caching
│   ├── routes/               # API route handlers
│   ├── middleware/           # Express middleware
│   │   ├── errorHandler.js
│   │   └── requestLogger.js
│   └── utils/                # Utility functions
│       ├── bseToNseMapping.js
│       └── portfolioCalculations.js
├── .env                      # Environment variables (not in git)
├── .env.example              # Example environment variables
└── package.json
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with nodemon |
| `npm start` | Start production server |
| `npm test` | Run Jest tests |

## Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `PORT` | Server port number | `3001` | No |
| `EXCEL_FILE_PATH` | Path to the portfolio Excel file | - | Yes |
| `CACHE_TTL_CMP` | Cache TTL for CMP data (seconds) | `10` | No |
| `CACHE_TTL_FINANCIALS` | Cache TTL for financial metrics (seconds) | `3600` | No |
| `NODE_ENV` | Environment mode | `development` | No |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:3000` | Yes |

### Configuration Notes

- **CACHE_TTL_CMP**: Set to 10 seconds to balance real-time updates with API rate limiting
- **CACHE_TTL_FINANCIALS**: Set to 1 hour (3600 seconds) since P/E ratios and earnings change less frequently
- **EXCEL_FILE_PATH**: Supports relative paths from the backend directory
- **FRONTEND_URL**: Used for CORS configuration to allow frontend requests

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check with service status |
| `/api/portfolio` | GET | Get portfolio data with live prices |
| `/api/portfolio/refresh` | GET | Force refresh of live data |

### Response Examples

**GET /api/health**
```json
{
  "status": "healthy",
  "services": {
    "yahooFinance": true,
    "googleFinance": true
  }
}
```

**GET /api/portfolio**
```json
{
  "holdings": [...],
  "lastUpdated": "2024-01-15T10:30:00.000Z",
  "errors": []
}
```

## Deployment (Render)

### Quick Deploy

1. Push your code to GitHub
2. Go to [render.com](https://render.com) and create a new Web Service
3. Connect your repository
4. Configure:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. Add environment variables (see below)
6. Deploy

### Production Environment Variables

```env
PORT=10000
NODE_ENV=production
EXCEL_FILE_PATH=./data/portfolio.xlsx
CACHE_TTL_CMP=10
CACHE_TTL_FINANCIALS=3600
FRONTEND_URL=https://your-frontend.vercel.app
```

### Portfolio Data in Production

**Option 1: Include in Repository**
- Create `backend/data/` directory
- Add your Excel file as `portfolio.xlsx`
- Set `EXCEL_FILE_PATH=./data/portfolio.xlsx`

**Option 2: Render Disk (Persistent Storage)**
- Add a Disk to your Render service
- Mount path: `/data`
- Upload Excel file to disk
- Set `EXCEL_FILE_PATH=/data/portfolio.xlsx`

For detailed deployment instructions, see [DEPLOYMENT.md](../DEPLOYMENT.md) in the project root.

## Services Overview

### YahooFinanceService
Fetches real-time stock prices (CMP) using the yahoo-finance2 library with web scraping fallback.

### GoogleFinanceService
Scrapes P/E ratios and latest earnings data from Google Finance using Cheerio.

### PortfolioService
Orchestrates data loading from Excel, enrichment with live data, and calculation of metrics.

### CacheService
In-memory caching using node-cache to reduce redundant API calls and improve performance.
