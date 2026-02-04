import { Router } from 'express';
import { getSectorPerformance } from '../lib/yahooFinance.js';
import { generateSectorPrediction } from '../lib/aiSummary.js';

const router = Router();

// Get sector performance
router.get('/', async (req, res) => {
    try {
        const data = await getSectorPerformance();
        res.json(data);
    } catch (error) {
        console.error('Error fetching sectors:', error);
        res.status(500).json({ error: error.message });
    }
});

// Generate AI Analysis for a specific sector
router.post('/analysis', async (req, res) => {
    try {
        const { sector, performance, leaders } = req.body;
        const analysis = await generateSectorPrediction(sector, performance, leaders);
        res.json(analysis);
    } catch (error) {
        console.error("Sector Analysis Error:", error);
        res.status(500).json({ error: "Failed to generate analysis" });
    }
});

export default router;
