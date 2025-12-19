
import { GoogleGenAI, Type } from "@google/genai";
import { ComparisonResult, GroceryItem } from "../types";

/**
 * Fetches autocomplete suggestions for grocery items based on user input.
 */
export const getSuggestions = async (input: string): Promise<string[]> => {
  if (!input || input.length < 2) return [];

  // Initialize client inside function to ensure environment variables are loaded
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `ACT AS A GROCERY SEARCH ENGINE. 
      Input: "${input}"
      Task: Suggest 5-7 popular, specific grocery product names available in India (Quick Commerce).
      Examples: "Amul Butter 100g", "Maggi Masala Noodles 4-pack", "Coca Cola 750ml".
      Return ONLY a JSON array of strings.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });

    const text = response.text || "[]";
    return JSON.parse(text);
  } catch (error) {
    console.error("Autocomplete error:", error);
    return [];
  }
};

export const comparePrices = async (productName: string, location?: { lat: number; lng: number }): Promise<ComparisonResult> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY_MISSING");
  }

  const ai = new GoogleGenAI({ apiKey });

  // Use Gemini 3 Pro for high-fidelity price extraction from search grounding.
  const mainModel = "gemini-3-pro-preview";
  
  const locationContext = location 
    ? `USER LOCATION: Lat ${location.lat}, Lng ${location.lng}. Fetch prices specific to this city/region.`
    : "USER LOCATION: India (General). Use national average selling prices.";

  const prompt = `ACT AS A SENIOR PRICE AUDITOR FOR INDIAN QUICK-COMMERCE APPS.
  
  CONTEXT:
  ${locationContext}
  USER QUERY: "${productName}"

  STRICT PROTOCOLS:
  1. QUERY REFINEMENT: If input is vague (e.g., "butter"), compare the most popular specific variant (e.g., "Amul Butter 100g").
  
  2. SELLING PRICE ONLY:
     - Return the CURRENT SELLING PRICE (the price the user pays AFTER all discounts/coupons).
     - NEVER return the MRP if a lower price is available.
  
  3. EXACT URL GENERATION (CRITICAL):
     - Generate 'link' using these exact patterns. Replace [QUERY] with the URL-encoded search term.
     - Blinkit: https://blinkit.com/s/?q=[QUERY]
     - Zepto: https://www.zepto.com/search?query=[QUERY]
     - Swiggy Instamart: https://www.swiggy.com/instamart/search?query=[QUERY]
     - JioMart: https://www.jiomart.com/search?q=[QUERY]&sort=price_asc
     - Flipkart: https://www.flipkart.com/search?q=[QUERY]&sort=price_asc
     - BigBasket: https://www.bigbasket.com/ps/?q=[QUERY]&sort=price_asc

  4. DATA EXTRACTION:
     - Use Google Search Grounding to find the latest prices from today.
  
  OUTPUT JSON FORMAT:
  - items: Array of objects (platform, productName, price, isAvailable, link).
  - summary: A 1-sentence finding about which app has the best deal right now.`;

  try {
    const response = await ai.models.generateContent({
      model: mainModel,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        thinkingConfig: { thinkingBudget: 32768 },
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  platform: { type: Type.STRING },
                  productName: { type: Type.STRING },
                  price: { type: Type.NUMBER },
                  isAvailable: { type: Type.BOOLEAN },
                  link: { type: Type.STRING }
                },
                required: ["platform", "productName", "price", "isAvailable", "link"],
              }
            },
            summary: { type: Type.STRING }
          },
          required: ["items", "summary"]
        }
      },
    });

    const text = response.text || "{}";
    const parsed = JSON.parse(text);
    
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources = groundingChunks
      .filter((chunk: any) => chunk.web)
      .map((chunk: any) => ({
        title: chunk.web.title || "Market Source",
        uri: chunk.web.uri
      }));

    return {
      items: parsed.items || [],
      sources: sources,
      summary: parsed.summary || ""
    };
  } catch (error: any) {
    console.error("Price Audit Error:", error);
    throw error;
  }
};
