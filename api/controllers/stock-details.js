import { getStockQuote, getHistoricalData, getNews, getAlternatives } from '../lib/yahooFinance.js';
import { analyzeStock } from '../lib/technicalAnalysis.js';

export default async function handler(req, res) {
    // Allow CORS if not handled by main app (Express handles it via middleware usually, but Vercel handlers had manual CORS)
    // If we use Express in api/index.js, we should add CORS middleware there.
    // But let's keep the handler logic intact.

    // Normalize symbol from Query or Params (Vercel vs Express)
    const symbol = req.query.symbol || req.params.symbol;

    if (!symbol) {
        return res.status(400).json({ error: 'Stock symbol is required' });
    }

    // We only support GET for details
    if (req.method !== 'GET') {
        // Some handlers allowed OPTIONS manually. Express handles OPTIONS if we define routes?
        // Let's just ignore if it's not GET.
    }

    try {
        const quote = await getStockQuote(symbol);
        const historicalData = await getHistoricalData(symbol, '6mo');
        const news = await getNews(symbol);

        let analysis = null;
        if (quote && historicalData) {
            analysis = analyzeStock(historicalData, quote);
        }

        let alternatives = [];
        if (analysis && ['SELL', 'HOLD'].includes(analysis.recommendation?.recommendation)) {
            alternatives = await getAlternatives(symbol, quote.sector);
        }

        res.json({
            ...quote,
            historicalData: (historicalData || []).slice(-60),
            analysis,
            news,
            alternatives
        });
    } catch (error) {
        console.error(`Error fetching stock details for ${symbol}:`, error);
        res.status(500).json({ error: error.message });
    }
}
