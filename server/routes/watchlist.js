import { Router } from 'express';
import {
  getWatchlist,
  getWatchlistItem,
  getWatchlistItemBySymbol,
  addToWatchlist,
  updateWatchlistItem,
  removeFromWatchlist,
} from '../database/db.js';
import { getStockQuote, getHistoricalData, getSectorComparison, getNews, getAlternatives } from '../services/yahooFinance.js';
import { analyzeStock } from '../services/technicalAnalysis.js';

const router = Router();

// Get all watchlist items with current data
router.get('/', async (req, res) => {
  try {
    const watchlist = getWatchlist();

    // Fetch current data for each stock in parallel
    const watchlistWithData = await Promise.all(
      watchlist.map(async (item) => {
        try {
          // Fetch data sequentially to respect rate limits
          const quote = await getStockQuote(item.symbol);
          const historicalData = await getHistoricalData(item.symbol, '6mo');
          const news = await getNews(item.symbol);

          // Use the fetched quote for analysis context
          const analysis = analyzeStock(historicalData, quote);

          // Alternatives
          let alternatives = [];
          if (['SELL', 'HOLD'].includes(analysis.recommendation.recommendation)) {
            alternatives = await getAlternatives(item.symbol, quote.sector);
          }

          // Get sector comparison if available
          let sectorComparison = null;
          if (quote.sector) {
            sectorComparison = await getSectorComparison(item.symbol, quote.sector);
          }

          return {
            ...item,
            currentPrice: quote.price,
            change: quote.change,
            changePercent: quote.changePercent,
            peRatio: quote.peRatio,
            forwardPE: quote.forwardPE,
            ytdReturn: quote.ytdReturn,
            dividendYield: quote.dividendYield,
            marketCap: quote.marketCap,
            sector: quote.sector,
            industry: quote.industry,
            fiftyTwoWeekHigh: quote.fiftyTwoWeekHigh,
            fiftyTwoWeekLow: quote.fiftyTwoWeekLow,
            description: quote.description,
            insiderTransactions: quote.insiderTransactions,
            analystRatings: quote.analystRatings,
            institutionOwnership: quote.institutionOwnership,
            analysis,
            sectorComparison,
            historicalData: historicalData.slice(-30),
            news,
            alternatives,
          };
        } catch (error) {
          console.error(`Error fetching data for ${item.symbol}:`, error.message);
          return {
            ...item,
            error: `Failed to fetch data: ${error.message}`,
          };
        }
      })
    );

    res.json({ items: watchlistWithData });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add stock to watchlist
router.post('/', async (req, res) => {
  try {
    const { symbol, notes = '' } = req.body;

    if (!symbol) {
      return res.status(400).json({ error: 'Symbol is required' });
    }

    // Check if already exists
    const existing = getWatchlistItemBySymbol(symbol);
    if (existing) {
      return res.status(400).json({ error: 'Stock already in watchlist' });
    }

    // Verify the symbol exists and get the name
    const quote = await getStockQuote(symbol);

    const item = addToWatchlist(symbol, quote.name, notes);
    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update watchlist item (notes)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const existing = getWatchlistItem(parseInt(id));
    if (!existing) {
      return res.status(404).json({ error: 'Watchlist item not found' });
    }

    const item = updateWatchlistItem(parseInt(id), notes ?? existing.notes);
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Remove from watchlist
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const existing = getWatchlistItem(parseInt(id));
    if (!existing) {
      return res.status(404).json({ error: 'Watchlist item not found' });
    }

    const item = removeFromWatchlist(parseInt(id));
    res.json({ message: 'Removed from watchlist', item });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
