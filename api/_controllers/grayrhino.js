import { Router } from 'express';
import { GoogleGenerativeAI } from "@google/generative-ai";
import YahooFinance from 'yahoo-finance2';

const router = Router();
const yahooFinance = new YahooFinance();

// Initialize Gemini AI
let genAIInstance = null;
const getGenAI = () => {
    if (!genAIInstance && process.env.GEMINI_API_KEY) {
        genAIInstance = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    }
    return genAIInstance;
};

// Fetch news for a specific topic
const fetchNewsForTopic = async (keywords, fallbackSymbol) => {
    try {
        let searchTerm = keywords[0];
        let result = await yahooFinance.search(searchTerm, { newsCount: 5, quotesCount: 0 });

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

const GRAY_RHINO_EVENTS = [
    {
        id: 'debt-crisis',
        name: 'Global Sovereign Debt Crisis',
        description: 'Mounting national debts and deficits leading to potential defaults, currency debasement, and fiscal crises.',
        icon: '📉',
        hedges: [
            { symbol: 'GLD', name: 'SPDR Gold Shares', type: 'Hard Asset' },
            { symbol: 'TBT', name: 'ProShares UltraShort 20+ Year Treasury', type: 'Short Bonds' },
            { symbol: 'IBIT', name: 'iShares Bitcoin Trust', type: 'Digital Gold' },
            { symbol: 'UUP', name: 'Invesco DB US Dollar Index', type: 'Dollar Strength' }
        ],
        newsKeywords: ['sovereign debt crisis', 'national debt ceiling', 'bond market collapse', 'currency devaluation']
    },
    {
        id: 'climate-collapse',
        name: 'Climate Change & Ecosystem Collapse',
        description: 'Accelerating environmental degradation, extreme weather events, and resource scarcity threatening economic stability.',
        icon: '🌍',
        hedges: [
            { symbol: 'PHO', name: 'Invesco Water Resources ETF', type: 'Water Rights' },
            { symbol: 'ICLN', name: 'iShares Global Clean Energy', type: 'Energy Transition' },
            { symbol: 'MOO', name: 'VanEck Agribusiness ETF', type: 'Food Security' },
            { symbol: 'CAT', name: 'Caterpillar Inc.', type: 'Infrastructure' }
        ],
        newsKeywords: ['climate change economic impact', 'severe drought water scarcity', 'extreme weather disaster', 'crop failure reports']
    },
    {
        id: 'demographics',
        name: 'Aging Populations & Demographic Decline',
        description: 'Shrinking workforces and aging populations straining pension systems, healthcare, and economic growth potential.',
        icon: '👵',
        hedges: [
            { symbol: 'XLV', name: 'Health Care Select Sector SPDR', type: 'Healthcare' },
            { symbol: 'BOTZ', name: 'Global X Robotics & AI', type: 'Automation' },
            { symbol: 'SCI', name: 'Service Corp International', type: 'Death Care' },
            { symbol: 'EEM', name: 'iShares MSCI Emerging Markets', type: 'Younger Demographics' }
        ],
        newsKeywords: ['demographic crisis', 'aging population pension', 'global labor shortage', 'birth rate decline']
    },
    {
        id: 'ai-control',
        name: 'Out-of-Control AI',
        description: 'Rapid, unregulated AI advancement leading to massive job displacement, deepfakes, and potential loss of human control.',
        icon: '🤖',
        hedges: [
            { symbol: 'CIBR', name: 'First Trust NASDAQ Cybersecurity', type: 'Cyber Defense' },
            { symbol: 'ITA', name: 'iShares U.S. Aerospace & Defense', type: 'Physical Security' },
            { symbol: 'SPLV', name: 'Invesco S&P 500 Low Volatility', type: 'Stability' },
            { symbol: 'WMT', name: 'Walmart Inc.', type: 'Defensive Staple' }
        ],
        newsKeywords: ['AI safety risk', 'artificial intelligence job loss', 'AI deepfake threat', 'autonomous AI regulation']
    },
    {
        id: 'polarization',
        name: 'Political Polarization & Institutional Decay',
        description: 'Deepening societal divisions, misinformation, and erosion of trust in government and media leading to paralysis and unrest.',
        icon: '🗣️',
        hedges: [
            { symbol: 'ITA', name: 'iShares U.S. Aerospace & Defense', type: 'Defense' },
            { symbol: 'GLD', name: 'SPDR Gold Shares', type: 'Safe Haven' },
            { symbol: 'VXUS', name: 'Vanguard Total International Stock', type: 'Diversification' },
            { symbol: 'XLP', name: 'Consumer Staples Select Sector', type: 'Unrest Staple' }
        ],
        newsKeywords: ['political polarization unrest', 'disinformation crisis', 'institutional trust decline', 'civil unrest risks']
    }
];

const assessGrayRhinoRisks = async () => {
    const genAI = getGenAI();

    const fallbackEvents = GRAY_RHINO_EVENTS.map(event => ({
        ...event,
        probability: { value: 50, trend: 'rising', reasoning: 'AI analysis unavailable' },
        news: []
    }));

    if (!genAI) return fallbackEvents;

    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

        const prompt = `You are a strategic risk analyst specializing in "Gray Rhinos" - highly probable, high-impact, yet neglected threats.
        Analyze the current state of these slow-motion disasters:

EVENTS TO ANALYZE:
1. Global Sovereign Debt Crisis (Debt loads, defaults)
2. Climate Change & Ecosystem Collapse (Weather extremes, resource scarcity)
3. Aging Populations & Demographic Decline (Pension strain, labor shortage)
4. Out-of-Control AI (Job loss, misalignment, security)
5. Political Polarization & Institutional Decay (Civil unrest, gridlock)

For each event, provide:
- intensity: number 1-100 representing current severity/urgency (100 = critical breaking point)
- trend: "accelerating", "steady", or "decelerating"
- reasoning: Brief 1-2 sentence summary of the situation
- keyFactors: Array of 3 specific bullet points explaining WHY the intensity is at this level
- recentNews: Array of 2-3 realistic headlines based on current global situation

Respond in valid JSON format:
{
  "events": [
    {
      "id": "debt-crisis",
      "intensity": 75,
      "trend": "accelerating",
      "reasoning": "Rising yields and deficits in major economies are increasing fragility.",
      "keyFactors": [
        "US Debt-to-GDP ratio surpassing historical norms",
        "Higher for longer interest rates pressuring budgets",
        "Sovereign default risks in emerging markets"
      ],
      "recentNews": ["Global Debt Hits Record High", "IMF Warns of Fiscal Cliff"]
    }
  ]
}`;

        const result = await model.generateContent(prompt);
        const text = result.response.text();

        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error('No JSON found');

        const analysis = JSON.parse(jsonMatch[0]);

        return GRAY_RHINO_EVENTS.map(event => {
            const aiData = analysis.events?.find(e => e.id === event.id) || {};
            return {
                ...event,
                probability: {
                    value: aiData.intensity || 50,
                    trend: aiData.trend || 'steady',
                    reasoning: aiData.reasoning || 'Analysis pending',
                    keyFactors: aiData.keyFactors || []
                },
                news: aiData.recentNews || []
            };
        });
    } catch (error) {
        console.error('Gray Rhino AI Analysis Error:', error);
        return fallbackEvents;
    }
};

router.get('/', async (req, res) => {
    try {
        const events = await assessGrayRhinoRisks();

        const eventsWithNews = await Promise.all(
            events.map(async (event) => {
                const keywords = [event.name, ...(event.newsKeywords || [])];
                const fallbackSymbol = event.hedges && event.hedges.length > 0 ? event.hedges[0].symbol : null;
                const realNews = await fetchNewsForTopic(keywords, fallbackSymbol);
                return {
                    ...event,
                    news: realNews.length > 0 ? realNews : event.news
                };
            })
        );

        res.json(eventsWithNews);
    } catch (error) {
        console.error('Gray Rhino API Error:', error);
        res.status(500).json({ error: 'Failed to fetch gray rhino analysis' });
    }
});

export default router;
