
import React, { useState, useMemo } from 'react';
import { Search, ShoppingBasket, ExternalLink, Info, AlertCircle, CheckCircle, TrendingDown, RefreshCcw, ShoppingCart, Zap, Package, Store, Clock } from 'lucide-react';
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
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 sm:h-20 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-green-600 font-black text-lg sm:text-2xl shrink-0 tracking-tight">
            <div className="bg-green-600 p-1.5 rounded-lg">
              <ShoppingBasket className="w-5 h-5 sm:w-6 h-6 text-white" />
            </div>
            <span className="hidden sm:inline">QuickPrice</span>
            <span className="sm:hidden">QP</span>
          </div>
          <form onSubmit={handleSearch} className="flex-1 max-w-2xl relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search groceries (Milk, Bread, etc)..."
              className="w-full pl-10 pr-24 py-2.5 sm:py-3 bg-slate-100 border-2 border-transparent rounded-2xl focus:ring-0 focus:border-green-500 focus:bg-white transition-all outline-none text-sm sm:text-base"
            />
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 h-5 text-slate-400" />
            <button 
              type="submit"
              disabled={loading}
              className="absolute right-1.5 top-1.5 bottom-1.5 bg-green-600 text-white px-4 sm:px-6 rounded-xl text-xs sm:text-sm font-bold hover:bg-green-700 disabled:opacity-50 transition-all active:scale-95"
            >
              {loading ? '...' : 'Find Price'}
            </button>
          </form>
        </div>
      </header>

      <main className="flex-grow max-w-6xl mx-auto px-4 py-8 sm:py-12 w-full">
        {!result && !loading && !error && (
          <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in zoom-in duration-700">
            <div className="w-20 h-20 sm:w-28 sm:h-28 bg-green-50 rounded-full flex items-center justify-center mb-8 relative">
              <Zap className="absolute -top-1 -right-1 text-yellow-500 w-8 h-8 animate-bounce" />
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
            <p className="text-slate-400 text-sm mt-2 px-4 animate-pulse">Checking live prices for "{query}"</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border-2 border-red-100 p-6 rounded-3xl flex flex-col sm:flex-row items-center sm:items-start gap-4 max-w-2xl mx-auto text-center sm:text-left">
            <AlertCircle className="w-10 h-10 text-red-500 shrink-0" />
            <div>
              <h3 className="text-lg font-black text-red-800">Something went wrong</h3>
              <p className="text-red-700 mt-1 font-medium">{error}</p>
              <button 
                onClick={handleSearch}
                className="mt-4 bg-red-100 text-red-800 px-6 py-2 rounded-xl text-sm font-bold hover:bg-red-200 transition-all flex items-center gap-2 mx-auto sm:mx-0"
              >
                <RefreshCcw className="w-4 h-4" /> Try Again
              </button>
            </div>
          </div>
        )}

        {result && !loading && (
          <div className="space-y-8 sm:space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-500">
            {/* Summary Banner */}
            <div className="flex flex-col lg:flex-row gap-6 lg:items-center justify-between">
              <div className="px-1">
                <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight mb-2 uppercase italic">
                  {query}
                </h2>
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    <div className="w-6 h-6 rounded-full bg-yellow-400 border-2 border-white"></div>
                    <div className="w-6 h-6 rounded-full bg-purple-500 border-2 border-white"></div>
                    <div className="w-6 h-6 rounded-full bg-orange-500 border-2 border-white"></div>
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

            {/* Price Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {sortedItems.map((item, idx) => (
                <PriceCard 
                  key={`${item.platform}-${idx}`} 
                  item={item} 
                  isBest={item.isAvailable && item.price === cheapestPrice}
                />
              ))}
            </div>

            {/* Verification Footer */}
            {result.sources.length > 0 && (
              <div className="mt-12 bg-white rounded-[2.5rem] p-6 sm:p-10 border border-slate-200 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <Info className="w-5 h-5 text-green-600" />
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Verified Sources</h3>
                </div>
                <div className="flex flex-wrap gap-2 sm:gap-4">
                  {result.sources.map((source, i) => (
                    <a 
                      key={i}
                      href={source.uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center gap-2.5 bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-2xl text-xs font-bold text-slate-600 hover:bg-green-50 hover:border-green-200 hover:text-green-700 transition-all"
                    >
                      <span className="truncate max-w-[150px] sm:max-w-[250px]">{source.title}</span>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-300 group-hover:text-green-500 transition-colors" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="bg-white border-t border-slate-200 py-10 px-4">
        <div className="max-w-6xl mx-auto text-center space-y-2">
          <p className="text-slate-400 text-xs sm:text-sm font-medium">
            © {new Date().getFullYear()} QuickPrice Compare • All prices are subject to change.
          </p>
          <p className="text-slate-500 text-xs sm:text-sm font-bold">
            Designed and developed by <span className="text-green-600">Debajyoti Roy</span> with ❤
          </p>
        </div>
      </footer>
    </div>
  );
};

const PriceCard: React.FC<{ item: GroceryItem; isBest?: boolean }> = ({ item, isBest }) => {
  const getPlatformStyle = (platform: string) => {
    switch(platform) {
      case 'Blinkit': 
        return { 
          text: 'text-yellow-700', 
          bg: 'bg-yellow-50', 
          border: 'border-yellow-200', 
          button: 'bg-yellow-400 hover:bg-yellow-500 text-black',
          logo: <Zap className="w-4 h-4 text-yellow-600 fill-yellow-600" />
        };
      case 'Zepto': 
        return { 
          text: 'text-purple-700', 
          bg: 'bg-purple-50', 
          border: 'border-purple-200', 
          button: 'bg-purple-600 hover:bg-purple-700 text-white',
          logo: <Clock className="w-4 h-4 text-purple-600" />
        };
      case 'Swiggy Instamart': 
        return { 
          text: 'text-orange-700', 
          bg: 'bg-orange-50', 
          border: 'border-orange-200', 
          button: 'bg-orange-600 hover:bg-orange-700 text-white',
          logo: <ShoppingCart className="w-4 h-4 text-orange-600" />
        };
      case 'JioMart': 
        return { 
          text: 'text-blue-700', 
          bg: 'bg-blue-50', 
          border: 'border-blue-200', 
          button: 'bg-blue-700 hover:bg-blue-800 text-white',
          logo: <Store className="w-4 h-4 text-blue-600" />
        };
      case 'Flipkart Minutes': 
        return { 
          text: 'text-sky-800', 
          bg: 'bg-sky-50', 
          border: 'border-sky-200', 
          button: 'bg-sky-600 hover:bg-sky-700 text-white',
          logo: <Package className="w-4 h-4 text-sky-600" />
        };
      default: 
        return { 
          text: 'text-slate-700', 
          bg: 'bg-slate-50', 
          border: 'border-slate-200', 
          button: 'bg-slate-900 hover:bg-black text-white',
          logo: <ShoppingCart className="w-4 h-4 text-slate-500" />
        };
    }
  };

  const style = getPlatformStyle(item.platform);

  return (
    <div className={`relative flex flex-col h-full bg-white rounded-[2.5rem] border-4 transition-all p-6 sm:p-8 ${
      isBest ? 'border-green-500 shadow-2xl shadow-green-100 scale-[1.03]' : 'border-transparent shadow-sm hover:shadow-xl hover:border-slate-100'
    }`}>
      {isBest && (
        <div className="absolute -top-5 left-8 bg-green-600 text-white text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] px-4 py-2 rounded-full flex items-center gap-2 z-10 shadow-lg border border-green-400 ring-4 ring-white">
          <CheckCircle className="w-3.5 h-3.5 sm:w-4 h-4" />
          Cheapest Deal
        </div>
      )}

      <div className="flex justify-between items-start mb-6">
        <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-[10px] sm:text-xs font-black uppercase tracking-widest border-2 ${style.text} ${style.bg} ${style.border}`}>
          {style.logo}
          {item.platform}
        </div>
        {item.isAvailable ? (
          <div className="flex items-center gap-1.5 text-[10px] font-black text-green-600 bg-green-50 px-3 py-1.5 rounded-full border border-green-100">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            STOCK OK
          </div>
        ) : (
          <div className="text-[10px] font-black text-red-500 bg-red-50 px-3 py-1.5 rounded-full border border-red-100">
            SOLD OUT
          </div>
        )}
      </div>

      <div className="flex-grow mb-6">
        <h4 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight mb-2 group-hover:text-green-600 transition-colors">
          {item.productName || 'Product unlisted'}
        </h4>
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Live Inventory Price</p>
      </div>

      <div className="mt-auto space-y-6">
        <div className="flex items-end justify-between border-t-2 border-slate-50 pt-6">
          <div className="flex flex-col">
            <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Pricing</span>
            {item.isAvailable ? (
              <div className="flex items-baseline gap-0.5 mt-1">
                <span className="text-xl font-black text-slate-400 mr-0.5 tracking-tighter">₹</span>
                <span className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tighter leading-none">{item.price}</span>
              </div>
            ) : (
              <span className="text-xl font-black text-slate-300 mt-1 italic uppercase">— NA —</span>
            )}
          </div>
          {item.isAvailable && isBest && (
            <div className="text-green-600 font-black text-[10px] bg-green-100 px-3 py-1.5 rounded-xl border border-green-200">
              SAVE ₹₹₹
            </div>
          )}
        </div>

        {item.isAvailable && item.link ? (
          <a
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            className={`w-full py-4 px-6 rounded-2xl font-black text-sm sm:text-base text-center flex items-center justify-center gap-3 transition-all shadow-xl active:scale-95 ${style.button}`}
          >
            <ShoppingCart className="w-5 h-5" />
            Order on {item.platform}
          </a>
        ) : (
          <div className="w-full py-4 px-6 rounded-2xl bg-slate-50 text-slate-300 font-black text-sm text-center border-2 border-slate-100 cursor-not-allowed uppercase italic tracking-widest">
            Notify Me
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
