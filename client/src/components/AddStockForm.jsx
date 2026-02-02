import React, { useState } from 'react';
import { searchStocks } from '../services/api';

const AddStockForm = ({ onAddToPortfolio, onAddToWatchlist, onCancel }) => {
  const [symbol, setSymbol] = useState('');
  const [quantity, setQuantity] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [notes, setNotes] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedStock, setSelectedStock] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searching, setSearching] = useState(false);
  const [mode, setMode] = useState('portfolio'); // 'portfolio' or 'watchlist'

  const handleSearch = async (query) => {
    setSymbol(query);
    setSelectedStock(null);

    if (query.length < 1) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const results = await searchStocks(query);
      setSearchResults(results);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setSearching(false);
    }
  };

  const handleSelectStock = (stock) => {
    setSelectedStock(stock);
    setSymbol(stock.symbol);
    setSearchResults([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!symbol) {
      setError('Please enter a stock symbol');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (mode === 'portfolio') {
        await onAddToPortfolio(
          symbol.toUpperCase(),
          parseFloat(quantity) || 0,
          parseFloat(purchasePrice) || 0
        );
      } else {
        await onAddToWatchlist(symbol.toUpperCase(), notes);
      }
      setSymbol('');
      setQuantity('');
      setPurchasePrice('');
      setNotes('');
      setSelectedStock(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Add Stock</h2>

      {/* Mode Toggle */}
      <div className="flex mb-4 bg-gray-100 rounded-lg p-1">
        <button
          type="button"
          onClick={() => setMode('portfolio')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            mode === 'portfolio'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Portfolio
        </button>
        <button
          type="button"
          onClick={() => setMode('watchlist')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            mode === 'watchlist'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Watchlist
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Symbol Search */}
        <div className="mb-4 relative">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Stock Symbol
          </label>
          <input
            type="text"
            value={symbol}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search by symbol or name..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />

          {/* Search Results Dropdown */}
          {searchResults.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {searchResults.map((stock) => (
                <button
                  key={stock.symbol}
                  type="button"
                  onClick={() => handleSelectStock(stock)}
                  className="w-full px-3 py-2 text-left hover:bg-gray-50 flex justify-between items-center"
                >
                  <div>
                    <span className="font-medium">{stock.symbol}</span>
                    <span className="text-gray-500 text-sm ml-2">{stock.name}</span>
                  </div>
                  <span className="text-xs text-gray-400">{stock.type}</span>
                </button>
              ))}
            </div>
          )}

          {searching && (
            <div className="absolute right-3 top-8">
              <svg className="animate-spin h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          )}
        </div>

        {/* Selected Stock Info */}
        {selectedStock && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg">
            <div className="font-medium">{selectedStock.symbol}</div>
            <div className="text-sm text-gray-600">{selectedStock.name}</div>
            <div className="text-xs text-gray-500">{selectedStock.type} - {selectedStock.exchange}</div>
          </div>
        )}

        {/* Portfolio-specific fields */}
        {mode === 'portfolio' && (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quantity (optional)
              </label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="Number of shares"
                min="0"
                step="any"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Average Purchase Price (optional)
              </label>
              <input
                type="number"
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(e.target.value)}
                placeholder="Price per share"
                min="0"
                step="any"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </>
        )}

        {/* Watchlist-specific fields */}
        {mode === 'watchlist' && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Why are you watching this stock?"
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading || !symbol}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Adding...' : mode === 'portfolio' ? 'Add to Portfolio' : 'Add to Watchlist'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddStockForm;
