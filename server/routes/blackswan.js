import { Router } from 'express';
import { getGenAI } from '../services/aiSummary.js';
import YahooFinance from 'yahoo-finance2';

const router = Router();
const yahooFinance = new YahooFinance();

// Fetch news for a specific topic
const fetchNewsForTopic = async (keywords, fallbackSymbol) => {
    try {
        // 1. Try first keyword
        let searchTerm = keywords[0];
        let result = await yahooFinance.search(searchTerm, { newsCount: 5, quotesCount: 0 });

        // 2. If no news, try fallback symbol (first hedge)
        if ((!result.news || result.news.length === 0) && fallbackSymbol) {
            console.log(`No news for ${searchTerm}, trying symbol ${fallbackSymbol}`);
            result = await yahooFinance.search(fallbackSymbol, { newsCount: 5, quotesCount: 0 });
        }

        if (result.news && result.news.length > 0) {
            return result.news.slice(0, 3).map(item => ({
                title: item.title,
                publisher: item.publisher,
                link: item.link,
                publishedAt: item.providerPublishTime ? new Date(item.providerPublishTime * 1000).toLocaleDateString() : null
            }));
        }
        return [];
    } catch (error) {
        console.error(`News fetch error:`, error.message);
        return [];
    }
};

// Black Swan Event Definitions
const BLACK_SWAN_EVENTS = [
    {
        id: 'flash-crash',
        name: 'Flash Crash by Algorithmic Trading',
        description: 'Sudden, severe market crash caused by high-frequency trading algorithms triggering cascading sell orders',
        icon: '⚡',
        hedges: [
            { symbol: 'VXX', name: 'iPath S&P 500 VIX Short-Term Futures', type: 'Volatility ETN' },
            { symbol: 'UVXY', name: 'ProShares Ultra VIX Short-Term Futures', type: 'Leveraged Volatility' },
            { symbol: 'SH', name: 'ProShares Short S&P500', type: 'Inverse ETF' },
            { symbol: 'TAIL', name: 'Cambria Tail Risk ETF', type: 'Tail Risk Hedge' }
        ],
        newsKeywords: ['algorithmic trading crash', 'flash crash', 'market circuit breaker', 'HFT market disruption']
    },
    {
        id: 'leader-death',
        name: 'Death of a Major World Leader',
        description: 'Unexpected death of a major world leader causing geopolitical instability and market uncertainty',
        icon: '🏛️',
        hedges: [
            { symbol: 'GLD', name: 'SPDR Gold Shares', type: 'Gold ETF' },
            { symbol: 'TLT', name: 'iShares 20+ Year Treasury Bond', type: 'Treasury Bonds' },
            { symbol: 'VXX', name: 'iPath S&P 500 VIX Short-Term Futures', type: 'Volatility ETN' },
            { symbol: 'UUP', name: 'Invesco DB US Dollar Index', type: 'Dollar Strength' }
        ],
        newsKeywords: ['world leader health', 'political succession', 'head of state', 'leadership transition']
    },
    {
        id: 'pandemic',
        name: 'Bioengineered Pandemic',
        description: 'Outbreak of a deadly bioengineered pathogen causing global health crisis and economic shutdown',
        icon: '🦠',
        hedges: [
            { symbol: 'XBI', name: 'SPDR S&P Biotech ETF', type: 'Biotech ETF' },
            { symbol: 'PFE', name: 'Pfizer Inc', type: 'Pharma Stock' },
            { symbol: 'MRNA', name: 'Moderna Inc', type: 'mRNA Vaccines' },
            { symbol: 'ZM', name: 'Zoom Video Communications', type: 'Remote Work' },
            { symbol: 'TDOC', name: 'Teladoc Health', type: 'Telehealth' }
        ],
        newsKeywords: ['bioweapon', 'lab leak', 'pandemic preparedness', 'novel pathogen', 'biosecurity']
    },
    {
        id: 'cyberattack',
        name: 'Global Cyberattack on Infrastructure',
        description: 'Coordinated cyberattack targeting critical infrastructure including power grids, financial systems, and communications',
        icon: '💻',
        hedges: [
            { symbol: 'HACK', name: 'ETFMG Prime Cyber Security ETF', type: 'Cybersecurity ETF' },
            { symbol: 'CIBR', name: 'First Trust NASDAQ Cybersecurity ETF', type: 'Cybersecurity ETF' },
            { symbol: 'PANW', name: 'Palo Alto Networks', type: 'Cybersecurity Stock' },
            { symbol: 'CRWD', name: 'CrowdStrike Holdings', type: 'Cybersecurity Stock' },
            { symbol: 'GLD', name: 'SPDR Gold Shares', type: 'Safe Haven' }
        ],
        newsKeywords: ['cyberattack infrastructure', 'power grid hack', 'ransomware attack', 'state-sponsored cyber', 'critical infrastructure']
    },
    {
        id: 'taiwan-conflict',
        name: 'China–Taiwan Military Conflict',
        description: 'Military confrontation between China and Taiwan potentially involving US intervention and global supply chain disruption',
        icon: '⚔️',
        hedges: [
            { symbol: 'LMT', name: 'Lockheed Martin', type: 'Defense Stock' },
            { symbol: 'RTX', name: 'RTX Corporation', type: 'Defense Stock' },
            { symbol: 'ITA', name: 'iShares U.S. Aerospace & Defense ETF', type: 'Defense ETF' },
            { symbol: 'GLD', name: 'SPDR Gold Shares', type: 'Safe Haven' },
            { symbol: 'USO', name: 'United States Oil Fund', type: 'Oil ETF' },
            { symbol: 'UNG', name: 'United States Natural Gas Fund', type: 'Natural Gas' }
        ],
        newsKeywords: ['Taiwan strait', 'China Taiwan military', 'Taiwan invasion', 'South China Sea', 'US Taiwan defense']
    }
];

