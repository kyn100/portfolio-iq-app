import YahooFinance from 'yahoo-finance2';
import { getGenAI } from './aiSummary.js';

const yahooFinance = new YahooFinance();

// Cache the outlook to avoid hitting AI/Yahoo limits too frequently
let cachedOutlook = null;
let lastFetchTime = 0;
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes

export const getMarketOutlook = async (forceRefresh = false) => {
    const now = Date.now();

    // Return cached data ONLY if forceRefresh is false AND cache is valid
    if (!forceRefresh && cachedOutlook && (now - lastFetchTime < CACHE_DURATION)) {
        return cachedOutlook;
    }

    // specific logging for force refresh
    if (forceRefresh) {
        console.log("Forcing fresh market outlook generation...");
    }

    // Race between data fetching/processing and a request timeout
    // Vercel serverless functions have a 10s default timeout
    const TIMEOUT_MS = 8000;

    try {
        const outlookPromise = (async () => {
            // 1. Fetch Market Data
            const indices = ['SPY', 'QQQ', 'DIA', '^VIX'];
            const quotes = await yahooFinance.quote(indices);

            const marketData = quotes.map(q => ({
                symbol: q.symbol,
                price: q.regularMarketPrice,
                changePercent: q.regularMarketChangePercent,
                name: q.shortName || q.symbol
            }));

            // 2. Fetch Top Financial News (Robust Handling)
            let newsHeadlines = "Market news unavailable.";
            try {
                const newsResult = await yahooFinance.search('stock market news', { newsCount: 5 });
                if (newsResult.news && newsResult.news.length > 0) {
                    newsHeadlines = newsResult.news.map(n => n.title).join('\n');
                }
            } catch (newsError) {
                console.warn("News fetch failed, proceeding with indices only:", newsError.message);
            }

            // 3. Generate AI Analysis
            const genAI = getGenAI();
            if (!genAI) throw new Error("AI Service Unavailable");

            const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

            const prompt = `
        You are a Senior Market Strategist. Analyze the current US Stock Market conditions based on this real-time data:
    
        INDICES:
        ${marketData.map(m => `${m.symbol} (${m.name}): ${m.price?.toFixed(2)} (${m.changePercent?.toFixed(2)}%)`).join('\n')}
    
        TOP HEADLINES:
        ${newsHeadlines}
    
        TASK:
        Provide a "Daily Market Briefing" for a retail investor.
    
        OUTPUT FORMAT (JSON ONLY):
        {
          "sentiment": "BULLISH" | "BEARISH" | "NEUTRAL" | "VOLATILE",
          "prediction": "A concise 1-sentence prediction for the rest of the trading day.",
          "reasoning": "A short paragraph (2-3 sentences) explaining WHY, citing specific moves in indices or news (e.g. 'Tech is lagging', 'VIX spiking').",
          "keyDrivers": [
            "Driver 1 (e.g. 'Fed Speech at 2PM')",
            "Driver 2 (e.g. 'Nvidia Earnings impacting QQQ')"
          ]
        }
        
        Style: Professional, concise, actionable.
        `;

            const result = await model.generateContent(prompt);
            const text = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();

            const analysis = JSON.parse(text);

            const outlook = {
                ...analysis,
                indices: marketData,
                lastUpdated: new Date().toISOString()
            };

            // Update Cache
            cachedOutlook = outlook;
            lastFetchTime = now;

            return outlook;
        })();

        // Timeout Promise
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Request timed out")), TIMEOUT_MS)
        );

        return await Promise.race([outlookPromise, timeoutPromise]);

    } catch (error) {
        console.error("Error generating market outlook:", error);

        // Debug info construction
        let debugMsg = error.message;
        if (error.message.includes("AI Service Unavailable")) {
            debugMsg += " (GEMINI_API_KEY missing)";
        }
        if (error.name === "FetchError" || error.message.includes("yahoo")) {
            debugMsg += " (Yahoo API failed)";
        }

        // Return a graceful fallback
        return {
            sentiment: "NEUTRAL",
            prediction: "Market data retrieval interrupted.",
            reasoning: `We couldn't generate the full analysis in time. Please try refreshing. (Debug: ${debugMsg})`,
            keyDrivers: ["Data Timeout / Error"],
            indices: [],
            error: debugMsg,
            lastUpdated: new Date().toISOString()
        };
    }
};
