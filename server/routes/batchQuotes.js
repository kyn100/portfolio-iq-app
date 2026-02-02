
import express from 'express';
import { getStockQuote, getHistoricalData, getSectorComparison } from '../services/yahooFinance.js';
import { analyzeStock } from '../services/technicalAnalysis.js';

const router = express.Router();

router.post('/', async (req, res) => {
    const { symbols } = req.body;

    if (!symbols || !Array.isArray(symbols)) {
        return res.status(400).json({ error: 'Symbols array is required' });
    }

    try {
        // Limit batch size
        const batch = symbols.slice(0, 10);

        const quotes = [];

        // Process sequentially to be gentle on Yahoo API (avoid 429)
        for (const symbol of batch) {
            let quote = null;
            let analysis = null;
            let historicalData = [];
            let sectorComparison = null;

            try {
                // 1. Fetch quote first (Critically required)
                quote = await getStockQuote(symbol);

                // 2. Try fetching history (Non-critical, can display price without it)
                try {
                    historicalData = await getHistoricalData(symbol, '6mo');
                    analysis = analyzeStock(historicalData, quote);
                } catch (e) {
                    console.warn(`Analysis failed for ${symbol}: ${e.message}`);
                    historicalData = []; // Fallback empty
                }

                // 3. Sector Comparison (Non-critical)
                if (quote.sector) {
                    try {
                        sectorComparison = await getSectorComparison(symbol, quote.sector);
                    } catch (e) {
                        // Ignore sector errors
                    }
                }

                quotes.push({
                    symbol: symbol.toUpperCase(),
                    data: {
                        ...quote,
                        analysis,
                        sectorComparison,
                        historicalData: historicalData.slice(-30)
                    },
                    error: null
                });

            } catch (e) {
                // Only fail totally if QUOTE fails
                console.error(`Error fetching ${symbol}:`, e.message);
                quotes.push({ symbol: symbol.toUpperCase(), data: null, error: e.message });
            }

            // Small delay between stocks
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        res.json(quotes);
    } catch (error) {
        console.error('Batch fetch error:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
