import { Router } from 'express';
import { getSectorPerformance } from '../services/yahooFinance.js';

const router = Router();

// Get sector performance
router.get('/', async (req, res) => {
    try {
        const data = await getSectorPerformance();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
