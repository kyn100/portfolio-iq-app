import { getStockQuote, getHistoricalData, getSectorComparison } from '../lib/yahooFinance.js';
import { analyzeStock } from '../lib/technicalAnalysis.js';

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
        // Process all symbols, but in chunks to avoid rate limiting/timeouts
        const CHUNK_SIZE = 4; // Process 4 at a time (conservative)
        const results = [];

        // Helper to process a single symbol
        const processSymbol = async (symbol) => {
            try {
                // Fetch all required data in parallel
                const [quote, historicalData] = await Promise.all([
                    getStockQuote(symbol),
                    getHistoricalData(symbol, '6mo')
                ]);

                // Run Analysis
                const analysis = analyzeStock(historicalData, quote);

                // Get Sector Comparison (lightweight check, can fail safely)
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
        };

        // Execution Loop
        for (let i = 0; i < symbols.length; i += CHUNK_SIZE) {
            const chunk = symbols.slice(i, i + CHUNK_SIZE);
            const chunkResults = await Promise.all(chunk.map(processSymbol));
            results.push(...chunkResults);

            // Small delay between chunks to be nice to API
            if (i + CHUNK_SIZE < symbols.length) {
                await new Promise(r => setTimeout(r, 200));
            }
        }

        res.status(200).json(results);
    } catch (error) {
        console.error('Batch fetch error:', error);
        res.status(500).json({ error: error.message });
    }
}
