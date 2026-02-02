const API_BASE = '/api';

// Portfolio API
export const fetchPortfolio = async () => {
  const response = await fetch(`${API_BASE}/portfolio`);
  if (!response.ok) throw new Error('Failed to fetch portfolio');
  return response.json();
};

export const addToPortfolio = async (symbol, quantity = 0, purchasePrice = 0) => {
  const response = await fetch(`${API_BASE}/portfolio`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ symbol, quantity, purchasePrice }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to add to portfolio');
  }
  return response.json();
};

export const updatePortfolioItem = async (id, quantity, purchasePrice) => {
  const response = await fetch(`${API_BASE}/portfolio/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ quantity, purchasePrice }),
  });
  if (!response.ok) throw new Error('Failed to update portfolio item');
  return response.json();
};

export const removeFromPortfolio = async (id) => {
  const response = await fetch(`${API_BASE}/portfolio/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to remove from portfolio');
  return response.json();
};

// Watchlist API
export const fetchWatchlist = async () => {
  const response = await fetch(`${API_BASE}/watchlist`);
  if (!response.ok) throw new Error('Failed to fetch watchlist');
  return response.json();
};

export const addToWatchlist = async (symbol, notes = '') => {
  const response = await fetch(`${API_BASE}/watchlist`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ symbol, notes }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to add to watchlist');
  }
  return response.json();
};

export const updateWatchlistItem = async (id, notes) => {
  const response = await fetch(`${API_BASE}/watchlist/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ notes }),
  });
  if (!response.ok) throw new Error('Failed to update watchlist item');
  return response.json();
};

export const removeFromWatchlist = async (id) => {
  const response = await fetch(`${API_BASE}/watchlist/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to remove from watchlist');
  return response.json();
};

// Stock search
export const searchStocks = async (query) => {
  const response = await fetch(`${API_BASE}/stocks/search?q=${encodeURIComponent(query)}`);
  if (!response.ok) throw new Error('Failed to search stocks');
  return response.json();
};

export const getStockData = async (symbol) => {
  const response = await fetch(`${API_BASE}/stocks/${symbol}`);
  if (!response.ok) throw new Error('Failed to fetch stock data');
  return response.json();
};
// Sectors API
export const fetchSectors = async () => {
  const response = await fetch(`${API_BASE}/sectors`);
  if (!response.ok) throw new Error('Failed to fetch sector data');
  return response.json();
};

// Insights API
export const fetchInsights = async () => {
  const response = await fetch(`${API_BASE}/insights`);
  if (!response.ok) throw new Error('Failed to fetch insights');
  return response.json();
};

// Trend Alerts API
export const fetchTrendAlerts = async () => {
  const response = await fetch(`${API_BASE}/trend-alerts`);
  if (!response.ok) throw new Error('Failed to fetch trend alerts');
  return response.json();
};
