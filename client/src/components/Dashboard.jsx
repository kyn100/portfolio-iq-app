import React, { useState, useEffect, useCallback } from 'react';
import StockCard from './StockCard';
import AddStockForm from './AddStockForm';
import SectorDashboard from './SectorDashboard';
import InsightsDashboard from './InsightsDashboard';
import TrendAlertsDashboard from './TrendAlertsDashboard';
import {
  fetchPortfolio,
  addToPortfolio,
  removeFromPortfolio,
  fetchWatchlist,
  addToWatchlist,
  removeFromWatchlist,
} from '../services/api';

const Dashboard = () => {
  const [portfolio, setPortfolio] = useState({ items: [], summary: {} });
  const [watchlist, setWatchlist] = useState({ items: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('portfolio'); // 'portfolio' or 'watchlist'

  const loadData = useCallback(async () => {
    try {
      setError(null);
      const [portfolioData, watchlistData] = await Promise.all([
        fetchPortfolio(),
        fetchWatchlist(),
      ]);
      setPortfolio(portfolioData);
      setWatchlist(watchlistData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleAddToPortfolio = async (symbol, quantity, purchasePrice) => {
    await addToPortfolio(symbol, quantity, purchasePrice);
    await loadData();
    setShowAddForm(false);
  };

  const handleAddToWatchlist = async (symbol, notes) => {
    await addToWatchlist(symbol, notes);
    await loadData();
    setShowAddForm(false);
  };

  const handleRemoveFromPortfolio = async (id) => {
    if (window.confirm('Are you sure you want to remove this stock from your portfolio?')) {
      await removeFromPortfolio(id);
      await loadData();
    }
  };

  const handleRemoveFromWatchlist = async (id) => {
    if (window.confirm('Are you sure you want to remove this stock from your watchlist?')) {
      await removeFromWatchlist(id);
      await loadData();
    }
  };

  const { summary, items: portfolioItems } = portfolio;
  const { items: watchlistItems } = watchlist;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">PortfolioIQ</h1>
              <p className="text-sm text-gray-500">Smart Portfolio Monitor with Technical Analysis</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleRefresh}
                disabled={refreshing || loading}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                <svg
                  className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Refresh
              </button>
              <button
                onClick={() => setShowAddForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Stock
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Tabs */}
        <div className="flex mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-1">
          <button
            onClick={() => setActiveTab('portfolio')}
            className={`flex-1 py-3 px-4 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2 ${activeTab === 'portfolio'
              ? 'bg-blue-600 text-white'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Portfolio ({portfolioItems.length})
          </button>
          <button
            onClick={() => setActiveTab('watchlist')}
            className={`flex-1 py-3 px-4 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2 ${activeTab === 'watchlist'
              ? 'bg-blue-600 text-white'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Watchlist ({watchlistItems.length})
          </button>
          <button
            onClick={() => setActiveTab('sectors')}
            className={`flex-1 py-3 px-4 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2 ${activeTab === 'sectors'
              ? 'bg-blue-600 text-white'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Market Sectors
          </button>
          <button
            onClick={() => setActiveTab('trends')}
            className={`flex-1 py-3 px-4 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2 ${activeTab === 'trends'
              ? 'bg-purple-600 text-white'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            Trend Alerts
          </button>
          <button
            onClick={() => setActiveTab('insights')}
            className={`flex-1 py-3 px-4 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2 ${activeTab === 'insights'
              ? 'bg-blue-600 text-white'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            Insights
          </button>
        </div>

        {/* Portfolio Summary (only show on portfolio tab) */}
        {activeTab === 'portfolio' && portfolioItems.length > 0 && summary && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">Portfolio Summary</h2>

            {/* Money In / Money Out Visualization */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Money In vs Out</span>
                <span className={`text-lg font-bold ${summary.totalGainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {summary.totalCost > 0 ? (summary.totalValue / summary.totalCost).toFixed(2) : '0.00'}x
                </span>
              </div>
              <div className="relative h-8 bg-gray-200 rounded-full overflow-hidden">
                {/* Money In (Cost) - Base bar */}
                <div className="absolute inset-0 flex items-center">
                  <div
                    className="h-full bg-blue-500 flex items-center justify-end pr-2"
                    style={{
                      width: summary.totalGainLoss >= 0
                        ? `${Math.min(100, (summary.totalCost / summary.totalValue) * 100)}%`
                        : '100%'
                    }}
                  >
                    <span className="text-xs font-medium text-white whitespace-nowrap">
                      In: ${summary.totalCost?.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                </div>
                {/* Gain portion - Green overlay */}
                {summary.totalGainLoss > 0 && (
                  <div
                    className="absolute right-0 top-0 h-full bg-green-500 flex items-center justify-center"
                    style={{ width: `${Math.min(50, (summary.totalGainLoss / summary.totalValue) * 100)}%` }}
                  >
                    <span className="text-xs font-medium text-white whitespace-nowrap">
                      +${summary.totalGainLoss?.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                )}
                {/* Loss portion - Red showing shrinkage */}
                {summary.totalGainLoss < 0 && (
                  <div
                    className="absolute right-0 top-0 h-full bg-red-400 flex items-center justify-center"
                    style={{ width: `${Math.min(50, Math.abs(summary.totalGainLoss / summary.totalCost) * 100)}%` }}
                  >
                    <span className="text-xs font-medium text-white whitespace-nowrap">
                      -${Math.abs(summary.totalGainLoss)?.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex justify-between mt-2 text-xs text-gray-500">
                <span>Invested: ${summary.totalCost?.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                <span>Current: ${summary.totalValue?.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-gray-500">Total Value</div>
                <div className="text-2xl font-bold text-gray-900">
                  ${summary.totalValue?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Total Cost</div>
                <div className="text-2xl font-bold text-gray-900">
                  ${summary.totalCost?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Total Gain/Loss</div>
                <div className={`text-2xl font-bold ${summary.totalGainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {summary.totalGainLoss >= 0 ? '+' : ''}${summary.totalGainLoss?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Return</div>
                <div className={`text-2xl font-bold ${summary.totalGainLossPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {summary.totalGainLossPercent >= 0 ? '+' : ''}{summary.totalGainLossPercent?.toFixed(2)}%
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add Stock Form Modal */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="max-w-md w-full">
              <AddStockForm
                onAddToPortfolio={handleAddToPortfolio}
                onAddToWatchlist={handleAddToWatchlist}
                onCancel={() => setShowAddForm(false)}
              />
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && !refreshing && (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-3 text-gray-500">
              <svg className="animate-spin h-8 w-8" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span>Loading data...</span>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6">
            <div className="flex items-center gap-3 text-red-700">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Portfolio Tab Content */}
        {activeTab === 'portfolio' && !loading && (
          <>
            {portfolioItems.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Your portfolio is empty</h3>
                <p className="text-gray-500 mb-6">Add stocks or ETFs to track your investments with detailed analysis</p>
                <button
                  onClick={() => setShowAddForm(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Your First Stock
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {portfolioItems.map((stock) => (
                  <StockCard
                    key={stock.id}
                    stock={stock}
                    onRemove={handleRemoveFromPortfolio}
                    isWatchlist={false}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* Watchlist Tab Content */}
        {activeTab === 'watchlist' && !loading && (
          <>
            {watchlistItems.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Your watchlist is empty</h3>
                <p className="text-gray-500 mb-6">Add stocks or ETFs you want to monitor without tracking positions</p>
                <button
                  onClick={() => setShowAddForm(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add to Watchlist
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {watchlistItems.map((stock) => (
                  <StockCard
                    key={stock.id}
                    stock={stock}
                    onRemove={handleRemoveFromWatchlist}
                    isWatchlist={true}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* Sectors Tab Content */}
        {activeTab === 'sectors' && (
          <SectorDashboard />
        )}

        {/* Insights Tab Content */}
        {activeTab === 'insights' && (
          <InsightsDashboard />
        )}

        {/* Trend Alerts Tab Content */}
        {activeTab === 'trends' && (
          <TrendAlertsDashboard />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-center text-sm text-gray-500">
            PortfolioIQ - Technical analysis is for informational purposes only. Not financial advice.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;
