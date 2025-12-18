# Portfolio Dashboard Frontend

Next.js frontend application for the Dynamic Portfolio Dashboard.

## Setup

### Development

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
```bash
cp .env.example .env.local
```

3. Edit `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
frontend/
├── app/
│   ├── layout.tsx        # Root layout with providers
│   ├── page.tsx          # Main dashboard page
│   └── globals.css       # Global styles (Tailwind)
├── components/           # React components
│   ├── PortfolioTable.tsx    # Main holdings table
│   ├── SectorGroup.tsx       # Sector grouping component
│   ├── AutoRefresh.tsx       # Auto-refresh controller
│   ├── AnimatedValue.tsx     # Value transition animations
│   ├── ErrorBoundary.tsx     # Error handling wrapper
│   ├── LoadingIndicator.tsx  # Loading states
│   └── Toast.tsx             # Notification toasts
├── hooks/                # Custom React hooks
│   ├── usePortfolio.ts       # Portfolio data fetching
│   ├── useErrorHandler.ts    # Error handling
│   └── useValueTransition.ts # Animation hooks
├── lib/                  # Utility functions
│   ├── api.ts               # API client
│   └── providers.tsx        # React Query provider
├── types/                # TypeScript type definitions
│   └── index.ts
└── utils/                # Helper utilities
    ├── errorUtils.ts
    └── gainLossColors.ts
```

## Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `NEXT_PUBLIC_API_URL` | Backend API URL for fetching portfolio data | `http://localhost:3001` | Yes |

### Configuration Notes

- **NEXT_PUBLIC_API_URL**: Must include the protocol (http/https) and port number
- Variables prefixed with `NEXT_PUBLIC_` are exposed to the browser
- For production, update this to your deployed backend URL

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |

## Features

- Real-time portfolio tracking with automatic updates every 15 seconds
- Sector-wise grouping of holdings with summaries
- Color-coded gain/loss indicators (green/red)
- Responsive design for desktop, tablet, and mobile
- Live data from Yahoo Finance and Google Finance
- Smooth value transition animations
- Error handling with user-friendly messages

## Deployment (Vercel)

### Quick Deploy

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) and import your repository
3. Set **Root Directory** to `frontend`
4. Add environment variable:
   - `NEXT_PUBLIC_API_URL` = your backend URL
5. Deploy

### Manual Configuration

Create `vercel.json` in the frontend directory:
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs"
}
```

### Production Environment

Create `.env.production`:
```env
NEXT_PUBLIC_API_URL=https://your-backend.onrender.com
```

For detailed deployment instructions, see [DEPLOYMENT.md](../DEPLOYMENT.md) in the project root.
