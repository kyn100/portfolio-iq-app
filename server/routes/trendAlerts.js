import { Router } from 'express';
import { getTrendAlerts } from '../services/yahooFinance.js';

const router = Router();

router.get('/', async (req, res) => {
    try {
        const alerts = await getTrendAlerts();
        res.json(alerts);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
