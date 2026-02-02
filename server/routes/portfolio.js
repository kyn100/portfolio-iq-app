import { Router } from 'express';
import {
  getPortfolio,
  getPortfolioItem,
  getPortfolioItemBySymbol,
  addToPortfolio,
  updatePortfolioItem,
  removeFromPortfolio,
} from '../database/db.js';
import { getStockQuote, getHistoricalData, getSectorComparison, getNews, getAlternatives } from '../services/yahooFinance.js';
import { analyzeStock } from '../services/technicalAnalysis.js';

const router = Router();

// Get all portfolio items with current data
router.get('/', async (req, res) => {
  try {
    const portfolio = getPortfolio();

    // Fetch current data for each stock in parallel
    const portfolioWithData = await Promise.all(
      portfolio.map(async (item) => {
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

          const currentValue = quote.price * item.quantity;
          const costBasis = item.purchase_price * item.quantity;
          const gainLoss = currentValue - costBasis;
          const gainLossPercent = costBasis > 0 ? (gainLoss / costBasis) * 100 : 0;

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
            currentValue,
            costBasis,
            gainLoss,
            gainLossPercent,
            // New fields
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
            sectorComparison,
            analysis,
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

    // Calculate portfolio summary
    const summary = portfolioWithData.reduce(
      (acc, item) => {
        if (!item.error) {
          acc.totalValue += item.currentValue || 0;
          acc.totalCost += item.costBasis || 0;
        }
        return acc;
      },
      { totalValue: 0, totalCost: 0 }
    );

    summary.totalGainLoss = summary.totalValue - summary.totalCost;
    summary.totalGainLossPercent =
      summary.totalCost > 0 ? (summary.totalGainLoss / summary.totalCost) * 100 : 0;

    res.json({
      items: portfolioWithData,
      summary,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add stock to portfolio
router.post('/', async (req, res) => {
  try {
    const { symbol, quantity = 0, purchasePrice = 0 } = req.body;

    if (!symbol) {
      return res.status(400).json({ error: 'Symbol is required' });
    }

    // Check if already exists
    const existing = getPortfolioItemBySymbol(symbol);
    if (existing) {
      return res.status(400).json({ error: 'Stock already in portfolio' });
    }

    // Verify the symbol exists and get the name
    const quote = await getStockQuote(symbol);

    const item = addToPortfolio(symbol, quote.name, quantity, purchasePrice);
    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update portfolio item
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, purchasePrice } = req.body;

    const existing = getPortfolioItem(parseInt(id));
    if (!existing) {
      return res.status(404).json({ error: 'Portfolio item not found' });
    }

    const item = updatePortfolioItem(
      parseInt(id),
      quantity ?? existing.quantity,
      purchasePrice ?? existing.purchase_price
    );
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Remove from portfolio
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const existing = getPortfolioItem(parseInt(id));
    if (!existing) {
      return res.status(404).json({ error: 'Portfolio item not found' });
    }

    const item = removeFromPortfolio(parseInt(id));
    res.json({ message: 'Removed from portfolio', item });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
