# Deployment Guide

This guide covers deploying the Dynamic Portfolio Dashboard to production environments.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Frontend Deployment (Vercel)](#frontend-deployment-vercel)
- [Backend Deployment (Render)](#backend-deployment-render)
- [Environment Variables](#environment-variables)
- [Post-Deployment Verification](#post-deployment-verification)
- [Troubleshooting](#troubleshooting)

## Prerequisites

Before deploying, ensure you have:

- A GitHub repository with your code
- A Vercel account (free tier available)
- A Render account (free tier available)
- Your portfolio Excel file ready for upload

## Frontend Deployment (Vercel)

### Step 1: Connect Repository

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "Add New Project"
3. Import your GitHub repository
4. Select the repository containing your portfolio dashboard

### Step 2: Configure Project Settings

1. Set the **Root Directory** to `frontend`
2. Vercel will auto-detect Next.js framework
3. Keep the default build settings:
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`

### Step 3: Configure Environment Variables

Add the following environment variable in Vercel's project settings:

| Variable | Value | Description |
|----------|-------|-------------|
| `NEXT_PUBLIC_API_URL` | `https://your-backend.onrender.com` | Your deployed backend URL |

**Important**: Replace `your-backend.onrender.com` with your actual Render backend URL after deploying the backend.

### Step 4: Deploy

1. Click "Deploy"
2. Wait for the build to complete
3. Your frontend will be available at `https://your-project.vercel.app`

### Vercel Configuration (Optional)

Create `frontend/vercel.json` for custom configuration:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs"
}
```

## Backend Deployment (Render)

### Step 1: Create Web Service

1. Go to [render.com](https://render.com) and sign in
2. Click "New" → "Web Service"
3. Connect your GitHub repository
4. Select the repository containing your portfolio dashboard

### Step 2: Configure Service Settings

| Setting | Value |
|---------|-------|
| Name | `portfolio-dashboard-api` |
| Root Directory | `backend` |
| Environment | `Node` |
| Build Command | `npm install` |
| Start Command | `npm start` |
| Plan | Free (or paid for better performance) |

### Step 3: Configure Environment Variables

Add the following environment variables in Render's dashboard:

| Variable | Value | Description |
|----------|-------|-------------|
| `PORT` | `10000` | Render uses port 10000 by default |
| `NODE_ENV` | `production` | Production environment |
| `EXCEL_FILE_PATH` | `./data/portfolio.xlsx` | Path to Excel file |
| `CACHE_TTL_CMP` | `10` | CMP cache TTL in seconds |
| `CACHE_TTL_FINANCIALS` | `3600` | Financial metrics cache TTL |
| `FRONTEND_URL` | `https://your-project.vercel.app` | Your Vercel frontend URL |

### Step 4: Upload Portfolio Data

For the Excel file, you have two options:

**Option A: Include in Repository**
1. Create a `backend/data/` directory
2. Add your Excel file to `backend/data/portfolio.xlsx`
3. Update `EXCEL_FILE_PATH` to `./data/portfolio.xlsx`
4. Commit and push

**Option B: Use Render Disk (Persistent Storage)**
1. In Render dashboard, add a Disk to your service
2. Mount path: `/data`
3. Upload your Excel file to the disk
4. Set `EXCEL_FILE_PATH` to `/data/portfolio.xlsx`

### Step 5: Deploy

1. Click "Create Web Service"
2. Wait for the build and deployment to complete
3. Your backend will be available at `https://your-service.onrender.com`

### Step 6: Update Frontend Environment

After backend deployment, update your Vercel frontend:

1. Go to Vercel project settings
2. Update `NEXT_PUBLIC_API_URL` to your Render backend URL
3. Redeploy the frontend

## Environment Variables

### Complete Reference

#### Frontend Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | Yes | `http://localhost:3001` | Backend API URL |

#### Backend Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `3001` | Server port (Render uses 10000) |
| `NODE_ENV` | No | `development` | Environment mode |
| `EXCEL_FILE_PATH` | Yes | - | Path to portfolio Excel file |
| `CACHE_TTL_CMP` | No | `10` | CMP cache TTL (seconds) |
| `CACHE_TTL_FINANCIALS` | No | `3600` | Financial metrics cache TTL |
| `FRONTEND_URL` | Yes | `http://localhost:3000` | Frontend URL for CORS |

### Production Values Example

**Frontend (.env.production)**
```
NEXT_PUBLIC_API_URL=https://portfolio-dashboard-api.onrender.com
```

**Backend (Render Environment)**
```
PORT=10000
NODE_ENV=production
EXCEL_FILE_PATH=./data/portfolio.xlsx
CACHE_TTL_CMP=10
CACHE_TTL_FINANCIALS=3600
FRONTEND_URL=https://portfolio-dashboard.vercel.app
```

## Post-Deployment Verification

### 1. Backend Health Check

```bash
curl https://your-backend.onrender.com/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "services": {
    "yahooFinance": true,
    "googleFinance": true
  }
}
```

### 2. Portfolio API Check

```bash
curl https://your-backend.onrender.com/api/portfolio
```

Should return portfolio data with holdings.

### 3. Frontend Verification

1. Open your Vercel URL in a browser
2. Verify the portfolio table loads
3. Check that CMP values update (may take a few seconds)
4. Verify sector grouping displays correctly
5. Test the manual refresh button

### 4. CORS Verification

If you see CORS errors in the browser console:
1. Verify `FRONTEND_URL` in backend matches your Vercel URL exactly
2. Ensure the URL includes `https://` protocol
3. Redeploy the backend after updating

## Troubleshooting

### Common Issues

#### Backend Not Starting

**Symptom**: Render shows deployment failed or service crashes

**Solutions**:
1. Check Render logs for error messages
2. Verify `EXCEL_FILE_PATH` points to an existing file
3. Ensure all required environment variables are set
4. Check that `package.json` has correct start script

#### CORS Errors

**Symptom**: Browser console shows "Access-Control-Allow-Origin" errors

**Solutions**:
1. Verify `FRONTEND_URL` matches your Vercel URL exactly
2. Include the protocol (`https://`)
3. Do not include trailing slash
4. Redeploy backend after changes

#### Data Not Loading

**Symptom**: Frontend shows loading state indefinitely

**Solutions**:
1. Check browser Network tab for failed requests
2. Verify `NEXT_PUBLIC_API_URL` is correct
3. Test backend API directly with curl
4. Check Render logs for errors

#### Stale Data

**Symptom**: Prices not updating

**Solutions**:
1. Check if Yahoo Finance is accessible from Render's servers
2. Review cache TTL settings
3. Try manual refresh button
4. Check backend logs for API errors

#### Free Tier Limitations

**Render Free Tier**:
- Service spins down after 15 minutes of inactivity
- First request after spin-down takes 30-60 seconds
- Consider upgrading for production use

**Vercel Free Tier**:
- Suitable for most use cases
- Limited serverless function execution time

### Logs and Monitoring

**Render Logs**:
1. Go to your service in Render dashboard
2. Click "Logs" tab
3. View real-time and historical logs

**Vercel Logs**:
1. Go to your project in Vercel dashboard
2. Click "Deployments"
3. Select a deployment to view build logs
4. Use "Functions" tab for runtime logs

## Security Considerations

1. **Never commit `.env` files** - Use platform environment variables
2. **Use HTTPS** - Both Vercel and Render provide SSL by default
3. **Restrict CORS** - Set `FRONTEND_URL` to your specific domain
4. **Monitor API usage** - Watch for unusual traffic patterns
5. **Keep dependencies updated** - Regularly update npm packages

## Scaling Considerations

For higher traffic or better performance:

1. **Upgrade Render Plan** - Faster cold starts, more resources
2. **Add Caching Layer** - Consider Redis for distributed caching
3. **CDN for Frontend** - Vercel includes CDN by default
4. **Database for Portfolio** - Replace Excel with PostgreSQL for larger portfolios
