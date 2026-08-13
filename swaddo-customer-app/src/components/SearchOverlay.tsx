"use client";

import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Search as SearchIcon, Mic, Clock, TrendingUp, X, MapPin, Star, Percent, Plus, Minus, ArrowUpRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { api } from "@/lib/api";
import { useCart } from "@/context/CartContext";

const popularCuisines = ["North Indian", "Chinese", "South Indian", "Biryani", "Desserts", "Burgers"];

const VegIcon = () => (
  <div className="w-4 h-4 border-[1.5px] border-green-700 flex items-center justify-center rounded-[3px] shrink-0">
    <div className="w-2 h-2 bg-green-700 rounded-full"></div>
  </div>
);

const NonVegIcon = () => (
  <div className="w-4 h-4 border-[1.5px] border-[#8B3A1A] flex items-center justify-center rounded-[3px] shrink-0">
    <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[6px] border-b-[#8B3A1A]"></div>
  </div>
);

export default function SearchOverlay({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const { cart, updateQuantity } = useCart();
  const [query, setQuery] = useState("");
  const [isListening, setIsListening] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [SpeechRec, setSpeechRec] = useState<any>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [viewState, setViewState] = useState<'empty' | 'typing' | 'results'>('empty');
  const [searchType, setSearchType] = useState<'dish' | 'restaurant'>('dish');
  const [results, setResults] = useState<{ restaurants: any[], dishes: any[] }>({ restaurants: [], dishes: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [isVegMode, setIsVegMode] = useState(false);
  
  useEffect(() => {
    inputRef.current?.focus();
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        setSpeechRec(new SpeechRecognition());
      }
      
      const savedSearches = JSON.parse(localStorage.getItem('swaddo_recent_searches') || '[]');
      setRecentSearches(savedSearches);

      const savedVegMode = localStorage.getItem("swaddo_veg_mode") === "true";
      setIsVegMode(savedVegMode);
    }
  }, []);

  useEffect(() => {
    if (!query) {
      setViewState('empty');
      return;
    }
    if (viewState === 'results') return; 
    setViewState('typing');

    const delayDebounceFn = setTimeout(() => {
      api.get(`/stalls/search/all?q=${encodeURIComponent(query)}`).then(res => {
         setResults(res.data);
      }).catch(console.error);
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const saveRecentSearch = (term: string) => {
    let newSearches = [term, ...recentSearches.filter(s => s !== term)].slice(0, 4);
    setRecentSearches(newSearches);
    localStorage.setItem('swaddo_recent_searches', JSON.stringify(newSearches));
  };

  const executeSearch = async (term: string, type: 'dish' | 'restaurant' = 'dish') => {
    if (!term.trim()) return;
    setQuery(term);
    setSearchType(type);
    saveRecentSearch(term);
    setViewState('results');
    setIsLoading(true);
    
    try {
      const res = await api.get(`/stalls/search/all?q=${encodeURIComponent(term)}`);
      setResults(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const startVoiceSearch = () => {
    setIsListening(true);
    if (SpeechRec) {
      SpeechRec.start();
      SpeechRec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setQuery(transcript);
        executeSearch(transcript, 'dish');
        setIsListening(false);
      };
      SpeechRec.onerror = () => setIsListening(false);
      SpeechRec.onend = () => setIsListening(false);
    } else {
      setTimeout(() => {
        setQuery("Paneer");
        executeSearch("Paneer", 'dish');
        setIsListening(false);
      }, 2500);
    }
  };

  const handleUpdateCartLocal = (dish: any, delta: number) => {
    updateQuantity(
      dish.stall_id.toString(), 
      dish.stall_name, 
      { id: dish.id.toString(), name: dish.name, price: Number(dish.price), markup: 0, isVeg: dish.is_veg ?? true }, 
      delta
    );
  };

  // Extract all matched restaurants (direct + from dishes)
  const allStallsMap = new Map();
  results.restaurants.forEach(r => allStallsMap.set(r.id, r));
  results.dishes.forEach(d => {
    if (!allStallsMap.has(d.stall_id)) {
      allStallsMap.set(d.stall_id, {
        id: d.stall_id,
        name: d.stall_name,
        location: d.location,
        rating: d.rating,
        rating_count: d.rating_count,
        cover_image: d.stall_image,
        is_open: d.is_open
      });
    }
  });
  const allMatchedStalls = Array.from(allStallsMap.values());

  return (
    <div className="fixed inset-0 z-50 flex flex-col font-body">
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" 
        onClick={onClose} 
      />

      {/* Main Content Area */}
      <motion.div 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -50, opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="relative z-10 w-full h-full flex flex-col"
      >
        {/* Top Header & Search Bar inside white rounded container */}
        <div className={`bg-white pt-6 pb-6 px-4 sm:px-6 flex flex-col gap-4 transition-all duration-300 z-20 relative ${query ? '' : 'rounded-b-[32px] shadow-[0_10px_30px_rgb(0,0,0,0.15)]'}`}>
          <div className="flex items-center">
            <button onClick={onClose} className="p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors active:scale-95 shrink-0">
              <ArrowLeft size={22} strokeWidth={2.5} />
            </button>
            <h1 className="flex-1 text-center font-bold text-gray-800 text-[15px] pr-8 truncate">
              Search for tasty & budget meals
            </h1>
          </div>
          
          <div className="relative group w-full">
            <input 
              ref={inputRef}
              type="text" 
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                if (viewState === 'results') setViewState('typing');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  executeSearch(query, 'dish');
                }
              }}
              placeholder="Try 'Fries'" 
              className="w-full relative z-10 bg-white border-[1.5px] border-green-700/80 rounded-full py-3.5 pl-5 pr-14 text-[15px] font-bold text-gray-800 placeholder-gray-400 outline-none focus:border-green-700 focus:ring-4 focus:ring-green-700/10 transition-all duration-300 shadow-sm"
            />
            {query ? (
              <button onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-full transition-colors z-20">
                <X size={16} strokeWidth={3} />
              </button>
            ) : (
              <div className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 flex items-center pr-1 pl-2 z-20">
                <button onClick={startVoiceSearch} className="p-2 text-green-700 hover:bg-green-50 rounded-full transition-colors active:scale-95">
                   <Mic size={22} strokeWidth={2.5} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Scrollable Results Area */}
        <div className={`flex-1 overflow-y-auto px-4 py-6 app-scroll-container pb-32 transition-colors duration-300 ${query ? 'bg-white' : ''}`}>

      <div className="px-4 sm:px-6 xl:px-8 mt-2 max-w-3xl mx-auto">

        {(viewState === 'typing' || viewState === 'results') && (
          <div className="flex flex-col">
            {isLoading && query.length > 2 && results.dishes.length === 0 && results.restaurants.length === 0 ? (
              <div className="text-center pt-10 text-gray-500 font-medium animate-pulse">
                Searching...
              </div>
            ) : (
              <div className="flex flex-col">
                {/* Top Match Box */}
                {query.trim() !== '' && (
                  <div className="flex items-center gap-4 bg-[#F8F8FC] rounded-[24px] p-3 mb-6 shadow-sm border border-transparent">
                    <div className="w-16 h-16 rounded-full overflow-hidden shrink-0 bg-white shadow-sm border border-gray-100 p-1">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={results.dishes[0]?.image_url || '/placeholder.png'} alt={query} className="w-full h-full object-cover rounded-full" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 text-[18px] capitalize leading-tight">{query}</h3>
                      <p className="text-gray-500 text-[14px] font-medium mt-0.5">Dish</p>
                    </div>
                    <div className="w-10 h-10 flex items-center justify-center">
                      <SearchIcon size={22} className="text-gray-400" strokeWidth={2} />
                    </div>
                  </div>
                )}

                {/* Restaurants Section */}
                {allMatchedStalls.length > 0 && (
                  <>
                    <div className="flex items-center gap-3 mb-5 mt-2">
                      <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest pl-1">
                        Restaurants relevant for '{query}'
                      </span>
                      <div className="flex-1 h-[1px] bg-gray-100"></div>
                    </div>
                    
                    <div className="flex flex-col gap-5 mb-8">
                      {allMatchedStalls.slice(0, 4).map(stall => (
                        <Link key={stall.id} href={`/stall?id=${stall.id}`} className="flex items-center gap-4 group active:scale-[0.98] transition-transform">
                          <div className="w-[72px] h-[72px] rounded-[18px] overflow-hidden shrink-0 bg-gray-50 shadow-sm border border-gray-100/50">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={stall.cover_image || '/placeholder.png'} alt={stall.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-heading font-bold text-gray-900 text-[17px]">{stall.name}</h3>
                            <div className="flex items-center gap-1.5 mt-1 text-[13.5px] text-gray-500 font-medium">
                               <div className="bg-[#00A14F] w-4 h-4 rounded-full flex items-center justify-center shrink-0">
                                 <Star size={9} className="fill-white text-white" />
                               </div>
                               <span className="text-gray-600 font-bold">{stall.rating || 4.2}</span>
                               <span className="w-1 h-1 bg-gray-300 rounded-full mx-0.5"></span>
                               35-45 mins
                               <span className="w-1 h-1 bg-gray-300 rounded-full mx-0.5"></span>
                               <span className="line-clamp-1">{stall.location || stall.tags || 'Camp'}</span>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </>
                )}

                {/* Dishes Section */}
                {(() => {
                  const filteredDishes = isVegMode ? results.dishes.filter(d => d.is_veg) : results.dishes;
                  if (filteredDishes.length === 0) return null;
                  
                  return (
                    <>
                      <div className="flex items-center gap-3 mb-5 mt-2">
                        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest pl-1">
                          More results matching your query
                        </span>
                        <div className="flex-1 h-[1px] bg-gray-100"></div>
                      </div>
                      
                      <div className="flex flex-col gap-5">
                        {filteredDishes.map(dish => (
                          <Link key={dish.id} href={`/stall?id=${dish.stall_id}`} className="flex items-center gap-4 group active:scale-[0.98] transition-transform">
                            <div className="w-[72px] h-[72px] rounded-full overflow-hidden shrink-0 bg-white shadow-sm border border-gray-100 p-0.5">
                               {/* eslint-disable-next-line @next/next/no-img-element */}
                               <img src={dish.image_url || '/placeholder.png'} alt={dish.name} className="w-full h-full object-cover rounded-full group-hover:scale-105 transition-transform duration-500" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                            </div>
                            <div className="flex-1">
                               <h3 className="font-heading font-bold text-gray-800 text-[16px] leading-tight">{dish.name}</h3>
                               <p className="text-gray-500 text-[13.5px] font-medium mt-0.5">Dish</p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </>
                  );
                })()}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Listening Overlay */}
      <AnimatePresence>
        {isListening && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-[100] backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-[32px] p-8 w-full max-w-sm flex flex-col items-center shadow-2xl relative overflow-hidden"
            >
              <div className="absolute -top-20 -left-20 w-40 h-40 bg-red-500/10 rounded-full blur-3xl"></div>
              <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-orange-500/10 rounded-full blur-3xl"></div>
              
              <h2 className="text-xl font-heading font-black text-gray-900 mb-8 relative z-10">Listening...</h2>
              
              <div className="relative flex justify-center items-center w-24 h-24 mb-6">
                <motion.div 
                  animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }} 
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="absolute inset-0 bg-primary/20 rounded-full"
                />
                <motion.div 
                  animate={{ scale: [1, 1.2, 1], opacity: [0.8, 0.2, 0.8] }} 
                  transition={{ repeat: Infinity, duration: 1.5, delay: 0.2 }}
                  className="absolute inset-2 bg-primary/30 rounded-full"
                />
                <div className="w-14 h-14 bg-primary text-white rounded-full flex items-center justify-center shadow-lg relative z-10">
                  <Mic size={28} />
                </div>
              </div>
              
              <p className="text-gray-500 text-sm font-medium relative z-10">Speak your dish or restaurant name</p>
              
              <button 
                onClick={() => setIsListening(false)}
                className="mt-8 px-6 py-2 bg-gray-100 text-gray-600 rounded-full text-sm font-bold hover:bg-gray-200 transition-colors relative z-10"
              >
                Cancel
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      </div>
      </motion.div>
    </div>
  );
}
