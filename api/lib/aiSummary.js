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
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        // Prepare context
        const newsContext = newsItems.slice(0, 8).map(n => `- ${n.title} (${n.publisher})`).join('\n');

        const eventsContext = events.map(cat => {
            const catNews = cat.news.slice(0, 2).map(n => `- ${n.title}`).join('\n');
            return `Category: ${cat.name}\n${catNews}`;
        }).join('\n\n');

        const prompt = `
        You are an expert financial analyst. 
        Analyze the following recent market news headlines and economic events.
        
        HEADLINES:
        ${newsContext}

        ECONOMIC EVENTS:
        ${eventsContext}

         Task: Write a concise, professional "Daily Market Briefing" (max 3-4 bullet points).
        Focus on the biggest drivers: Inflation/Fed, Market Sentiment, and Major sector moves.
        Do not use markdown formatting like **bold** just use plain text or simple bullets.
        Start with a brief 1-sentence overview.
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();

    } catch (error) {
        console.error("AI Summary Error:", error);
        return "Unable to generate market summary at this time.";
    }
};
