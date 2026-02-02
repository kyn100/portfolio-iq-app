import { getMarketNews, getInfluencerUpdates, getSocialSentiment } from './lib/yahooFinance.js';

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        const [news, influencers, sentiment] = await Promise.all([
            getMarketNews(),
            getInfluencerUpdates(),
            getSocialSentiment()
        ]);

        res.status(200).json({
            marketNews: news,
            influencerUpdates: influencers,
            socialSentiment: sentiment
        });
    } catch (error) {
        console.error('Error fetching insights:', error);
        res.status(500).json({ error: error.message });
    }
}
