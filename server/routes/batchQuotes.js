
import express from 'express';
import { getStockQuote } from '../services/yahooFinance.js';

const router = express.Router();

router.post('/', async (req, res) => {
    const { symbols } = req.body;

    if (!symbols || !Array.isArray(symbols)) {
        return res.status(400).json({ error: 'Symbols array is required' });
    }

    try {
        // Limit batch size
        const batch = symbols.slice(0, 20);

        // Fetch in parallel
        const quotes = await Promise.all(
            batch.map(async (symbol) => {
                try {
                    const quote = await getStockQuote(symbol);
                    return { symbol: symbol.toUpperCase(), data: quote, error: null };
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
