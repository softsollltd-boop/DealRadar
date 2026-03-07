import { GoogleGenAI } from "@google/genai";

async function research() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  
  const prompt = `Research and confirm if Smartlead (smartlead.ai) and Instantly (instantly.ai) allow sending individual (1-to-1) emails through their platforms or APIs, as opposed to only sending through campaigns. 
  
  Please check:
  1. Official documentation/API references for "send individual email" or "one-off email" features.
  2. Blog posts or help articles discussing this.
  3. User feedback or forum discussions (e.g., Reddit, G2) about this specific limitation or feature.
  
  Provide a clear "Yes" or "No" for each, followed by the evidence/links found.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });

    console.log(response.text);
  } catch (error) {
    console.error("Research failed:", error);
  }
}

research();
