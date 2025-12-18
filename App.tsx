
import React, { useState, useMemo } from 'react';
import { Search, ShoppingBasket, ExternalLink, Info, AlertCircle, CheckCircle, TrendingDown, RefreshCcw, ShoppingCart } from 'lucide-react';
import { comparePrices } from './services/geminiService';
import { ComparisonResult, GroceryItem } from './types';

const App: React.FC = () => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ComparisonResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const data = await comparePrices(query);
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
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
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 h-16 sm:h-20 flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-1.5 sm:gap-2 text-green-600 font-bold text-lg sm:text-xl shrink-0">
            <ShoppingBasket className="w-6 h-6 sm:w-8 h-8" />
            <span className="hidden md:inline">QuickPrice Compare</span>
            <span className="md:hidden">QPC</span>
          </div>
          <form onSubmit={handleSearch} className="flex-1 max-w-2xl relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Milk, Eggs, Bread..."
              className="w-full pl-9 sm:pl-10 pr-16 sm:pr-20 py-2 sm:py-2.5 bg-slate-100 border-none rounded-full focus:ring-2 focus:ring-green-500 focus:bg-white transition-all outline-none text-sm sm:text-base"
            />
            <Search className="absolute left-3 top-2.5 sm:top-3 w-4 h-4 sm:w-5 h-5 text-slate-400" />
            <button 
              type="submit"
              disabled={loading}
              className="absolute right-1 top-1 bottom-1 bg-green-600 text-white px-3 sm:px-5 rounded-full text-xs sm:text-sm font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {loading ? '...' : 'Search'}
            </button>
          </form>
        </div>
      </header>

      <main className="flex-grow max-w-6xl mx-auto px-4 py-6 sm:py-10 w-full">
        {!result && !loading && !error && (
          <div className="flex flex-col items-center justify-center py-16 sm:py-24 text-center">
            <div className="w-16 h-16 sm:w-24 sm:h-24 bg-green-100 rounded-full flex items-center justify-center mb-6 sm:mb-8">
              <ShoppingBasket className="w-8 h-8 sm:w-12 sm:h-12 text-green-600" />
            </div>
            <h1 className="text-2xl sm:text-4xl font-bold text-slate-800 mb-3 sm:mb-4 px-4">Compare Grocery Prices Instantly</h1>
            <p className="text-slate-500 text-sm sm:text-lg max-w-lg px-6 leading-relaxed">
              We scan <b>Blinkit, Zepto, Instamart, JioMart</b>, and <b>Flipkart Minutes</b> to find you the absolute best price.
            </p>
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-10 h-10 sm:w-12 sm:h-12 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mb-4"></div>
            <p className="text-slate-600 font-medium px-4">Searching all platforms for the best price...</p>
            <p className="text-slate-400 text-xs sm:text-sm mt-1 px-4">Fetching live data, this may take a moment.</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 p-4 sm:p-5 rounded-2xl flex items-start gap-3 sm:gap-4 max-w-2xl mx-auto">
            <AlertCircle className="w-5 h-5 sm:w-6 h-6 text-red-500 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-red-800">Connection issue</h3>
              <p className="text-red-700 text-sm sm:text-base">{error}</p>
              <button 
                onClick={handleSearch}
                className="mt-3 text-sm font-bold text-red-800 underline hover:no-underline flex items-center gap-1.5"
              >
                <RefreshCcw className="w-3.5 h-3.5" /> Try again
              </button>
            </div>
          </div>
        )}

        {result && !loading && (
          <div className="space-y-6 sm:space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header / Summary */}
            <div className="flex flex-col lg:flex-row gap-4 lg:items-center justify-between px-1">
              <div>
                <h2 className="text-xl sm:text-3xl font-extrabold text-slate-900 leading-tight">
                  {query}
                </h2>
                <div className="mt-1.5 flex items-center gap-1.5 text-slate-500 text-xs sm:text-sm">
                  <Info className="w-4 h-4 text-slate-400" />
                  Showing real-time stock and prices
                </div>
              </div>
              {result.summary && (
                <div className="bg-blue-600 text-white p-3.5 sm:p-4 rounded-2xl flex items-center gap-3 text-sm sm:text-base shadow-lg shadow-blue-100 lg:max-w-md">
                  <div className="bg-blue-500 p-1.5 rounded-lg">
                    <TrendingDown className="w-5 h-5 shrink-0" />
                  </div>
                  <span className="font-medium leading-snug">{result.summary}</span>
                </div>
              )}
            </div>

            {/* Price Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {sortedItems.map((item, idx) => (
                <PriceCard 
                  key={`${item.platform}-${idx}`} 
                  item={item} 
                  isBest={item.isAvailable && item.price === cheapestPrice}
                />
              ))}
            </div>

            {/* Grounding Sources */}
            {result.sources.length > 0 && (
              <div className="mt-8 sm:mt-16 bg-white rounded-2xl p-5 sm:p-8 border border-slate-200">
                <h3 className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                  <ExternalLink className="w-3.5 h-3.5 sm:w-4 h-4" />
                  Live Data Sources
                </h3>
                <div className="flex flex-wrap gap-2 sm:gap-3">
                  {result.sources.map((source, i) => (
                    <a 
                      key={i}
                      href={source.uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 sm:px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:border-slate-300 transition-all active:scale-95"
                    >
                      <span className="truncate max-w-[120px] sm:max-w-[200px]">{source.title}</span>
                      <ExternalLink className="w-3 h-3 text-slate-400 shrink-0" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="bg-white border-t border-slate-200 py-8">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-slate-400 text-xs sm:text-sm">
            © {new Date().getFullYear()} QuickPrice Compare. Prices are fetched dynamically and may vary by location.
          </p>
        </div>
      </footer>
    </div>
  );
};

const PriceCard: React.FC<{ item: GroceryItem; isBest?: boolean }> = ({ item, isBest }) => {
  const getPlatformColors = (platform: string) => {
    switch(platform) {
      case 'Blinkit': return { text: 'text-yellow-700', bg: 'bg-yellow-50', border: 'border-yellow-200', button: 'bg-yellow-500 hover:bg-yellow-600 shadow-yellow-100' };
      case 'Zepto': return { text: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-200', button: 'bg-purple-600 hover:bg-purple-700 shadow-purple-100' };
      case 'Swiggy Instamart': return { text: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200', button: 'bg-orange-600 hover:bg-orange-700 shadow-orange-100' };
      case 'JioMart': return { text: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200', button: 'bg-blue-600 hover:bg-blue-700 shadow-blue-100' };
      case 'Flipkart Minutes': return { text: 'text-sky-800', bg: 'bg-sky-50', border: 'border-sky-200', button: 'bg-sky-600 hover:bg-sky-700 shadow-sky-100' };
      default: return { text: 'text-slate-700', bg: 'bg-slate-50', border: 'border-slate-200', button: 'bg-slate-800 hover:bg-slate-900 shadow-slate-100' };
    }
  };

  const colors = getPlatformColors(item.platform);

  return (
    <div className={`relative flex flex-col h-full bg-white rounded-3xl border-2 transition-all p-5 sm:p-6 ${
      isBest ? 'border-green-500 shadow-xl shadow-green-50' : 'border-transparent shadow-sm hover:shadow-md hover:border-slate-200'
    }`}>
      {isBest && (
        <div className="absolute -top-3.5 left-6 bg-green-600 text-white text-[10px] sm:text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full flex items-center gap-1.5 z-10 shadow-lg shadow-green-200 border border-green-400">
          <CheckCircle className="w-3 h-3 sm:w-4 h-4" />
          Best Value
        </div>
      )}

      <div className="flex justify-between items-start mb-5">
        <div className={`px-3 py-1.5 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider border ${colors.text} ${colors.bg} ${colors.border}`}>
          {item.platform}
        </div>
        {item.isAvailable && (
          <div className="flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg border border-green-100">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
            IN STOCK
          </div>
        )}
      </div>

      <div className="flex-grow mb-6">
        <h4 className="text-base sm:text-lg font-bold text-slate-800 leading-tight mb-2 group-hover:text-green-700 transition-colors">
          {item.productName || 'Product not listed'}
        </h4>
        <p className="text-xs text-slate-400 font-medium">Verified platform pricing</p>
      </div>

      <div className="mt-auto space-y-4">
        <div className="flex items-end justify-between border-t border-slate-100 pt-5">
          <div className="flex flex-col">
            <span className="text-slate-400 text-[10px] sm:text-xs font-bold uppercase tracking-tight">Price Point</span>
            {item.isAvailable ? (
              <div className="flex items-baseline gap-0.5 mt-1">
                <span className="text-lg font-bold text-slate-500 mr-0.5">₹</span>
                <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tighter leading-none">{item.price}</span>
              </div>
            ) : (
              <span className="text-lg font-bold text-red-500 mt-1">Unavailable</span>
            )}
          </div>
          {item.isAvailable && isBest && (
            <div className="text-green-600 font-black text-xs bg-green-50 px-2 py-1 rounded-lg">
              SAVE MORE
            </div>
          )}
        </div>

        {item.isAvailable && item.link ? (
          <a
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            className={`w-full py-3.5 px-4 rounded-2xl text-white font-bold text-sm sm:text-base text-center flex items-center justify-center gap-2.5 transition-all shadow-lg active:scale-95 ${colors.button}`}
          >
            <ShoppingCart className="w-4 h-4 sm:w-5 h-5" />
            Buy on {item.platform}
          </a>
        ) : !item.isAvailable ? (
          <div className="w-full py-3.5 px-4 rounded-2xl bg-slate-100 text-slate-400 font-bold text-sm text-center border border-slate-200 cursor-not-allowed">
            Out of Stock
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default App;
