
import { GoogleGenAI, Type } from "@google/genai";
import { ComparisonResult, GroceryItem } from "../types";

export const comparePrices = async (productName: string, location?: { lat: number; lng: number }): Promise<ComparisonResult> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY_MISSING");
  }

  const ai = new GoogleGenAI({ apiKey });

  // Use Gemini 3 Pro for high-fidelity price extraction from search grounding.
  const mainModel = "gemini-3-pro-preview";
  
  const locationContext = location 
    ? `USER LOCATION: Lat ${location.lat}, Lng ${location.lng}. Ensure prices are specific to this location.`
    : "USER LOCATION: India (General). Use national average selling prices.";

  const prompt = `ACT AS A SENIOR E-COMMERCE PRICE AUDITOR FOR INDIAN GROCERY PLATFORMS.
  
  CONTEXT:
  ${locationContext}
  USER QUERY: "${productName}"

  MANDATORY PRICING PROTOCOL:
  1. SELLING PRICE VS MRP (CRITICAL):
     - Most platforms list two prices: MRP (higher) and Selling Price (lower/discounted).
     - You MUST report the CURRENT SELLING PRICE (the price the user pays AFTER discounts).
     - EXAMPLE: If Amul Butter is MRP ₹58 but selling at ₹46, you MUST return 46. Do NOT return 55 or 58.
     - Cross-check multiple search results to find the active discount.
  
  2. PLATFORMS & SEARCH REDIRECT LINKS:
     - Use the following exact URL templates for the 'link' property.
     - Replace [QUERY] with the clean search term.
     - Blinkit: https://blinkit.com/s/?q=[QUERY]
     - Zepto: https://www.zepto.com/search?query=[QUERY]
     - Swiggy Instamart: https://www.swiggy.com/instamart/search?query=[QUERY]
     - JioMart: https://www.jiomart.com/search?q=[QUERY]&sort=price_asc
     - Flipkart: https://www.flipkart.com/search?q=[QUERY]&sort=price_asc
     - BigBasket: https://www.bigbasket.com/ps/?q=[QUERY]&sort=price_asc

  3. DATA VERIFICATION:
     - Prioritize the absolute lowest price found for any variant of "${productName}".
  
  OUTPUT JSON FORMAT:
  - items: Array of objects (platform, productName, price, isAvailable, link).
  - summary: A 1-sentence audit finding (e.g., "Flipkart has the lowest selling price for Amul Butter at ₹46").`;

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
                  currency: { type: Type.STRING },
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
