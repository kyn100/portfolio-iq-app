import React, { useState, useEffect, useCallback } from 'react';
import StockCard from './StockCard';
import AddStockForm from './AddStockForm';
import SectorDashboard from './SectorDashboard';
import InsightsDashboard from './InsightsDashboard';
import TrendAlertsDashboard from './TrendAlertsDashboard';
import AIWatchlistPanel from './AIWatchlistPanel';
import {
  fetchPortfolio,
  addToPortfolio,
  removeFromPortfolio,
  fetchWatchlist,
  addToWatchlist,
  removeFromWatchlist,
} from '../services/api';

import { supabase } from '../supabase';

const Dashboard = ({ session }) => {
  const [portfolio, setPortfolio] = useState({ items: [], summary: {} });
  const [watchlist, setWatchlist] = useState({ items: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('sectors'); // Default to Market Sectors

  const [lastRefreshed, setLastRefreshed] = useState(Date.now());

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
    setLastRefreshed(Date.now()); // Trigger re-mount of child dashboards
    setRefreshing(false);
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      // App.jsx will detect session change and switch to Auth screen
    } catch (error) {
      console.error('Error logging out:', error);
    }
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
              <p className="text-sm text-gray-500">
                {session?.user?.email ? `${session.user.email} • ` : ''}
                Smart Portfolio Monitor
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 border border-red-200 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sign Out
              </button>

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
        <div className="flex overflow-x-auto mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-1 touch-pan-x scrollbar-hide">
          <button
            onClick={() => setActiveTab('sectors')}
            className={`flex-1 min-w-[140px] flex-shrink-0 py-3 px-4 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2 ${activeTab === 'sectors'
              ? 'bg-blue-600 text-white'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
          >
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Market Sectors
          </button>
          <button
            onClick={() => setActiveTab('trends')}
            className={`flex-1 min-w-[130px] flex-shrink-0 py-3 px-4 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2 ${activeTab === 'trends'
              ? 'bg-purple-600 text-white'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
          >
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            Trend Alerts
          </button>
          <button
            onClick={() => setActiveTab('insights')}
            className={`flex-1 min-w-[120px] flex-shrink-0 py-3 px-4 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2 ${activeTab === 'insights'
              ? 'bg-blue-600 text-white'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
          >
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            Insights
          </button>
          <button
            onClick={() => setActiveTab('watchlist')}
            className={`flex-1 min-w-[120px] flex-shrink-0 py-3 px-4 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2 ${activeTab === 'watchlist'
              ? 'bg-blue-600 text-white'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
          >
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Watchlist ({watchlistItems.length})
          </button>
          <button
            onClick={() => setActiveTab('portfolio')}
            className={`flex-1 min-w-[120px] flex-shrink-0 py-3 px-4 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2 ${activeTab === 'portfolio'
              ? 'bg-blue-600 text-white'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
          >
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Portfolio ({portfolioItems.length})
          </button>
        </div>

        {/* Portfolio Summary (only show on portfolio tab) */}
        {activeTab === 'portfolio' && portfolioItems.length > 0 && summary && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">Portfolio Summary</h2>

            {/* Money In / Money Out Visualization (Premium) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-2">
              {/* Money In Card (Invested) */}
              <div className="bg-gradient-to-br from-slate-50 to-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <svg className="w-24 h-24 text-slate-800" fill="currentColor" viewBox="0 0 24 24"><path d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                </div>
                <div className="relative z-10">
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-slate-400"></span> Money In
                  </p>
                  <h3 className="text-4xl font-bold text-slate-800 tracking-tight">
                    ${summary.totalCost?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </h3>
                  <p className="text-xs text-slate-400 mt-2 font-medium">Principal Invested</p>
                </div>
              </div>

              {/* Money Out Card (Current Value) */}
              <div className={`p-6 rounded-2xl border shadow-sm relative overflow-hidden group transition-all ${summary.totalGainLoss >= 0
                ? 'bg-gradient-to-br from-emerald-50 to-white border-emerald-100'
                : 'bg-gradient-to-br from-rose-50 to-white border-rose-100'
                }`}>
                <div className={`absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity ${summary.totalGainLoss >= 0 ? 'text-emerald-900' : 'text-rose-900'}`}>
                  <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24"><path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>

                <div className="relative z-10">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className={`text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1 ${summary.totalGainLoss >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        <span className={`w-2 h-2 rounded-full ${summary.totalGainLoss >= 0 ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                        Current Value
                      </p>
                      <h3 className={`text-4xl font-bold tracking-tight ${summary.totalGainLoss >= 0 ? 'text-emerald-900' : 'text-rose-900'}`}>
                        ${summary.totalValue?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </h3>
                    </div>
                    <div className={`px-3 py-1.5 rounded-lg text-sm font-bold border ${summary.totalGainLoss >= 0
                      ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                      : 'bg-rose-100 text-rose-700 border-rose-200'
                      }`}>
                      {summary.totalGainLossPercent >= 0 ? '+' : ''}{summary.totalGainLossPercent?.toFixed(2)}%
                    </div>
                  </div>

                  <div className="mt-2 flex items-center gap-2">
                    <span className={`text-sm font-bold ${summary.totalGainLoss >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {summary.totalGainLoss >= 0 ? '+' : ''}${summary.totalGainLoss?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <span className="text-xs text-gray-400 font-medium">Total Return</span>
                  </div>
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
            <AIWatchlistPanel onAdd={(symbol) => handleAddToWatchlist(symbol, 'AI Recommendation')} />
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
          <SectorDashboard key={lastRefreshed} />
        )}

        {/* Insights Tab Content */}
        {activeTab === 'insights' && (
          <InsightsDashboard key={lastRefreshed} />
        )}

        {/* Trend Alerts Tab Content */}
        {activeTab === 'trends' && (
          <TrendAlertsDashboard key={lastRefreshed} />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Main Footer Content */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div>
                <div className="text-white font-semibold">PortfolioIQ</div>
                <div className="text-xs text-slate-500">v2.1 (Macro Edition)</div>
              </div>
            </div>
            <div className="text-sm text-center md:text-right">
              <span className="text-slate-300">Created by</span>{' '}
              <a href="mailto:kuhotech@gmail.com" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
                Kuho Tech, LLC
              </a>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-slate-700 pt-6">
            {/* Legal Disclaimers */}
            <div className="text-xs text-slate-500 space-y-2 text-center">
              <p>
                <strong className="text-slate-400">Disclaimer:</strong> The information provided by PortfolioIQ is for informational and educational purposes only.
                It does not constitute financial advice, investment advice, trading advice, or any other sort of advice.
              </p>
              <p>
                Past performance is not indicative of future results. You should not make any investment decision based solely on the information provided here.
                Always consult with a qualified financial advisor before making investment decisions.
              </p>
              <p className="pt-2 text-slate-600">
                © {new Date().getFullYear()} Kuho Tech, LLC. All rights reserved. |
                Market data provided by Yahoo Finance. AI analysis powered by Google Gemini.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div >
  );
};

export default Dashboard;
