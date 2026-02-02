import { getMarketNews, getSectorPerformance, getTrendAlerts } from '../lib/yahooFinance.js';
import { generateStockRecommendations } from '../lib/aiSummary.js';

export default async function handler(req, res) {
    // CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        console.log("Fetching data for AI Watchlist...");
        // 1. Gather Market Context
        // We limit to essential calls to save time
        const [news, sectors, trends] = await Promise.all([
            getMarketNews(),
            getSectorPerformance(), // This is slow, maybe cache or optimize?
            getTrendAlerts()
        ]);

        const marketData = {
            news: news || [],
            sectors: (sectors || []).slice(0, 5), // Top 5 sectors
            trends: (trends || []).slice(0, 5)   // Top 5 alerts
        };

        // 2. Generate Recommendations
        console.log("Generating AI recommendations...");
        const recommendations = await generateStockRecommendations(marketData);

        res.status(200).json(recommendations);
    } catch (error) {
        console.error('Error generating recommendations:', error);
        res.status(500).json({ error: error.message });
    }
}
