import { Router } from 'express';
import { getStockQuote, getHistoricalData, searchSymbol, getNews, getAlternatives } from '../services/yahooFinance.js';
import { analyzeStock } from '../services/technicalAnalysis.js';

const router = Router();

// ... existing code ...

// Get stock data with technical analysis
router.get('/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { period = '6mo' } = req.query;

    // Fetch quote and historical data sequentially to avoid rate limiting
    // (Both functions utilize the same yahooFinance instance)
    const quote = await getStockQuote(symbol);
    // Add a small delay? No, just sequential should be enough.
    const historicalData = await getHistoricalData(symbol, period);

    // Fetch news
    const news = await getNews(symbol);

    // Perform technical analysis
    const analysis = analyzeStock(historicalData, quote);

    // Fetch alternatives if SELL or HOLD
    let alternatives = [];
    if (['SELL', 'HOLD'].includes(analysis.recommendation.recommendation)) {
      alternatives = await getAlternatives(symbol, quote.sector);
    }

    res.json({
      ...quote,
      historicalData: historicalData.slice(-60), // Last 60 days for chart
      analysis,
      news,
      alternatives,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get only historical data for a stock
router.get('/:symbol/history', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { period = '6mo' } = req.query;

    const historicalData = await getHistoricalData(symbol, period);
    res.json(historicalData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
