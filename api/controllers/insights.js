import { getMarketNews, getEconomicEvents, getSocialSentiment, getInnovationNews } from '../lib/yahooFinance.js';
import { generateMarketSummary } from '../lib/aiSummary.js';

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Cache-Control', 'no-store, max-age=0');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        const [news, events, sentiment, innovations] = await Promise.all([
            getMarketNews(),
            getEconomicEvents(),
            getSocialSentiment(),
            getInnovationNews()
        ]);

        // Generate AI Summary
        const summary = await generateMarketSummary(news, events, innovations);

        res.status(200).json({
            marketNews: news,
            economicEvents: events,
            socialSentiment: sentiment,
            marketSummary: summary
        });
    } catch (error) {
        console.error('Error fetching insights:', error);
        res.status(500).json({ error: error.message });
    }
}
