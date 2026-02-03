import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export const generateMarketSummary = async (newsItems = [], events = [], innovations = []) => {
    if (!genAI) {
        return "AI Market Summary unavailable. Add GEMINI_API_KEY to Vercel env variables.";
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        // Prepare context
        const newsContext = newsItems.slice(0, 8).map(n => `- ${n.title} (${n.publisher})`).join('\n');

        const eventsContext = events.map(cat => {
            const catNews = cat.news.slice(0, 2).map(n => `- ${n.title}`).join('\n');
            return `Category: ${cat.name}\n${catNews}`;
        }).join('\n\n');

        const innovationContext = (innovations || []).slice(0, 10).map(n => `- ${n.title} (${n.publisher})`).join('\n');

        const prompt = `
        You are an expert financial analyst and futurist. 
        Analyze the following recent market news, economic events, and innovation trends.
        
        HEADLINES:
        ${newsContext}

        ECONOMIC EVENTS:
        ${eventsContext}

        INNOVATION TRENDS:
        ${innovationContext}

        Task: Produce a "Market Sentiment & Future Trends Report" in strictly valid JSON format.
        
        JSON Structure:
        {
            "sentiment": "BULLISH" | "BEARISH" | "NEUTRAL",
            "headline": "A short, punchy 1-sentence summary of the market mood.",
            "points": [
                "Key market driver 1",
                "Key market driver 2",
                "Key market driver 3"
            ],
            "macro": {
                 "summary": "Brief synthesis of Growth, Inflation, and Rates outlook (approx 20 words).",
                 "signals": ["Signal 1 (e.g. Fed Policy)", "Signal 2 (e.g. GDP Trend)"]
            },
            "ideas": [
                "Identify 1 great new emerging idea/trend from the Innovation News",
                "Identify a second emerging idea or technology breakdown"
            ]
        }
        
        Style: Institutional, forward-looking, high-conviction.
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text();

        // Clean up markdown code blocks if present
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();

        try {
            return JSON.parse(text);
        } catch (e) {
            console.error("Failed to parse AI JSON:", text);
            return {
                sentiment: "NEUTRAL",
                headline: "Market analysis available (Parsing Error)",
                points: ["Unable to format analysis points."],
                macro: { summary: "Data unavailable", signals: [] },
                ideas: []
            };
        }

    } catch (error) {
        console.error("AI Summary Error:", error);
        return `Unable to generate market summary (Error: ${error.message || "Unknown Error"}). Please verify your API Key permissions.`;
    }
};

export const generateStockRecommendations = async (marketData) => {
    if (!genAI) {
        console.warn("AI Recommendations: No API Key");
        return { immediate: [], watchlist: [] };
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        const prompt = `
        You are a Senior Portfolio Manager & Technical Analyst.
        Analyze the following market data to generate a high-conviction "Top 10 Watchlist" for a retail investor.

        ### Market Context
        - **News Headlines**: ${marketData.news.map(n => n.title).slice(0, 5).join('; ')}
        - **Leading Sectors**: ${marketData.sectors.slice(0, 3).map(s => s.name).join(', ')}
        - **Technical Alerts**: ${marketData.trends.slice(0, 5).map(t => `${t.etf} (${t.direction})`).join(', ')}

        ### Task
        Identify 10 specific stocks (US Equities/ETFs) that align with these trends.
        Split them into two categories:
        
        1. **Immediate Opportunities** (5 Stocks): High-conviction setups active RIGHT NOW.
        2. **Radar Screen** (5 Stocks): Stocks setting up for a move.

        ### Output Format (JSON ONLY)
        {
            "immediate": [
                { "symbol": "AAPL", "name": "Apple Inc", "price": 0, "reason": "Breaking out of cup-and-handle pattern on earnings optimism", "action": "Buy" }
            ],
            "watchlist": [
                { "symbol": "TSLA", "name": "Tesla", "price": 0, "reason": "Oversold at 200DMA support, watching for reversal candle", "action": "Wait" }
            ]
        }
        
        RULES:
        - **Reasoning Must Be Clear**: Explain SPECIFICALLY why this stock is chosen (Technical pattern, Catalyst, or Sector Theme). Avoid generic "Good potential".
        - **Focus on Quality**: Prioritize liquid Large/Mid-cap stocks and major ETFs. slightly favor Sector Leaders.
        - "price" can be 0.
        - Do not markdown the output. Return raw JSON.
        `;

        const result = await model.generateContent(prompt);
        const text = result.response.text();

        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(jsonStr);
    } catch (error) {
        console.error("AI Recommendation Error:", error);
        return {
            immediate: [],
            watchlist: []
        };
    }
};
