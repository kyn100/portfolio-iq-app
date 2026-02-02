import {
    getWatchlist,
    addToWatchlist,
    removeFromWatchlist
} from '../lib/db.js';
import { getStockQuote, getHistoricalData, getSectorComparison, getNews, getAlternatives } from '../lib/yahooFinance.js';
import { analyzeStock } from '../lib/technicalAnalysis.js';

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method === 'GET') {
        try {
            const watchlist = getWatchlist();

            const watchlistWithData = await Promise.all(
                watchlist.map(async (item) => {
                    try {
                        const quote = await getStockQuote(item.symbol);
                        const historicalData = await getHistoricalData(item.symbol, '6mo');
                        const news = await getNews(item.symbol);
                        const analysis = analyzeStock(historicalData, quote);

                        let alternatives = [];
                        if (['SELL', 'HOLD'].includes(analysis.recommendation.recommendation)) {
                            alternatives = await getAlternatives(item.symbol, quote.sector);
                        }

                        let sectorComparison = null;
                        if (quote.sector) {
                            sectorComparison = await getSectorComparison(item.symbol, quote.sector);
                        }

                        return {
                            ...item,
                            currentPrice: quote.price,
                            name: quote.name,
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
                            sectorComparison,
                            analysis,
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

            res.status(200).json({ items: watchlistWithData });
        } catch (error) {
            console.error('Error fetching watchlist:', error);
            res.status(500).json({ error: error.message });
        }
    } else if (req.method === 'POST') {
        try {
            const { symbol } = req.body;

            if (!symbol) {
                return res.status(400).json({ error: 'Symbol is required' });
            }

            const item = addToWatchlist(symbol.toUpperCase());
            res.status(201).json(item);
        } catch (error) {
            console.error('Error adding to watchlist:', error);
            res.status(500).json({ error: error.message });
        }
    } else if (req.method === 'DELETE') {
        try {
            const { id } = req.query;
            if (!id) {
                return res.status(400).json({ error: 'ID is required' });
            }
            removeFromWatchlist(parseInt(id));
            res.status(200).json({ success: true });
        } catch (error) {
            console.error('Error removing from watchlist:', error);
            res.status(500).json({ error: error.message });
        }
    } else {
        res.status(405).json({ error: 'Method not allowed' });
    }
}
