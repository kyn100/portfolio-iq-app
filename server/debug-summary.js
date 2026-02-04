import 'dotenv/config';
import { generateMarketSummary } from './services/aiSummary.js';

const run = async () => {
    const news = [{ title: "Apple hits record high on AI news", publisher: "Bloomberg" }, { title: "Fed signals rate cuts", publisher: "CNBC" }];
    const events = [{ name: "Fed Interest Rate", news: [{ title: "Powell speaks on inflation" }] }];
    const innovations = [{ title: "New Quantum Chip", publisher: "TechCrunch" }];

    console.log("Generating Summary with Mock Data...");
    const result = await generateMarketSummary(news, events, innovations);
    console.log("--- RESULT ---");
    console.log(JSON.stringify(result, null, 2));
}

run();
