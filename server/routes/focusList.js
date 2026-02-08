import { Router } from 'express';
import { getStockQuote, getHistoricalData, getSectorComparison, getNews, getAlternatives } from '../services/yahooFinance.js';
import { analyzeStock } from '../services/technicalAnalysis.js';

const router = Router();

// Enrich a list of focus items with market data
router.post('/enrich', async (req, res) => {
    try {
        const { items } = req.body;

        if (!items || !Array.isArray(items)) {
            return res.status(400).json({ error: 'Items array is required' });
        }

        // Fetch current data for each stock in parallel
        const enrichedItems = await Promise.all(
            items.map(async (item) => {
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

        res.json({ items: enrichedItems });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
