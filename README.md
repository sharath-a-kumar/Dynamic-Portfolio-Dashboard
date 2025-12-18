# Dynamic Portfolio Dashboard

A full-stack web application for tracking stock portfolio performance with real-time data from Yahoo Finance and Google Finance.

## Project Structure

```
portfolio-dashboard/
├── frontend/          # Next.js frontend application (TypeScript)
├── backend/           # Node.js backend service (JavaScript)
├── .kiro/             # Kiro specs and documentation
├── DEPLOYMENT.md      # Production deployment guide
└── E555815F_58D029050B.xlsx  # Portfolio data file
```

## Quick Start

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Portfolio data in Excel format (.xlsx)

### 1. Clone and Install

```bash
# Clone the repository
git clone <repository-url>
cd portfolio-dashboard

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Configure Environment

**Backend Configuration:**
```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:
```env
PORT=3001
EXCEL_FILE_PATH=../E555815F_58D029050B.xlsx
CACHE_TTL_CMP=10
CACHE_TTL_FINANCIALS=3600
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

**Frontend Configuration:**
```bash
cd frontend
cp .env.example .env.local
```

Edit `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### 3. Start Development Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```
Backend runs at http://localhost:3001

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```
Frontend runs at http://localhost:3000

### 4. Verify Setup

1. Open http://localhost:3000 in your browser
2. Portfolio table should load with your holdings
3. CMP values should update automatically every 15 seconds

## Features

- **Real-time Updates**: Automatic refresh every 15 seconds
- **Live Market Data**: Current Market Price (CMP) from Yahoo Finance
- **Financial Metrics**: P/E Ratio and Latest Earnings from Google Finance
- **Sector Grouping**: Holdings organized by sector with summaries
- **Visual Indicators**: Color-coded gain/loss display (green for gains, red for losses)
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Performance Optimized**: Caching and efficient data fetching

## Technology Stack

### Frontend
- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS
- React Query (TanStack Query)
- Axios

### Backend
- Node.js
- Express 5
- JavaScript (ES Modules)
- Axios
- Cheerio (web scraping)
- XLSX (Excel parsing)
- Node-cache (in-memory caching)
- Yahoo Finance 2 (unofficial API)

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check with service status |
| `/api/portfolio` | GET | Get portfolio data with live prices |
| `/api/portfolio/refresh` | GET | Force refresh of live data |

## Environment Variables

### Frontend (.env.local)

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `http://localhost:3001` | Yes |

### Backend (.env)

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `PORT` | Server port | `3001` | No |
| `EXCEL_FILE_PATH` | Path to portfolio Excel file | - | Yes |
| `CACHE_TTL_CMP` | Cache TTL for CMP data (seconds) | `10` | No |
| `CACHE_TTL_FINANCIALS` | Cache TTL for financial metrics (seconds) | `3600` | No |
| `NODE_ENV` | Environment mode | `development` | No |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:3000` | Yes |

## Excel File Format

Your portfolio Excel file should have the following columns:

| Column | Description | Example |
|--------|-------------|---------|
| Particulars | Stock name | "Reliance Industries" |
| Purchase Price | Buy price per share | 2450.50 |
| Qty | Number of shares | 100 |
| NSE/BSE | Stock exchange code | "RELIANCE.NS" |
| Sector | Industry sector | "Energy" |

## Development

See individual README files for detailed instructions:
- [Frontend README](frontend/README.md)
- [Backend README](backend/README.md)

### Running Tests

**Backend Tests:**
```bash
cd backend
npm test
```

**Property-Based Tests:**
The project uses fast-check for property-based testing to ensure correctness of calculations and data transformations.

## Deployment

For production deployment instructions, see [DEPLOYMENT.md](DEPLOYMENT.md).

### Quick Deployment Overview

- **Frontend**: Deploy to Vercel (recommended)
- **Backend**: Deploy to Render (recommended)

Both platforms offer free tiers suitable for personal use.

## Troubleshooting

### Common Issues

**Backend won't start:**
- Verify `EXCEL_FILE_PATH` points to a valid Excel file
- Check that all required environment variables are set

**CORS errors:**
- Ensure `FRONTEND_URL` in backend matches your frontend URL exactly
- Include protocol (http/https) in the URL

**Data not loading:**
- Check backend is running and accessible
- Verify `NEXT_PUBLIC_API_URL` in frontend is correct
- Check browser console for error messages

**Stale prices:**
- Yahoo Finance may have rate limits
- Try manual refresh button
- Check backend logs for API errors

## License

ISC
