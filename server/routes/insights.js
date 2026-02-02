import { Router } from 'express';
import { getMarketNews, getEconomicEvents, getSocialSentiment } from '../services/yahooFinance.js';

const router = Router();

router.get('/', async (req, res) => {
    try {
        const [news, events, sentiment] = await Promise.all([
            getMarketNews(),
            getEconomicEvents(),
            getSocialSentiment()
        ]);

        res.json({
            marketNews: news,
            economicEvents: events,
            socialSentiment: sentiment
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
