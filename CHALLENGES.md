# Development Challenges

## 1. Slow Initial Load (30-60 seconds)

**Problem**: First request after deployment takes forever.

**Root Causes**:
- Render free tier spins down after 15 minutes of inactivity
- Cold start takes 30-60 seconds just to wake up the server
- Yahoo Finance batch API (`/v7/finance/quote`) started returning 401 errors
- Fallback to individual requests was slow (100ms delay between each)
- Had to fetch 20+ stock symbols sequentially

**Solutions**:
- Removed broken batch API, switched to parallel requests with higher concurrency (10 instead of 5)
- Reduced delays between requests (50ms instead of 200ms)
- Increased cache TTL (120s instead of 60s) to reduce API calls
- Added full-screen loading experience with progress indicator and tips to keep users engaged
- Added skeleton loaders for subsequent loads

## 2. Yahoo Finance API Changes

**Problem**: The batch quote endpoint suddenly required authentication.

**What Happened**:
- Used to work: `https://query1.finance.yahoo.com/v7/finance/quote?symbols=...`
- Now returns: 401 Unauthorized
- No official documentation or warning

**Solution**:
- Switched to chart API (`/v8/finance/chart/{symbol}`) which still works
- Fetch multiple symbols in parallel instead of batch
- Works fine, just need to manage concurrency

## 3. Rate Limiting

**Problem**: Yahoo Finance blocks you if you make too many requests too fast.

**Solution**:
- Added rate limit detection (429 errors)
- Implemented 30-second backoff when rate limited
- Return cached data when rate limited instead of failing
- Increased cache TTL to reduce API calls

## 4. Hydration Mismatch in Loading Screen

**Problem**: React complained about server/client mismatch.

**Cause**: Used `Math.random()` to pick random tips, which generates different values on server vs client.

**Solution**:
- Only render loading screen on client side (added `mounted` state)
- Use `useState(() => Math.random())` instead of `useMemo`

## 5. Excel Parsing Errors Showing as "System Warning"

**Problem**: Minor Excel row errors showed up as scary "System Warning" toasts.

**Cause**: Parse errors didn't have a `source` field, so frontend couldn't categorize them.

**Solution**:
- Added `source: 'excel'` to all parse errors
- Filter out minor row-level errors (don't show as toasts)
- Only show significant errors that affect the whole portfolio

## 6. Google Finance Scraping Too Slow

**Problem**: Scraping P/E ratios from Google Finance added 5-10 seconds to load time.

**Solution**:
- Disabled Google Finance scraping entirely
- Read P/E ratio and earnings directly from Excel file
- Much faster, data is already there

## Lessons Learned

1. **Free hosting has trade-offs**: Cold starts are unavoidable on free tiers. Either pay for always-on hosting or make the loading experience pleasant.

2. **Cache aggressively**: With rate limits and slow APIs, caching is essential. 2 minutes is fine for stock prices.

3. **Parallel > Sequential**: Fetching 20 stocks in parallel (10 at a time) is way faster than one by one.

4. **User experience matters**: A 30-second load is acceptable if you show progress and keep users engaged. A blank screen is not.

5. **APIs change without notice**: Always have fallbacks. Yahoo Finance broke their batch API with no warning.

6. **Don't over-engineer**: We disabled Google Finance scraping because the data was already in Excel. Sometimes the simple solution is best.
