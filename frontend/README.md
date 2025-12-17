# Portfolio Dashboard Frontend

Next.js frontend application for the Dynamic Portfolio Dashboard.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
   - Copy `.env.example` to `.env.local`
   - Update the API URL if needed

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
frontend/
├── app/
│   ├── layout.tsx        # Root layout
│   ├── page.tsx          # Main dashboard page
│   └── globals.css       # Global styles
├── components/           # React components
│   ├── PortfolioTable.tsx
│   ├── SectorGroup.tsx
│   ├── AutoRefresh.tsx
│   └── ErrorBoundary.tsx
├── hooks/                # Custom React hooks
│   └── usePortfolio.ts
├── lib/                  # Utility functions
└── types/                # TypeScript type definitions
```

## Environment Variables

- `NEXT_PUBLIC_API_URL`: Backend API URL (default: http://localhost:3001)

## Features

- Real-time portfolio tracking with automatic updates every 15 seconds
- Sector-wise grouping of holdings
- Color-coded gain/loss indicators
- Responsive design for desktop, tablet, and mobile
- Live data from Yahoo Finance and Google Finance
