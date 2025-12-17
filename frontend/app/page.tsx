'use client';

import { usePortfolio } from '@/hooks';

export default function Home() {
  const { data, isLoading, error, isRefetching, refresh, lastUpdated } = usePortfolio();

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
              Portfolio Dashboard
            </h1>
            {lastUpdated && (
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                Last updated: {new Date(lastUpdated).toLocaleString()}
              </p>
            )}
          </div>
          <button
            onClick={() => refresh()}
            disabled={isRefetching}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isRefetching ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {isLoading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-zinc-600 dark:text-zinc-400">Loading portfolio...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <h2 className="text-red-800 dark:text-red-400 font-semibold mb-2">Error loading portfolio</h2>
            <p className="text-red-600 dark:text-red-300">{error.message}</p>
          </div>
        )}

        {data && (
          <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-zinc-900 dark:text-zinc-50">
              Holdings ({data.holdings.length})
            </h2>
            
            {data.errors && data.errors.length > 0 && (
              <div className="mb-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                <p className="text-yellow-800 dark:text-yellow-400 text-sm font-medium">
                  {data.errors.length} warning(s):
                </p>
                <ul className="mt-2 space-y-1">
                  {data.errors.map((err, idx) => (
                    <li key={idx} className="text-yellow-700 dark:text-yellow-300 text-sm">
                      {err.source}: {err.message}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-700">
                <thead>
                  <tr className="text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    <th className="px-4 py-3">Stock</th>
                    <th className="px-4 py-3">Sector</th>
                    <th className="px-4 py-3 text-right">CMP</th>
                    <th className="px-4 py-3 text-right">Quantity</th>
                    <th className="px-4 py-3 text-right">Investment</th>
                    <th className="px-4 py-3 text-right">Present Value</th>
                    <th className="px-4 py-3 text-right">Gain/Loss</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
                  {data.holdings.map((holding) => (
                    <tr key={holding.id} className="text-sm">
                      <td className="px-4 py-3 text-zinc-900 dark:text-zinc-100 font-medium">
                        {holding.particulars}
                      </td>
                      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                        {holding.sector}
                      </td>
                      <td className="px-4 py-3 text-right text-zinc-900 dark:text-zinc-100">
                        ₹{holding.cmp.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right text-zinc-900 dark:text-zinc-100">
                        {holding.quantity}
                      </td>
                      <td className="px-4 py-3 text-right text-zinc-900 dark:text-zinc-100">
                        ₹{holding.investment.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-right text-zinc-900 dark:text-zinc-100">
                        ₹{holding.presentValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                      </td>
                      <td className={`px-4 py-3 text-right font-semibold ${
                        holding.gainLoss > 0 
                          ? 'text-green-600 dark:text-green-400' 
                          : holding.gainLoss < 0 
                          ? 'text-red-600 dark:text-red-400' 
                          : 'text-zinc-600 dark:text-zinc-400'
                      }`}>
                        ₹{holding.gainLoss.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                        <span className="text-xs ml-1">
                          ({holding.gainLossPercentage.toFixed(2)}%)
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
