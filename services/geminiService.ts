
import { GoogleGenAI, Type } from "@google/genai";
import { ComparisonResult, GroceryItem } from "../types";

export const comparePrices = async (productName: string): Promise<ComparisonResult> => {
  // Create instance right before call to ensure we use the current API key from the environment/dialog
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY_MISSING");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const prompt = `Search for the current price and direct purchase link for "${productName}" on the following quick commerce platforms in India: Blinkit, Zepto, Swiggy Instamart, JioMart, and Flipkart Minutes. 
  
  Please provide the price for the most common/standard unit size (e.g., 500g, 1kg, 1L).
  
  IMPORTANT: Return ONLY a valid JSON object. Do not include any preamble or markdown formatting.
  
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
      model: "gemini-3-flash-preview", // Flash is faster for grounding tasks
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
      },
    });

    const text = response.text || "";
    // Clean potential markdown artifacts
    const cleanJson = text.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
    const parsed = JSON.parse(cleanJson);
    
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources = groundingChunks
      .filter((chunk: any) => chunk.web)
      .map((chunk: any) => ({
        title: chunk.web.title || "Verified Source",
        uri: chunk.web.uri
      }));

    return {
      items: parsed.items || [],
      sources: sources,
      summary: parsed.summary || "Search complete."
    };
  } catch (error: any) {
    console.error("Gemini Service Error:", error);
    if (error.message?.includes("API key not valid") || error.message?.includes("entity was not found")) {
      throw new Error("API_KEY_INVALID");
    }
    throw error;
  }
};
