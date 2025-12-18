
import { GoogleGenAI, Type } from "@google/genai";
import { ComparisonResult, GroceryItem } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const comparePrices = async (productName: string): Promise<ComparisonResult> => {
  const prompt = `Search for the current price and direct purchase link for "${productName}" on the following quick commerce platforms in India: Blinkit, Zepto, Swiggy Instamart, JioMart, and Flipkart Minutes. 
  
  Please provide the price for the most common/standard unit size (e.g., 500g, 1kg, 1L).
  
  Return the information in a JSON format. Ensure all prices are numbers. If an item is not available on a platform, set isAvailable to false and price to 0. 
  
  For each platform, try to provide a direct link to the product or the search results page on that specific platform.
  
  The response must be valid JSON matching this schema:
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
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
      },
    });

    const text = response.text || "";
    const parsed = JSON.parse(text);
    
    // Extract grounding sources
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources = groundingChunks
      .filter((chunk: any) => chunk.web)
      .map((chunk: any) => ({
        title: chunk.web.title || "Source",
        uri: chunk.web.uri
      }));

    return {
      items: parsed.items,
      sources: sources,
      summary: parsed.summary
    };
  } catch (error) {
    console.error("Comparison Error:", error);
    throw new Error("Failed to fetch price comparison. Please try again later.");
  }
};
