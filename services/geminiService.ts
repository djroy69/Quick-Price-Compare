
import { GoogleGenAI, Type } from "@google/genai";
import { ComparisonResult, GroceryItem } from "../types";

export const comparePrices = async (productName: string): Promise<ComparisonResult> => {
  // Always obtain API key from process.env.API_KEY
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY_MISSING");
  }

  // Create instance right before call to ensure we use the current API key
  const ai = new GoogleGenAI({ apiKey });
  
  const prompt = `Search for the current price and direct purchase link for "${productName}" on the following quick commerce platforms in India: Blinkit, Zepto, Swiggy Instamart, JioMart, and Flipkart Minutes. 
  
  Please provide the price for the most common/standard unit size (e.g., 500g, 1kg, 1L).`;

  try {
    // Using gemini-3-flash-preview for fast search and grounding
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        // Using responseSchema is the recommended way to get structured data
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  platform: { 
                    type: Type.STRING,
                    description: "One of: Blinkit, Zepto, Swiggy Instamart, JioMart, Flipkart Minutes"
                  },
                  productName: { type: Type.STRING },
                  price: { type: Type.NUMBER },
                  currency: { type: Type.STRING },
                  isAvailable: { type: Type.BOOLEAN },
                  link: { type: Type.STRING }
                },
                required: ["platform", "productName", "price", "currency", "isAvailable"],
              }
            },
            summary: { type: Type.STRING }
          },
          required: ["items", "summary"]
        }
      },
    });

    // The .text property returns the JSON string directly when responseMimeType is application/json
    const text = response.text || "{}";
    const parsed = JSON.parse(text);
    
    // Extracting URLs from groundingChunks as required by Google Search grounding guidelines
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
    // Handle specific API key errors gracefully
    if (error.message?.includes("API key not valid") || error.message?.includes("entity was not found")) {
      throw new Error("API_KEY_INVALID");
    }
    throw error;
  }
};
