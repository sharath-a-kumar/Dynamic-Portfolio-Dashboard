# Portfolio Dashboard Hooks

## usePortfolio

Custom React hook for fetching and managing portfolio data with automatic refresh capabilities.

### Features

- ✅ Automatic refetching every 15 seconds (configurable)
- ✅ Manual refresh functionality
- ✅ Loading and error state management
- ✅ React Query integration for caching and optimization
- ✅ Automatic pause when tab is not visible
- ✅ Exponential backoff retry logic
- ✅ TypeScript support with full type safety

### Basic Usage

```tsx
import { usePortfolio } from '@/hooks';

function PortfolioDashboard() {
  const { data, isLoading, error, refresh } = usePortfolio();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <button onClick={refresh}>Refresh</button>
      <div>Last updated: {data?.lastUpdated}</div>
      {data?.holdings.map(holding => (
        <div key={holding.id}>{holding.particulars}</div>
      ))}
    </div>
  );
}
```

### Advanced Usage

```tsx
import { usePortfolio } from '@/hooks';

function PortfolioDashboard() {
  const { 
    data, 
    isLoading, 
    error, 
    isRefetching,
    isSuccess,
    refresh,
    lastUpdated 
  } = usePortfolio({
    enabled: true, // Enable/disable the hook
    refetchInterval: 15000, // Custom interval in ms
  });

  return (
    <div>
      {isRefetching && <span>Updating...</span>}
      <button onClick={refresh} disabled={isRefetching}>
        {isRefetching ? 'Refreshing...' : 'Refresh'}
      </button>
      {/* Your UI */}
    </div>
  );
}
```

### API Reference

#### Options

```typescript
interface UsePortfolioOptions {
  enabled?: boolean;        // Enable automatic refetching (default: true)
  refetchInterval?: number; // Refetch interval in ms (default: 15000)
}
```

#### Return Value

```typescript
interface UsePortfolioReturn {
  data: PortfolioResponse | undefined;  // Portfolio data
  isLoading: boolean;                   // Initial loading state
  error: Error | null;                  // Error object if failed
  isRefetching: boolean;                // Background refetch state
  isSuccess: boolean;                   // Success state
  isError: boolean;                     // Error state
  refresh: () => Promise<void>;         // Manual refresh function
  lastUpdated: string | undefined;      // Last update timestamp
}
```

### Requirements Satisfied

- **Requirement 4.1**: Automatic refresh every 15 seconds
- **Requirement 4.4**: Manual refresh functionality
- **Requirement 4.5**: Pauses when user navigates away (refetchIntervalInBackground: false)

### Implementation Details

- Uses React Query for data fetching and caching
- Implements exponential backoff for retries (3 attempts)
- Caches data for 5 minutes (gcTime)
- Considers data stale after 10 seconds
- Automatically pauses when browser tab is not visible
- Refetches on window focus and network reconnection
