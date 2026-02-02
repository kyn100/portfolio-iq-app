import { Router } from 'express';
import { getMarketNews, getEconomicEvents, getSocialSentiment } from '../services/yahooFinance.js';
import { generateMarketSummary } from '../services/aiSummary.js';

const router = Router();

router.get('/', async (req, res) => {
    try {
        // 1. Fetch raw data
        const [news, events, sentiment] = await Promise.all([
            getMarketNews(),
            getEconomicEvents(),
            getSocialSentiment()
        ]);

        // 2. Generate AI Summary based on fetched data
        const summary = await generateMarketSummary(news, events);

        res.json({
            marketNews: news,
            economicEvents: events,
            socialSentiment: sentiment,
            marketSummary: summary
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
