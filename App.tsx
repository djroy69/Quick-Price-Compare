
import React, { useState, useMemo } from 'react';
import { Search, ShoppingBasket, ExternalLink, Info, AlertCircle, TrendingDown, TrendingUp, ShoppingCart, Zap, Clock, Package, Store, MapPin, MapPinOff, BrainCircuit, Sparkles, LayoutGrid, X, MessageSquareWarning, ChevronDown, ListFilter } from 'lucide-react';
import { comparePrices } from './services/geminiService';
import { ComparisonResult, GroceryItem } from './types';

type SortOption = 'price_asc' | 'price_desc' | 'availability';

const PriceCard: React.FC<{ item: GroceryItem; isBest: boolean }> = ({ item, isBest }) => {
  const getPlatformStyle = (platform: string) => {
    const p = platform.toLowerCase();
    if (p.includes('blinkit')) return { text: 'text-yellow-700', bg: 'bg-yellow-50', border: 'border-yellow-200', accent: 'from-yellow-400 to-yellow-500', logo: <Zap className="w-3.5 h-3.5 text-yellow-600 fill-yellow-600" /> };
    if (p.includes('zepto')) return { text: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-200', accent: 'from-purple-600 to-purple-700', logo: <Clock className="w-3.5 h-3.5 text-purple-600" /> };
    if (p.includes('swiggy') || p.includes('instamart')) return { text: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200', accent: 'from-orange-500 to-orange-600', logo: <ShoppingCart className="w-3.5 h-3.5 text-orange-600" /> };
    if (p.includes('jiomart')) return { text: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200', accent: 'from-blue-600 to-blue-700', logo: <Store className="w-3.5 h-3.5 text-blue-600" /> };
    if (p.includes('flipkart')) return { text: 'text-sky-800', bg: 'bg-sky-50', border: 'border-sky-200', accent: 'from-sky-500 to-sky-600', logo: <Package className="w-3.5 h-3.5 text-sky-600" /> };
    if (p.includes('bigbasket')) return { text: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200', accent: 'from-green-600 to-green-700', logo: <Package className="w-3.5 h-3.5 text-green-600" /> };
    return { text: 'text-slate-700', bg: 'bg-slate-50', border: 'border-slate-200', accent: 'from-slate-700 to-slate-800', logo: <ShoppingCart className="w-3.5 h-3.5 text-slate-500" /> };
  };

  const style = getPlatformStyle(item.platform);

  return (
    <div className={`
      relative bg-white rounded-2xl p-5 flex flex-col gap-3 transition-all duration-300 border
      hover:scale-[1.02] hover:shadow-xl hover:z-10 cursor-default
      ${isBest && item.isAvailable ? 'border-emerald-500 shadow-emerald-100/40 ring-1 ring-emerald-500/10 scale-[1.01] shadow-lg' : 'border-slate-100 shadow-sm'}
    `}>
      {isBest && item.isAvailable && (
        <div className="absolute -top-3 left-5 bg-emerald-600 text-white px-3 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider shadow-lg flex items-center gap-1.5">
          <TrendingDown className="w-3 h-3" /> Best Price
        </div>
      )}

      <div className="flex justify-between items-center">
        <div className={`flex items-center gap-2 px-2.5 py-1 rounded-full text-[10px] font-black uppercase border ${style.text} ${style.bg} ${style.border}`}>
          {style.logo}
          {item.platform}
        </div>
        {!item.isAvailable && (
          <div className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-400 text-[9px] font-black uppercase">Out of Stock</div>
        )}
      </div>

      <div className="min-h-[2.5rem] flex items-center">
        <h4 className="text-slate-900 font-bold text-sm leading-snug line-clamp-2">
          {item.productName}
        </h4>
      </div>

      <div className="pt-3 border-t border-slate-50 flex flex-col gap-2 mt-auto">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[9px] font-black uppercase text-slate-400 tracking-tighter">Selling Price</span>
            <div className="flex items-baseline gap-1">
              <span className="text-slate-900 text-2xl font-black italic">₹{item.price}</span>
            </div>
          </div>
          
          {item.isAvailable && item.link && (
            <a 
              href={item.link} target="_blank" rel="noopener noreferrer"
              className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg text-white font-black text-[10px] uppercase transition-all active:scale-95 bg-gradient-to-r ${isBest ? 'from-emerald-600 to-emerald-700 shadow-emerald-100' : `${style.accent} shadow-slate-100`} shadow-md hover:shadow-lg`}
            >
              Shop Now <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
        {!item.isAvailable && (
          <div className="w-full text-center py-2 rounded-lg bg-slate-50 text-slate-300 text-[10px] font-bold uppercase border border-slate-100">Not Available</div>
        )}
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ComparisonResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locStatus, setLocStatus] = useState<'idle' | 'requesting' | 'granted' | 'denied'>('idle');
  const [showPrompt, setShowPrompt] = useState(true);
  const [sortBy, setSortBy] = useState<SortOption>('availability');

  const requestLocation = () => {
    setLocStatus('requesting');
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (p) => { 
          setLocation({ lat: p.coords.latitude, lng: p.coords.longitude }); 
          setLocStatus('granted');
          setShowPrompt(false);
        },
        () => setLocStatus('denied')
      );
    } else setLocStatus('denied');
  };

  const handleSearch = async (e?: React.FormEvent, overrideQuery?: string) => {
    e?.preventDefault();
    const activeQuery = (overrideQuery || query).trim();
    if (!activeQuery || loading) return;

    setLoading(true);
    setError(null);
    try {
      const data = await comparePrices(activeQuery, location || undefined);
      setResult(data);
    } catch (err: any) {
      setError("Audit failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const processedItems = useMemo(() => {
    if (!result) return [];
    const sorted = [...result.items].filter(item => item.price > 0);
    
    switch (sortBy) {
      case 'price_asc':
        sorted.sort((a, b) => a.price - b.price);
        break;
      case 'price_desc':
        sorted.sort((a, b) => b.price - a.price);
        break;
      case 'availability':
        // Primary: Availability (Available first), Secondary: Price Asc
        sorted.sort((a, b) => {
          if (a.isAvailable !== b.isAvailable) return a.isAvailable ? -1 : 1;
          return a.price - b.price;
        });
        break;
      default:
        sorted.sort((a, b) => (a.isAvailable === b.isAvailable ? a.price - b.price : a.isAvailable ? -1 : 1));
    }
    return sorted;
  }, [result, sortBy]);

  const cheapestPrice = useMemo(() => {
    const avail = result?.items.filter(i => i.isAvailable && i.price > 0) || [];
    if (avail.length === 0) return null;
    return Math.min(...avail.map(i => i.price));
  }, [result]);

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans selection:bg-emerald-100 text-slate-900">
      {showPrompt && locStatus !== 'granted' && (
        <div className="bg-emerald-600 text-white py-2.5 px-4 text-center relative overflow-hidden z-[60] shadow-lg">
          <div className="flex items-center justify-center gap-3 animate-in fade-in slide-in-from-top-4">
            <MapPin className="w-4 h-4" />
            <p className="text-xs font-bold tracking-tight">Enable location for hyper-local accuracy (₹).</p>
            <button onClick={requestLocation} className="bg-white text-emerald-700 px-3 py-1 rounded-lg text-[10px] font-black uppercase hover:bg-emerald-50 transition-colors shadow-sm ml-2">Enable</button>
            <button onClick={() => setShowPrompt(false)} className="absolute right-4 opacity-70 hover:opacity-100"><X className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      <header className="bg-white/95 backdrop-blur-xl border-b border-slate-100 sticky top-0 z-50 pt-5 pb-4 shadow-sm">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex items-center gap-2.5 shrink-0 group cursor-pointer self-start md:self-center" onClick={() => {setResult(null); setQuery('');}}>
              <div className="bg-emerald-600 p-2 rounded-xl shadow-lg shadow-emerald-100 transition-transform group-hover:scale-110">
                <ShoppingBasket className="w-5 h-5 text-white" />
              </div>
              <span className="hidden sm:inline font-black text-xl tracking-tighter text-slate-800 uppercase">QuickPrice</span>
            </div>
            
            <form onSubmit={handleSearch} className="flex-1 w-full relative group">
              <input
                type="text" value={query} onChange={(e) => setQuery(e.target.value)}
                placeholder="Search Groceries (e.g. Amul Butter)..."
                className="w-full pl-11 pr-32 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/5 transition-all outline-none text-sm font-semibold"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
              <button type="submit" disabled={loading} className="absolute right-1.5 top-1.5 bottom-1.5 bg-slate-900 text-white px-5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 disabled:opacity-50 transition-all active:scale-95 shadow-md">
                {loading ? 'AUDITING...' : 'SCAN'}
              </button>
            </form>

            <button onClick={requestLocation} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-[10px] uppercase transition-all border ${locStatus === 'granted' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'}`}>
              {locStatus === 'granted' ? <MapPin className="w-3.5 h-3.5" /> : <MapPinOff className="w-3.5 h-3.5" />}
              {locStatus === 'granted' ? 'Live Region' : 'Global Mode'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 w-full flex-grow">
        {result && (
          <div className="mb-6 bg-slate-900 text-slate-300 py-3 px-6 rounded-2xl flex items-center justify-between gap-4 border border-slate-800 shadow-xl">
             <div className="flex items-center gap-3">
               <div className="bg-emerald-500/20 p-2 rounded-lg"><MessageSquareWarning className="w-4 h-4 text-emerald-400" /></div>
               <p className="text-[10px] font-bold uppercase tracking-wider leading-relaxed">
                 We compare Selling Prices (after discounts). Final price may vary by delivery address.
               </p>
             </div>
             <button onClick={() => setResult(null)} className="opacity-50 hover:opacity-100 transition-opacity"><X className="w-3 h-3" /></button>
          </div>
        )}

        {!result && !loading && (
          <div className="py-24 flex flex-col items-center text-center space-y-6 animate-in fade-in duration-700">
            <div className="relative">
              <div className="absolute inset-0 bg-emerald-100 blur-[80px] rounded-full opacity-30 animate-pulse"></div>
              <BrainCircuit className="relative w-20 h-20 text-emerald-500" />
            </div>
            <div className="space-y-3 px-4">
              <h1 className="text-4xl md:text-6xl font-black text-slate-900 leading-[1.1] tracking-tighter">
                Audited <span className="text-emerald-500">Selling Prices</span> <br/> Across All Grocery Apps.
              </h1>
              <p className="text-slate-400 text-base md:text-lg max-w-xl mx-auto font-medium">
                We find the absolute lowest discounted price today by deep-scanning live inventories.
              </p>
            </div>
          </div>
        )}

        {loading && (
          <div className="py-24 flex flex-col items-center space-y-8 animate-in zoom-in duration-300">
            <div className="relative w-24 h-24">
              <div className="absolute inset-0 border-[6px] border-slate-100 rounded-full"></div>
              <div className="absolute inset-0 border-[6px] border-t-emerald-500 rounded-full animate-spin"></div>
              <Sparkles className="absolute inset-0 m-auto w-8 h-8 text-emerald-500 animate-pulse" />
            </div>
            <div className="text-center space-y-2 px-4">
              <h2 className="text-2xl font-black text-slate-900 italic tracking-tight uppercase">Auditing live market...</h2>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.4em] animate-pulse">Scanning Blinkit, Zepto, Swiggy, JioMart, and Flipkart</p>
            </div>
          </div>
        )}

        {result && !loading && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 bg-white p-7 rounded-3xl border border-slate-100 shadow-sm">
              <div className="max-w-xl">
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="bg-emerald-500 p-1.5 rounded-lg shadow-lg shadow-emerald-100"><LayoutGrid className="w-3.5 h-3.5 text-white" /></div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight leading-none uppercase truncate">Results for: {query}</h2>
                </div>
                <p className="text-slate-500 text-sm font-bold leading-relaxed italic">"{result.summary}"</p>
              </div>
              
              <div className="flex items-center gap-3 shrink-0">
                <div className="relative group">
                  <div className="flex items-center gap-2 bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200 group-hover:border-emerald-300 transition-all shadow-sm">
                    <ListFilter className="w-3.5 h-3.5 text-slate-400" />
                    <select 
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as SortOption)}
                      className="bg-transparent text-[10px] font-black uppercase tracking-widest text-slate-600 outline-none cursor-pointer appearance-none pr-6"
                    >
                      <option value="availability">Availability + Low Price</option>
                      <option value="price_asc">Price: Low to High</option>
                      <option value="price_desc">Price: High to Low</option>
                    </select>
                    <ChevronDown className="w-3 h-3 text-slate-400 absolute right-4 pointer-events-none group-hover:text-emerald-500 transition-colors" />
                  </div>
                </div>
                
                <div className="hidden md:flex items-center gap-2 bg-emerald-50 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-emerald-600 border border-emerald-100 h-fit shadow-sm">
                  {sortBy === 'price_desc' ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                  Sorted Results
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {processedItems.map((item, idx) => (
                <PriceCard key={`${item.platform}-${idx}`} item={item} isBest={item.isAvailable && item.price === cheapestPrice} />
              ))}
            </div>

            {result.sources.length > 0 && (
              <div className="bg-white border border-slate-100 rounded-3xl p-8 shadow-sm">
                <div className="flex items-center gap-2.5 mb-6">
                  <Info className="w-4 h-4 text-slate-400" />
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Audit Verification Sources</h3>
                </div>
                <div className="flex flex-wrap gap-3">
                  {result.sources.map((source, i) => (
                    <a key={i} href={source.uri} target="_blank" rel="noopener noreferrer" className="bg-slate-50 px-4 py-2.5 rounded-xl text-[10px] font-bold text-slate-500 hover:bg-emerald-50 hover:text-emerald-600 transition-all flex items-center gap-2 border border-slate-100 shadow-sm group">
                      <ExternalLink className="w-3 h-3 opacity-30 group-hover:opacity-100 transition