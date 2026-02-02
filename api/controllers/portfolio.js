import {
    getPortfolio,
    addToPortfolio,
    removeFromPortfolio
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
            const portfolio = getPortfolio();

            const portfolioWithData = await Promise.all(
                portfolio.map(async (item) => {
                    try {
                        const quote = await getStockQuote(item.symbol);
                        const historicalData = await getHistoricalData(item.symbol, '6mo');
                        const news = await getNews(item.symbol);
                        const analysis = analyzeStock(historicalData, quote);

                        let alternatives = [];
                        if (['SELL', 'HOLD'].includes(analysis.recommendation.recommendation)) {
                            alternatives = await getAlternatives(item.symbol, quote.sector);
                        }

                        const currentValue = quote.price * item.quantity;
                        const costBasis = item.purchase_price * item.quantity;
                        const gainLoss = currentValue - costBasis;
                        const gainLossPercent = costBasis > 0 ? (gainLoss / costBasis) * 100 : 0;

                        let sectorComparison = null;
                        if (quote.sector) {
                            sectorComparison = await getSectorComparison(item.symbol, quote.sector);
                        }

                        return {
                            ...item,
                            currentPrice: quote.price,
                            change: quote.change,
                            changePercent: quote.changePercent,
                            currentValue,
                            costBasis,
                            gainLoss,
                            gainLossPercent,
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

            const summary = portfolioWithData.reduce(
                (acc, item) => {
                    if (!item.error) {
                        acc.totalValue += item.currentValue || 0;
                        acc.totalCost += item.costBasis || 0;
                        acc.totalGainLoss += item.gainLoss || 0;
                        acc.stockCount += 1;
                    }
                    return acc;
                },
                { totalValue: 0, totalCost: 0, totalGainLoss: 0, stockCount: 0 }
            );

            summary.totalGainLossPercent = summary.totalCost > 0
                ? (summary.totalGainLoss / summary.totalCost) * 100
                : 0;

            res.status(200).json({ items: portfolioWithData, summary });
        } catch (error) {
            console.error('Error fetching portfolio:', error);
            res.status(500).json({ error: error.message });
        }
    } else if (req.method === 'POST') {
        try {
            const { symbol, quantity, purchasePrice } = req.body;

            if (!symbol || !quantity || !purchasePrice) {
                return res.status(400).json({ error: 'Missing required fields' });
            }

            const item = addToPortfolio(symbol.toUpperCase(), parseFloat(quantity), parseFloat(purchasePrice));
            res.status(201).json(item);
        } catch (error) {
            console.error('Error adding to portfolio:', error);
            res.status(500).json({ error: error.message });
        }
    } else if (req.method === 'DELETE') {
        try {
            const { id } = req.query;
            if (!id) {
                return res.status(400).json({ error: 'ID is required' });
            }
            removeFromPortfolio(parseInt(id));
            res.status(200).json({ success: true });
        } catch (error) {
            console.error('Error removing from portfolio:', error);
            res.status(500).json({ error: error.message });
        }
    } else {
        res.status(405).json({ error: 'Method not allowed' });
    }
}
