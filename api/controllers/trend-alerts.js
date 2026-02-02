import { getTrendAlerts } from '../lib/yahooFinance.js';

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        const alerts = await getTrendAlerts();
        res.status(200).json(alerts);
    } catch (error) {
        console.error('Error fetching trend alerts:', error);
        res.status(500).json({ error: error.message });
    }
}
