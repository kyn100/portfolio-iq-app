import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export const generateMarketSummary = async (newsItems = [], events = []) => {
    if (!genAI) {
        return "AI Market Summary unavailable. Please add GEMINI_API_KEY to your env variables.";
    }

    if ((!newsItems || newsItems.length === 0) && (!events || events.length === 0)) {
        return "No sufficient news data available to generate a summary.";
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        // Prepare context from news
        const newsContext = newsItems.slice(0, 8).map(n => `- ${n.title} (${n.publisher})`).join('\n');

        // Prepare context from events
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

        Task: Produce a "Market Sentiment Report".
        1. Classify the overall sentiment as **BULLISH**, **BEARISH**, or **NEUTRAL** (in bold).
        2. Provide 3 concise bullet points explaining the key drivers (Fed, Earnings, Geopolitics).
        3. Keep it under 100 words total.
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();

    } catch (error) {
        console.error("AI Summary Error:", error);
        return "Unable to generate market summary at this time.";
    }
};
