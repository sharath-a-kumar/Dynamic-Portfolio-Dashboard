# Dynamic Portfolio Dashboard

A full-stack web application for tracking stock portfolio performance with real-time data from Yahoo Finance and Google Finance.

## Project Structure

```
portfolio-dashboard/
├── frontend/          # Next.js frontend application (TypeScript)
├── backend/           # Node.js backend service (JavaScript)
├── .kiro/             # Kiro specs and documentation
└── E555815F_58D029050B.xlsx  # Portfolio data file
```

## Quick Start

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Start the development server:
```bash
npm run dev
```

The backend will run on http://localhost:3001

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env.local
# Edit .env.local if needed
```

4. Start the development server:
```bash
npm run dev
```

The frontend will run on http://localhost:3000

## Features

- **Real-time Updates**: Automatic refresh every 15 seconds
- **Live Market Data**: Current Market Price (CMP) from Yahoo Finance
- **Financial Metrics**: P/E Ratio and Latest Earnings from Google Finance
- **Sector Grouping**: Holdings organized by sector with summaries
- **Visual Indicators**: Color-coded gain/loss display
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Performance Optimized**: Caching and efficient data fetching

## Technology Stack

### Frontend
- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS
- React Query
- Axios

### Backend
- Node.js
- Express
- JavaScript (ES Modules)
- Axios
- Cheerio (web scraping)
- XLSX (Excel parsing)
- Node-cache (in-memory caching)

## Environment Variables

### Frontend (.env.local)

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `http://localhost:3001` |

### Backend (.env)

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3001` |
| `EXCEL_FILE_PATH` | Path to portfolio Excel file | `../E555815F_58D029050B.xlsx` |
| `CACHE_TTL_CMP` | Cache TTL for CMP data (seconds) | `10` |
| `CACHE_TTL_FINANCIALS` | Cache TTL for financial metrics (seconds) | `3600` |
| `NODE_ENV` | Environment mode | `development` |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:3000` |

## Development

See individual README files in `frontend/` and `backend/` directories for detailed development instructions.

## Testing

Property-based testing is implemented using fast-check library to ensure correctness of calculations and data transformations.

## License

ISC
