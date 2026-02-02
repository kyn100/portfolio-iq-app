// In-memory database for Vercel serverless
// Note: Data resets when functions spin down
// For persistent storage, use Vercel Postgres, Planetscale, or similar

let portfolio = [
  { id: 1, symbol: 'AAPL', quantity: 10, purchase_price: 150 },
  { id: 2, symbol: 'MSFT', quantity: 5, purchase_price: 300 },
  { id: 3, symbol: 'NVDA', quantity: 8, purchase_price: 400 },
];

let watchlist = [
  { id: 1, symbol: 'GOOGL' },
  { id: 2, symbol: 'TSLA' },
  { id: 3, symbol: 'AMD' },
];

let portfolioIdCounter = 4;
let watchlistIdCounter = 4;

// Portfolio functions
export const getPortfolio = () => {
  return portfolio;
};

export const getPortfolioItem = (id) => {
  return portfolio.find(item => item.id === id);
};

export const getPortfolioItemBySymbol = (symbol) => {
  return portfolio.find(item => item.symbol === symbol.toUpperCase());
};

export const addToPortfolio = (symbol, quantity, purchasePrice) => {
  const newItem = {
    id: portfolioIdCounter++,
    symbol: symbol.toUpperCase(),
    quantity,
    purchase_price: purchasePrice,
    created_at: new Date().toISOString()
  };
  portfolio.push(newItem);
  return newItem;
};

export const updatePortfolioItem = (id, quantity, purchasePrice) => {
  const item = portfolio.find(i => i.id === id);
  if (item) {
    item.quantity = quantity;
    item.purchase_price = purchasePrice;
    item.updated_at = new Date().toISOString();
  }
  return item;
};

export const removeFromPortfolio = (id) => {
  const index = portfolio.findIndex(i => i.id === id);
  if (index !== -1) {
    return portfolio.splice(index, 1)[0];
  }
  return null;
};

// Watchlist functions
export const getWatchlist = () => {
  return watchlist;
};

export const getWatchlistItem = (id) => {
  return watchlist.find(item => item.id === id);
};

export const getWatchlistItemBySymbol = (symbol) => {
  return watchlist.find(item => item.symbol === symbol.toUpperCase());
};

export const addToWatchlist = (symbol) => {
  const newItem = {
    id: watchlistIdCounter++,
    symbol: symbol.toUpperCase(),
    created_at: new Date().toISOString()
  };
  watchlist.push(newItem);
  return newItem;
};

export const updateWatchlistItem = (id, notes) => {
  const item = watchlist.find(i => i.id === id);
  if (item) {
    item.notes = notes;
  }
  return item;
};

export const removeFromWatchlist = (id) => {
  const index = watchlist.findIndex(i => i.id === id);
  if (index !== -1) {
    return watchlist.splice(index, 1)[0];
  }
  return null;
};

export default { getPortfolio, getWatchlist };
