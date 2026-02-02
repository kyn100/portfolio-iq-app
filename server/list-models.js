import 'dotenv/config';
import { GoogleGenerativeAI } from "@google/generative-ai";

const listModels = async () => {
    const apiKey = process.env.GEMINI_API_KEY;
    console.log("Using API Key:", apiKey ? "Present" : "Missing");

    if (!apiKey) {
        console.error("No API Key found.");
        return;
    }

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        // Note: listModels is on the genAI instance or model manager?
        // The SDK confusingly puts it on the GoogleGenerativeAI instance? 
        // Actually, verify SDK docs. It's usually not on the main client in older versions, 
        // but let's try catching the error or using a simple fetch if SDK fails.
        // Wait, SDK doesn't expose listModels in the main entry easily in all versions.

        // Let's try to fetch directly using REST to be sure.
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);

        if (!response.ok) {
            console.error(`Error: ${response.status} ${response.statusText}`);
            const text = await response.text();
            console.error(text);
            return;
        }

        const data = await response.json();
        console.log("\n--- Available Models ---");
        const generateModels = data.models.filter(m => m.supportedGenerationMethods.includes("generateContent"));

        generateModels.forEach(m => {
            console.log(`- ${m.name.replace('models/', '')} (Version: ${m.version})`);
        });

        if (generateModels.length === 0) {
            console.log("No models found with 'generateContent' capability.");
            console.log("Raw models:", data.models);
        }

    } catch (error) {
        console.error("Script Error:", error);
    }
};

listModels();
