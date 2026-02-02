
import express from 'express';
import { searchSymbol } from '../services/yahooFinance.js';

const router = express.Router();

router.get('/', async (req, res) => {
    const { q } = req.query;

    if (!q) {
        return res.status(400).json({ error: 'Query parameter "q" is required' });
    }

    try {
        const results = await searchSymbol(q);
        res.json(results);
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
