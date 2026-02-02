import { getStockQuote, getHistoricalData, getSectorComparison } from './lib/yahooFinance.js';
import { analyzeStock } from './lib/technicalAnalysis.js';

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
        // Limit batch size to prevent timeouts - reduced to 10 due to heavier load
        const batch = symbols.slice(0, 10);

        // Fetch in parallel
        const quotes = await Promise.all(
            batch.map(async (symbol) => {
                try {
                    // Fetch all required data in parallel
                    // We need history for technical analysis
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
                            historicalData: historicalData.slice(-30) // Return last 30 days for charts
                        },
                        error: null
                    };
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
