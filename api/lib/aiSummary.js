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
            "ideas": [
                "Identify 1 great new emerging idea/trend from the Innovation News",
                "Identify a second emerging idea or technology breakdown"
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
                points: ["Unable to format analysis points."],
                ideas: []
            };
        }

    } catch (error) {
        console.error("AI Summary Error:", error);
        return `Unable to generate market summary (Error: ${error.message || "Unknown Error"}). Please verify your API Key permissions.`;
    }
};
