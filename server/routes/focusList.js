import { Router } from 'express';
import {
    getFocusList,
    getFocusListItem,
    getFocusListItemBySymbol,
    addToFocusList,
    updateFocusListItem,
    removeFromFocusList,
} from '../database/db.js';
import { getStockQuote, getHistoricalData, getSectorComparison, getNews, getAlternatives } from '../services/yahooFinance.js';
import { analyzeStock } from '../services/technicalAnalysis.js';

const router = Router();

// Get all focus list items with current data
router.get('/', async (req, res) => {
    try {
        const focusList = getFocusList();

        // Fetch current data for each stock in parallel
        const focusListWithData = await Promise.all(
            focusList.map(async (item) => {
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

        res.json({ items: focusListWithData });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Add stock to focus list
router.post('/', async (req, res) => {
    try {
        const { symbol, notes = '', target_price = null, stop_loss = null } = req.body;

        if (!symbol) {
            return res.status(400).json({ error: 'Symbol is required' });
        }

        // Check if already exists
        const existing = getFocusListItemBySymbol(symbol);
        if (existing) {
            return res.status(400).json({ error: 'Stock already in focus list' });
        }

        // Verify the symbol exists and get the name
        const quote = await getStockQuote(symbol);

        const item = addToFocusList(symbol, quote.name, notes, target_price, stop_loss);
        res.status(201).json(item);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update focus list item (notes, target, stop)
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { notes, target_price, stop_loss } = req.body;

        const existing = getFocusListItem(parseInt(id));
        if (!existing) {
            return res.status(404).json({ error: 'Focus list item not found' });
        }

        const item = updateFocusListItem(
            parseInt(id),
            notes ?? existing.notes,
            target_price ?? existing.target_price,
            stop_loss ?? existing.stop_loss
        );
        res.json(item);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Remove from focus list
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const existing = getFocusListItem(parseInt(id));
        if (!existing) {
            return res.status(404).json({ error: 'Focus list item not found' });
        }

        const item = removeFromFocusList(parseInt(id));
        res.json({ message: 'Removed from focus list', item });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
