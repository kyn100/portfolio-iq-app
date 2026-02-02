import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export const generateMarketSummary = async (newsItems = [], events = []) => {
    if (!genAI) {
        return "AI Market Summary unavailable. Add GEMINI_API_KEY to Vercel env variables.";
    }

    if ((!newsItems || newsItems.length === 0) && (!events || events.length === 0)) {
        return "No sufficient news data available.";
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        // Prepare context
        const newsContext = newsItems.slice(0, 8).map(n => `- ${n.title} (${n.publisher})`).join('\n');

        const eventsContext = events.map(cat => {
            const catNews = cat.news.slice(0, 2).map(n => `- ${n.title}`).join('\n');
            return `Category: ${cat.name}\n${catNews}`;
        }).join('\n\n');

        const prompt = `
        You are an expert financial analyst. 
        Analyze the following recent market news headlines and economic events to determine the current market sentiment.
        
        HEADLINES:
        ${newsContext}

        ECONOMIC EVENTS:
        ${eventsContext}

        Task: Produce a "Market Sentiment Report" in strictly valid JSON format.
        Do not include any markdown formatting or explanation outside the JSON.
        
        JSON Structure:
        {
            "sentiment": "BULLISH" | "BEARISH" | "NEUTRAL",
            "headline": "A short, punchy 1-sentence summary of the market mood.",
            "points": [
                "Key driver 1",
                "Key driver 2",
                "Key driver 3",
                "Key driver 4",
                "Key driver 5"
            ]
        }
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
                points: ["Unable to format analysis points."]
            };
        }

    } catch (error) {
        console.error("AI Summary Error:", error);
        return "Unable to generate market summary at this time.";
    }
};