// Get AI-assessed probability for black swan events
const assessBlackSwanProbabilities = async () => {
    const genAI = getGenAI();

    if (!genAI) {
        // Return default probabilities if AI is unavailable
        return BLACK_SWAN_EVENTS.map(event => ({
            ...event,
            probability: { value: 5, trend: 'stable', reasoning: 'AI analysis unavailable' },
            news: []
        }));
    }

    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

        const prompt = `You are a geopolitical and financial risk analyst. Assess the probability of these 5 black swan events occurring within the next 12 months.

Events to analyze:
1. "flash-crash" (Flash Crash by Algorithmic Trading)
2. "leader-death" (Death of a Major World Leader)
3. "pandemic" (Bioengineered Pandemic)
4. "cyberattack" (Global Cyberattack on Infrastructure)
5. "taiwan-conflict" (China–Taiwan Military Conflict)

For EACH event, provide:
- "probability": 1-100 (percentage chance)
- "trend": "rising" | "stable" | "falling"
- "reasoning": 1 sentence summary
- "keyFactors": Array of 3 short bullet points on WHY (risk drivers).

Respond with valid JSON containing "events" array with ALL 5 IDs. Do not include news.

Example JSON structure:
{
  "events": [
    { "id": "flash-crash", "probability": 15, "trend": "rising", "reasoning": "...", "keyFactors": ["...", "...", "..."] },
    ... (all 5 items)
  ]
}`;

        const result = await model.generateContent(prompt);
        const text = result.response.text();

        // Extract JSON from response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error('No JSON found');

        const analysis = JSON.parse(jsonMatch[0]);

        // Merge AI analysis with event definitions
        return BLACK_SWAN_EVENTS.map(event => {
            const aiData = analysis.events?.find(e => e.id === event.id);

            // Fallback if AI missed an event
            if (!aiData) {
                return {
                    ...event,
                    probability: { value: 5, trend: 'stable', reasoning: 'Analysis temporarily unavailable' },
                    news: []
                };
            }

            return {
                ...event,
                probability: {
                    value: aiData.probability || 5,
                    trend: aiData.trend || 'stable',
                    reasoning: aiData.reasoning || 'Analysis pending',
                    keyFactors: aiData.keyFactors || []
                },
                news: [] // AI news removed, filled by Yahoo Finance
            };
        });
    } catch (error) {
        console.error('Black Swan AI Analysis Error:', error);
        // Return defaults on error
        return BLACK_SWAN_EVENTS.map(event => ({
            ...event,
            probability: { value: 5, trend: 'stable', reasoning: 'Analysis temporarily unavailable' },
            news: []
        }));
    }
};

// GET /api/blackswan - Get all black swan events with analysis
router.get('/', async (req, res) => {
    try {
        // Get AI probabilities
        const events = await assessBlackSwanProbabilities();

        // Fetch real news for each event in parallel
        const eventsWithNews = await Promise.all(
            events.map(async (event) => {
                const fallbackSymbol = event.hedges && event.hedges.length > 0 ? event.hedges[0].symbol : null;
                const realNews = await fetchNewsForTopic(event.newsKeywords || [event.name], fallbackSymbol);
                return {
                    ...event,
                    news: realNews.length > 0 ? realNews : event.news // Use real news if available, fallback to AI
                };
            })
        );

        res.json(eventsWithNews);
    } catch (error) {
        console.error('Black Swan API Error:', error);
        res.status(500).json({ error: 'Failed to fetch black swan analysis' });
    }
});

export default router;
