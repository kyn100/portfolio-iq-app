import { getStockQuote, getHistoricalData, getNews, getAlternatives, getSectorComparison } from '../lib/yahooFinance.js';
import { analyzeStock } from '../lib/technicalAnalysis.js';

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { symbol } = req.query;

    if (!symbol) {
        return res.status(400).json({ error: 'Symbol is required' });
    }

    try {
        const quote = await getStockQuote(symbol);
        const historicalData = await getHistoricalData(symbol, '6mo');
        const news = await getNews(symbol);
        const analysis = analyzeStock(historicalData, quote);

        let alternatives = [];
        if (['SELL', 'HOLD'].includes(analysis.recommendation.recommendation)) {
            alternatives = await getAlternatives(symbol, quote.sector);
        }

        let sectorComparison = null;
        if (quote.sector) {
            sectorComparison = await getSectorComparison(symbol, quote.sector);
        }

        res.status(200).json({
            ...quote,
            analysis,
            historicalData: historicalData.slice(-30),
            news,
            alternatives,
            sectorComparison,
        });
    } catch (error) {
        console.error(`Error fetching stock ${symbol}:`, error);
        res.status(500).json({ error: error.message });
    }
}
