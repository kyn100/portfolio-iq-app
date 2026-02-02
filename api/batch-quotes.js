import { getStockQuote } from './lib/yahooFinance.js';

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { symbols } = req.body;

    if (!symbols || !Array.isArray(symbols)) {
        return res.status(400).json({ error: 'Symbols array is required' });
    }

    try {
        // Limit batch size to prevent timeouts
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

        res.status(200).json(quotes);
    } catch (error) {
        console.error('Batch fetch error:', error);
        res.status(500).json({ error: error.message });
    }
}
