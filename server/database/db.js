import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const db = new Database(join(__dirname, 'portfolio.db'));

// Initialize database schema
db.exec(`
  CREATE TABLE IF NOT EXISTS portfolio (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    symbol TEXT NOT NULL UNIQUE,
    name TEXT,
    quantity REAL DEFAULT 0,
    purchase_price REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Create watchlist table
db.exec(`
  CREATE TABLE IF NOT EXISTS watchlist (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    symbol TEXT NOT NULL UNIQUE,
    name TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);


// Create focus list table
db.exec(`
  CREATE TABLE IF NOT EXISTS focus_list (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    symbol TEXT NOT NULL UNIQUE,
    name TEXT,
    notes TEXT,
    target_price REAL,
    stop_loss REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Portfolio functions
export const getPortfolio = () => {
  return db.prepare('SELECT * FROM portfolio ORDER BY created_at DESC').all();
};

export const getPortfolioItem = (id) => {
  return db.prepare('SELECT * FROM portfolio WHERE id = ?').get(id);
};

export const getPortfolioItemBySymbol = (symbol) => {
  return db.prepare('SELECT * FROM portfolio WHERE symbol = ?').get(symbol.toUpperCase());
};

export const addToPortfolio = (symbol, name, quantity, purchasePrice) => {
  const stmt = db.prepare(`
    INSERT INTO portfolio (symbol, name, quantity, purchase_price)
    VALUES (?, ?, ?, ?)
  `);
  const result = stmt.run(symbol.toUpperCase(), name, quantity, purchasePrice);
  return getPortfolioItem(result.lastInsertRowid);
};

export const updatePortfolioItem = (id, quantity, purchasePrice) => {
  const stmt = db.prepare(`
    UPDATE portfolio
    SET quantity = ?, purchase_price = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);
  stmt.run(quantity, purchasePrice, id);
  return getPortfolioItem(id);
};

export const removeFromPortfolio = (id) => {
  const item = getPortfolioItem(id);
  db.prepare('DELETE FROM portfolio WHERE id = ?').run(id);
  return item;
};

// Watchlist functions
export const getWatchlist = () => {
  return db.prepare('SELECT * FROM watchlist ORDER BY created_at DESC').all();
};

export const getWatchlistItem = (id) => {
  return db.prepare('SELECT * FROM watchlist WHERE id = ?').get(id);
};

export const getWatchlistItemBySymbol = (symbol) => {
  return db.prepare('SELECT * FROM watchlist WHERE symbol = ?').get(symbol.toUpperCase());
};

export const addToWatchlist = (symbol, name, notes = '') => {
  const stmt = db.prepare(`
    INSERT INTO watchlist (symbol, name, notes)
    VALUES (?, ?, ?)
  `);
  const result = stmt.run(symbol.toUpperCase(), name, notes);
  return getWatchlistItem(result.lastInsertRowid);
};

export const updateWatchlistItem = (id, notes) => {
  const stmt = db.prepare(`
    UPDATE watchlist SET notes = ? WHERE id = ?
  `);
  stmt.run(notes, id);
  return getWatchlistItem(id);
};

export const removeFromWatchlist = (id) => {
  const item = getWatchlistItem(id);
  db.prepare('DELETE FROM watchlist WHERE id = ?').run(id);
  return item;
};

// Focus List functions
export const getFocusList = () => {
  return db.prepare('SELECT * FROM focus_list ORDER BY created_at DESC').all();
};

export const getFocusListItem = (id) => {
  return db.prepare('SELECT * FROM focus_list WHERE id = ?').get(id);
};

export const getFocusListItemBySymbol = (symbol) => {
  return db.prepare('SELECT * FROM focus_list WHERE symbol = ?').get(symbol.toUpperCase());
};

export const addToFocusList = (symbol, name, notes = '', targetPrice = null, stopLoss = null) => {
  const stmt = db.prepare(`
    INSERT INTO focus_list (symbol, name, notes, target_price, stop_loss)
    VALUES (?, ?, ?, ?, ?)
  `);
  const result = stmt.run(symbol.toUpperCase(), name, notes, targetPrice, stopLoss);
  return getFocusListItem(result.lastInsertRowid);
};

export const updateFocusListItem = (id, notes, targetPrice, stopLoss) => {
  const stmt = db.prepare(`
    UPDATE focus_list 
    SET notes = ?, target_price = ?, stop_loss = ?
    WHERE id = ?
  `);
  stmt.run(notes, targetPrice, stopLoss, id);
  return getFocusListItem(id);
};

export const removeFromFocusList = (id) => {
  const item = getFocusListItem(id);
  db.prepare('DELETE FROM focus_list WHERE id = ?').run(id);
  return item;
};

export default db;
