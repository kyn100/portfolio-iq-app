import { getSectorPerformance } from '../lib/yahooFinance.js';

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        const sectors = await getSectorPerformance();
        res.status(200).json(sectors);
    } catch (error) {
        console.error('Error fetching sectors:', error);
        res.status(500).json({ error: error.message });
    }
}
