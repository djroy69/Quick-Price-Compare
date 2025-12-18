
import React, { useState, useMemo } from 'react';
import { Search, ShoppingBasket, ExternalLink, Info, AlertCircle, CheckCircle, TrendingDown, RefreshCcw, ShoppingCart, Zap } from 'lucide-react';
import { comparePrices } from './services/geminiService';
import { ComparisonResult, GroceryItem } from './types';

// PriceCard component handles individual platform pricing details
const PriceCard: React.FC<{ item: GroceryItem; isBest: boolean }> = ({ item, isBest }) => {
  return (
    <div className={`
      relative bg-white rounded-[2.5rem] p-6 sm:p-8 flex flex-col gap-6 transition-all duration-300
      ${isBest ? 'ring-4 ring-green-600 shadow-2xl shadow-green-100 scale-105 z-10' : 'border border-slate-100 shadow-xl shadow-slate-100/50 hover:border-green-200'}
    `}>
      {isBest && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-green-600 text-white px-6 py-1.5 rounded-full text-xs font-black uppercase tracking-widest shadow-lg flex items-center gap-1.5 whitespace-nowrap">
          <Zap className="w-3 h-3 fill-current" /> Best Deal
        </div>
      )}

      <div className="flex justify-between items-start">
        <div className="bg-slate-50 px-4 py-2 rounded-2xl text-xs font-black text-slate-400 uppercase tracking-tighter border border-slate-100">
          {item.platform}
        </div>
        {item.isAvailable ? (
          <CheckCircle className="w-6 h-6 text-green-500" />
        ) : (
          <AlertCircle className="w-6 h-6 text-slate-300" />
        )}
      </div>

      <div className="flex-1">
        <h4 className="text-slate-900 font-extrabold text-xl mb-1 line-clamp-2 leading-tight">
          {item.productName}
        </h4>
        <p className="text-slate-400 text-sm font-medium">Standard Unit Size</p>
      </div>

      <div className="flex items-end justify-between gap-4 mt-auto pt-6 border-t border-slate-50">
        <div>
          <span className="text-slate-400 text-sm font-bold block mb-1 uppercase tracking-wider">Price</span>
          <div className="flex items-baseline gap-1">
            <span className="text-slate-900 text-3xl font-black">{item.currency} {item.price}</span>
          </div>
        </div>
        
        {item.link ? (
          <a 
            href={item.link} 
            target="_blank" 
            rel="noopener noreferrer"
            className={`
              p-3.5 rounded-2xl transition-all active:scale-90 shadow-lg
              ${isBest ? 'bg-green-600 text-white hover:bg-green-700 shadow-green-200' : 'bg-slate-900 text-white hover:bg-black shadow-slate-200'}
            `}
          >
            <ExternalLink className="w-5 h-5" />
          </a>
        ) : (
          <div className="p-3.5 rounded-2xl bg-slate-100 text-slate-400 cursor-not-allowed">
            <ShoppingCart className="w-5 h-5" />
          </div>
        )}
      </div>
      
      {!item.isAvailable && (
        <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] rounded-[2.5rem] flex items-center justify-center">
          <div className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-black text-sm uppercase tracking-widest rotate-[-12deg] shadow-2xl">
            Out of Stock
          </div>
        </div>
      )}
    </div>
  );
};

