
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

        // Fetch in parallel
        const quotes = await Promise.all(
            batch.map(async (symbol) => {
                try {
                    // Fetch all required data in parallel
                    const [quote, historicalData] = await Promise.all([
                        getStockQuote(symbol),
                        getHistoricalData(symbol, '6mo')
                    ]);

                    // Run Analysis
                    const analysis = analyzeStock(historicalData, quote);

                    // Get Sector Comparison
                    let sectorComparison = null;
                    if (quote.sector) {
                        try {
                            sectorComparison = await getSectorComparison(symbol, quote.sector);
                        } catch (e) {
                            console.warn(`Sector comparison failed for ${symbol}`);
                        }
                    }

                    return {
                        symbol: symbol.toUpperCase(),
                        data: {
                            ...quote,
                            analysis,
                            sectorComparison,
                            historicalData: historicalData.slice(-30)
                        },
                        error: null
                    };
                } catch (e) {
                    console.error(`Error fetching ${symbol}:`, e.message);
                    return { symbol: symbol.toUpperCase(), data: null, error: e.message };
                }
            })
        );

        res.json(quotes);
    } catch (error) {
        console.error('Batch fetch error:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
