
import { GoogleGenAI, Type } from "@google/genai";
import { ComparisonResult, GroceryItem } from "../types";

export const comparePrices = async (productName: string): Promise<ComparisonResult> => {
  // Always initialize with the current process.env.API_KEY to ensure fresh context
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `Search for the current price and direct purchase link for "${productName}" on the following quick commerce platforms in India: Blinkit, Zepto, Swiggy Instamart, JioMart, and Flipkart Minutes. 
  
  Please provide the price for the most common/standard unit size (e.g., 500g, 1kg, 1L).
  
  IMPORTANT: Return ONLY a valid JSON object. Do not include any preamble or markdown formatting like \`\`\`json.
  
  Required JSON schema:
  {
    "items": [
      {
        "platform": "String (one of: Blinkit, Zepto, Swiggy Instamart, JioMart, Flipkart Minutes)",
        "productName": "String (exact product name found)",
        "price": Number (in INR),
        "currency": "INR",
        "isAvailable": Boolean,
        "link": "String (URL to buy or search results on platform)"
      }
    ],
    "summary": "String (A brief summary of which platform is cheapest today for this item)"
  }`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview", // Upgraded for better reasoning and reliability with search grounding
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        // Using responseMimeType to enforce JSON
        responseMimeType: "application/json",
      },
    });

    const text = response.text || "";
    
    // Robust JSON cleaning: remove markdown block markers if present
    const cleanJson = text.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
    const parsed = JSON.parse(cleanJson);
    
    // Extract grounding sources for verification
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources = groundingChunks
      .filter((chunk: any) => chunk.web)
      .map((chunk: any) => ({
        title: chunk.web.title || "Source",
        uri: chunk.web.uri
      }));

    return {
      items: parsed.items || [],
      sources: sources,
      summary: parsed.summary || "Comparison complete."
    };
  } catch (error: any) {
    console.error("Comparison Error Details:", error);
    
    // Provide a more descriptive error message if it's a known issue
    if (error.message?.includes("API_KEY")) {
      throw new Error("API Key configuration missing or invalid.");
    }
    
    throw new Error("Unable to fetch live prices right now. This could be due to platform rate limits or connectivity. Please try again in a few moments.");
  }
};