const App: React.FC = () => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ComparisonResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || loading) return;

    setLoading(true);
    setError(null);
    try {
      const data = await comparePrices(query);
      setResult(data);
    } catch (err: any) {
      console.error("App Search Error:", err);
      const errorMessage = err.message === "API_KEY_MISSING" || err.message === "API_KEY_INVALID"
        ? "API configuration issue. Please check your environment setup."
        : (err.message || "Failed to fetch price comparison. Please try again later.");
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const sortedItems = useMemo(() => {
    if (!result) return [];
    return [...result.items].sort((a, b) => {
      if (!a.isAvailable) return 1;
      if (!b.isAvailable) return -1;
      return a.price - b.price;
    });
  }, [result]);

  const cheapestPrice = useMemo(() => {
    const available = sortedItems.filter(i => i.isAvailable);
    return available.length > 0 ? available[0].price : null;
  }, [sortedItems]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-green-100 selection:text-green-900">
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 sm:h-20 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-green-600 font-black text-lg sm:text-2xl shrink-0 tracking-tight">
            <div className="bg-green-600 p-1.5 rounded-lg shadow-sm shadow-green-200">
              <ShoppingBasket className="w-5 h-5 sm:w-6 h-6 text-white" />
            </div>
            <span className="hidden sm:inline">QuickPrice</span>
          </div>
          <form onSubmit={handleSearch} className="flex-1 max-w-2xl relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search groceries (Milk, Bread, etc)..."
              className="w-full pl-10 pr-24 py-2.5 sm:py-3 bg-slate-100 border-2 border-transparent rounded-2xl focus:ring-0 focus:border-green-500 focus:bg-white transition-all outline-none text-sm sm:text-base shadow-inner"
            />
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 h-5 text-slate-400" />
            <button 
              type="submit"
              disabled={loading}
              className="absolute right-1.5 top-1.5 bottom-1.5 bg-green-600 text-white px-4 sm:px-6 rounded-xl text-xs sm:text-sm font-bold hover:bg-green-700 disabled:opacity-50 transition-all active:scale-95 shadow-md shadow-green-100"
            >
              {loading ? '...' : 'Find Price'}
            </button>
          </form>
        </div>
      </header>

      <main className="flex-grow max-w-6xl mx-auto px-4 py-8 sm:py-12 w-full">
        {!result && !loading && !error && (
          <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in zoom-in duration-700">
            <div className="w-20 h-20 sm:w-28 sm:h-28 bg-green-50 rounded-full flex items-center justify-center mb-8 relative shadow-inner">
              <Zap className="absolute -top-1 -right-1 text-yellow-500 w-8 h-8 animate-bounce drop-shadow-sm" />
              <ShoppingBasket className="w-10 h-10 sm:w-14 sm:h-14 text-green-600" />
            </div>
            <h1 className="text-3xl sm:text-5xl font-black text-slate-900 mb-4 px-4 tracking-tight leading-tight">
              India's Instant Price <span className="text-green-600">Comparison</span>
            </h1>
            <p className="text-slate-500 text-base sm:text-xl max-w-xl px-6 font-medium leading-relaxed">
              Find the best deals on Blinkit, Zepto, Swiggy Instamart, and more in seconds.
            </p>
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="relative mb-6">
              <div className="w-16 h-16 sm:w-20 sm:h-20 border-4 border-green-100 border-t-green-600 rounded-full animate-spin"></div>
              <Search className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-green-600" />
            </div>
            <p className="text-slate-700 font-bold text-lg sm:text-xl px-4">Searching Platform Inventories...</p>
            <p className="text-slate-400 text-sm mt-2 px-4 animate-pulse italic">Checking live prices for "{query}"</p>
          </div>
        )}

        {error && (
          <div className="bg-white border-2 border-red-100 p-8 sm:p-10 rounded-[2.5rem] flex flex-col items-center gap-6 max-w-2xl mx-auto text-center shadow-xl shadow-red-50 animate-in fade-in slide-in-from-top-4">
            <div className="bg-red-50 p-4 rounded-full">
              <AlertCircle className="w-12 h-12 text-red-500 shrink-0" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-900 mb-2">Something went wrong</h3>
              <p className="text-slate-500 font-medium leading-relaxed max-w-md mx-auto">{error}</p>
              <button 
                onClick={handleSearch}
                className="mt-6 bg-slate-900 text-white px-8 py-3 rounded-2xl text-sm font-bold hover:bg-black transition-all flex items-center gap-2 mx-auto active:scale-95 shadow-lg shadow-slate-200"
              >
                <RefreshCcw className="w-4 h-4" /> Try Again
              </button>
            </div>
          </div>
        )}

        {result && !loading && (
          <div className="space-y-8 sm:space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-500">
            <div className="flex flex-col lg:flex-row gap-6 lg:items-center justify-between">
              <div className="px-1">
                <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight mb-2 uppercase italic">
                  {query}
                </h2>
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    <div className="w-6 h-6 rounded-full bg-yellow-400 border-2 border-white shadow-sm"></div>
                    <div className="w-6 h-6 rounded-full bg-purple-500 border-2 border-white shadow-sm"></div>
                    <div className="w-6 h-6 rounded-full bg-orange-500 border-2 border-white shadow-sm"></div>
                  </div>
                  <span className="text-slate-500 text-xs sm:text-sm font-bold uppercase tracking-widest">Across 5 Platforms</span>
                </div>
              </div>
              
              {result.summary && (
                <div className="bg-green-600 text-white p-4 sm:p-6 rounded-[2rem] flex items-center gap-4 shadow-xl shadow-green-100 lg:max-w-md transform lg:-rotate-1">
                  <TrendingDown className="w-8 h-8 shrink-0 bg-white/20 p-1.5 rounded-full" />
                  <span className="font-bold text-sm sm:text-base leading-snug">{result.summary}</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {sortedItems.map((item, idx) => (
                <PriceCard 
                  key={`${item.platform}-${idx}`} 
                  item={item} 
                  isBest={item.isAvailable && item.price === cheapestPrice}
                />
              ))}
            </div>

            {/* Verification Footer with extracted URLs from groundingChunks */}
            {result.sources.length > 0 && (
              <div className="mt-12 pt-8 border-t border-slate-200">
                <div className="flex items-center gap-2 mb-6 text-slate-400">
                  <Info className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-widest">Verified Sources & Research</span>
                </div>
                <div className="flex flex-wrap gap-3">
                  {result.sources.map((source, i) => (
                    <a 
                      key={i} 
                      href={source.uri} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="bg-white border border-slate-200 px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:border-green-400 hover:text-green-600 transition-all flex items-center gap-2 shadow-sm"
                    >
                      <ExternalLink className="w-3 h-3" />
                      {source.title}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="bg-slate-900 text-slate-500 py-12 px-4 text-center mt-20">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center gap-2 text-white font-black text-xl mb-4">
            <ShoppingBasket className="w-6 h-6 text-green-500" />
            QuickPrice
          </div>
          <p className="text-sm max-w-md mx-auto mb-8 font-medium">
            Helping you save money on every grocery run with real-time price comparisons across India's top quick commerce platforms.
          </p>
          <div className="flex items-center justify-center gap-6 text-xs font-bold uppercase tracking-[0.2em]">
            <span className="hover:text-white cursor-pointer transition-colors">About</span>
            <span className="hover:text-white cursor-pointer transition-colors">Privacy</span>
            <span className="hover:text-white cursor-pointer transition-colors">Terms</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
