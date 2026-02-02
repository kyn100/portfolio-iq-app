import { Router } from 'express';
import { getMarketNews, getInfluencerUpdates, getSocialSentiment } from '../services/yahooFinance.js';

const router = Router();

router.get('/', async (req, res) => {
    try {
        const [news, influencers, sentiment] = await Promise.all([
            getMarketNews(),
            getInfluencerUpdates(),
            getSocialSentiment()
        ]);

        res.json({
            news,
            influencers,
            sentiment
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
