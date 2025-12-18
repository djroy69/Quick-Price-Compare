
export interface GroceryItem {
  platform: 'Blinkit' | 'Zepto' | 'Swiggy Instamart' | 'JioMart' | 'Flipkart Minutes';
  productName: string;
  price: number;
  currency: string;
  isAvailable: boolean;
  link?: string;
}

export interface ComparisonResult {
  items: GroceryItem[];
  sources: { title: string; uri: string }[];
  summary: string;
}
