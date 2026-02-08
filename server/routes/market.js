import { Router } from 'express';
import { getMarketOutlook } from '../services/aiMarketOutlook.js';

const router = Router();

router.get('/outlook', async (req, res) => {
    try {
        const forceRefresh = req.query.force === 'true';
        const outlook = await getMarketOutlook(forceRefresh);
        res.json(outlook);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch market outlook' });
    }
});

export default router;
