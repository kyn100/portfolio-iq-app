import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') }); // explicitly load server/.env

let genAIInstance = null;
export const getGenAI = () => {
    if (!genAIInstance && process.env.GEMINI_API_KEY) {
        genAIInstance = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    }
    return genAIInstance;
};

export const generateMarketSummary = async (newsItems = [], events = [], innovations = []) => {
    const genAI = getGenAI();
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
        IMPORTANT: If data is limited, synthesize a general analysis. DO NOT return placeholders like "Need to populate this report". Always provide actionable insights.
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text();

        // Clean up markdown code blocks if present
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();

        try {
            const parsed = JSON.parse(text);

            // Validation: Check for placeholders
            if (parsed.points && parsed.points.some(p => p.includes("populate") || p.includes("placeholder"))) {
                throw new Error("AI returned placeholders");
            }

            return parsed;
        } catch (e) {
            console.error("Failed to parse AI JSON or Validation Failed:", text);
            // Fallback that actually looks like analysis
            return {
                sentiment: "NEUTRAL",
                headline: "Market showing mixed signals amidst data unavailablity.",
                points: [
                    "Market volatility remains elevated.",
                    "Investors awaiting clearer macroeconomic direction.",
                    "Focus on quality assets with strong fundamentals."
                ],
                macro: { summary: "Macro outlook neutral pending further data.", signals: ["Reviewing Fed Policy", "Monitoring Inflation"] },
                ideas: ["Maintain diversified portfolio", "Watch for key technical levels"]
            };
        }

    } catch (error) {
        console.error("AI Summary Error:", error);
        return `Unable to generate market summary (Error: ${error.message || "Unknown Error"}). Please verify your API Key permissions.`;
    }
};

export const generateStockRecommendations = async (marketData) => {
    const genAI = getGenAI();
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

export const generateSectorPrediction = async (sectorName, perf, leaders) => {
    const genAI = getGenAI();
    if (!genAI) return null;

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const prompt = `
        You are a Wall Street Sector Strategist.
        Analyze the future trend for the **${sectorName}** sector for the next 1-3 months.

        ### Data
        - Returns: Today ${perf?.todayChange?.toFixed(2)}%, 1W ${perf?.oneWeek?.toFixed(2)}%, 1M ${perf?.oneMonth?.toFixed(2)}%, YTD ${perf?.ytd?.toFixed(2)}%
        - Top Movers: ${leaders?.map(l => `${l.symbol} (${l.change}%)`).join(', ') || 'None'}

        ### Output (JSON ONLY)
        {
            "outlook": "BULLISH" | "BEARISH" | "NEUTRAL",
            "summary": "1-2 sentence strategic forecast explaining the trend prediction.",
            "keys": ["Key Factor 1", "Key Factor 2"]
        }
        
        Style: Professional, concise, forward-looking.
        `;

        const result = await model.generateContent(prompt);
        const text = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(text);
    } catch (e) {
        console.error("AI Sector Prediction Error:", e);
        return {
            outlook: "NEUTRAL",
            summary: "Unable to generate specific AI prediction at this time. Monitoring technical levels.",
            keys: ["Market Volatility", "Data Availability"]
        };
    }
};

export const generateSimilarAssets = async (symbol, analysis, quote) => {
    const genAI = getGenAI();
    if (!genAI) return { similar: [], report: "AI Service Unavailable (No API Key)" };

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        const indicators = analysis.indicators || {};
        const recommendation = analysis.recommendation || {};

        const rsiVal = indicators.rsi !== null ? indicators.rsi.toFixed(2) : 'N/A';
        const macdSignal = indicators.macd && indicators.macd.histogram > 0 ? 'Bullish' : 'Bearish';
        const mainSignal = recommendation.recommendation || 'NEUTRAL';

        const technicalContext = `
        Symbol: ${symbol}
        Current Price: ${quote.regularMarketPrice || quote.price}
        Trend/Signal: ${mainSignal}
        RSI: ${rsiVal}
        MACD Momentum: ${macdSignal}
        Key Signals: ${recommendation.signals ? recommendation.signals.map(s => s.signal).join(', ') : 'None'}
        `;

        const prompt = `
        You are a Technical Analysis Expert & Market Stategist.
        Target Asset: ${symbol} (${quote.shortName || quote.name})
        
        Technical Profile:
        ${technicalContext}

        Task: 
        1. Identify 3 other stocks or ETFs that are technically similar or direct competitors with interesting setups.
        2. Generate a "Comparative Analysis Report" comparing the Target Asset (${symbol}) with these 3 alternatives.

        Output Format:
        DO NOT return a standard JSON object. Instead, output EXATCLY two parts separated by the delimiter "--- REPORT ---".
        
        Part 1: A valid JSON Array [ ... ] containing the similar assets.
        Part 2: The delimiter "--- REPORT ---"
        Part 3: The detailed Markdown comparative report.

        For the report, you MUST include a "Comparative Summary" table as the centerpiece.
        Table Columns: Feature | ${symbol} | [Peer 1] | [Peer 2] | [Peer 3]
        Table Rows: Industry, Technical Trend, Risk Level, Potential Upside, Diversification, Dividend, MACD Momentum.

        Example Output:
        [
            {
                "symbol": "AMD",
                "name": "Advanced Micro Devices",
                "reason": "Strong uptrend, similar semi-conductor technicals.",
                "similarity": "High"
            }
        ]
        --- REPORT ---
        # Comparative Analysis
        
        ## Comparative Summary
        | Feature | ${symbol} | AMD | NVDA | INTC |
        |---|---|---|---|---|
        | Industry | Semi | Semi | Semi | Semi |
        | Trend | Bullish | Bullish | Bullish | Bearish |
        ...
        `;

        const result = await model.generateContent(prompt);
        const text = result.response.text();

        const delimiter = "--- REPORT ---";
        const parts = text.split(delimiter);

        let similar = [];
        let report = "";

        // Parse JSON List
        const jsonPart = parts[0];
        const jsonStart = jsonPart.indexOf('[');
        const jsonEnd = jsonPart.lastIndexOf(']');

        if (jsonStart !== -1 && jsonEnd !== -1) {
            try {
                const jsonStr = jsonPart.substring(jsonStart, jsonEnd + 1);
                similar = JSON.parse(jsonStr);
            } catch (e) {
                console.error("JSON List Parse Error:", e);
            }
        }

        // Extract Report
        if (parts.length > 1) {
            report = parts[1].trim();
        } else {
            // Fallback: If no delimiter, maybe the AI put everything in one blob or failed the format.
            // Check if we got a list at least.
            if (similar.length > 0) {
                report = "## Report Unavailable\n\nAI generated the list but failed to format the report section.";
            } else {
                return { similar: [], report: "AI failed to generate valid response." };
            }
        }

        return { similar, report };

    } catch (e) {
        console.error("AI Similar Assets Error:", e);
        return { similar: [], report: `AI Error: ${e.message}` };
    }
};
