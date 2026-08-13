"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Search, Star, Plus, Minus, ChevronDown, X, Check, ArrowUp } from "lucide-react";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "@/context/CartContext";
import { api } from "@/lib/api";

const FILTERS = [
  { id: "discount", label: "25-60% lower prices", icon: "😎" },
  { id: "delivery", label: "Delivery time", iconRight: <ChevronDown size={14} /> },
  { id: "vegNonVeg", label: "Veg/Non-Veg", iconRight: <ChevronDown size={14} /> },
];

export default function MealsUnder99Page() {
  const { updateQuantity, cart } = useCart();
  const [items, setItems] = useState<any[]>([]);
  const [pureVegStallIds, setPureVegStallIds] = useState<Set<number>>(new Set());
  const [variantModal, setVariantModal] = useState<any>({ isOpen: false, stallId: '', stallName: '', item: null });
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchSubmitted, setIsSearchSubmitted] = useState(false);
  const [searchTab, setSearchTab] = useState<"restaurants" | "dishes">("dishes");
  
  // Veg Filter States
  const [isVegMode, setIsVegMode] = useState(false);
  const [isVegModalOpen, setIsVegModalOpen] = useState(false);
  const [vegChoice, setVegChoice] = useState("");
  const [rememberVegChoice, setRememberVegChoice] = useState(false);

  useEffect(() => {
    api.get("/stalls/meals-under-99").then((res: any) => {
      if (res.data && Array.isArray(res.data.data)) {
        setItems(res.data.data);
      }
    }).catch((err: any) => console.error("Error fetching meals under 99:", err));

    api.get("/stalls").then((res: any) => {
      if (res.data && Array.isArray(res.data.data)) {
        const pureIds = new Set<number>();
        res.data.data.forEach((s: any) => {
          if (s.is_pure_veg === true || s.is_pure_veg === 'true' || s.is_pure_veg === 1 || s.is_pure_veg === '1') {
            pureIds.add(s.id);
          }
        });
        setPureVegStallIds(pureIds);
      }
    }).catch((err: any) => console.error("Error fetching stalls for pure veg lookup:", err));

    const handleScroll = (e: Event) => {
      const target = e.target as HTMLElement | Document;
      const scrollTop = target === document ? window.scrollY : (target as HTMLElement).scrollTop;
      setIsScrolled(scrollTop >= 180);
    };

    const scrollContainer = document.querySelector('.app-scroll-container') || window;
    scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
    
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      scrollContainer.removeEventListener('scroll', handleScroll);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      if (isSearchOpen) {
        setIsSearchOpen(false);
        setSearchQuery("");
        setIsSearchSubmitted(false);
      }
    };

    if (isSearchOpen) {
      window.history.pushState({ searchOpen: true }, '');
    }
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isSearchOpen]);

  useEffect(() => {
    const saved = sessionStorage.getItem('searchState_meals99');
    if (saved) {
      try {
        const state = JSON.parse(saved);
        if (state.isSearchOpen) {
          setIsSearchOpen(true);
          setSearchQuery(state.searchQuery || "");
          setIsSearchSubmitted(state.isSearchSubmitted || false);
          setSearchTab(state.searchTab || "dishes");
        }
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    sessionStorage.setItem('searchState_meals99', JSON.stringify({
      isSearchOpen, searchQuery, isSearchSubmitted, searchTab
    }));
  }, [isSearchOpen, searchQuery, isSearchSubmitted, searchTab]);

  return (
    <div className="flex flex-col min-h-screen bg-white font-body pb-24 relative">

      {/* Sticky Header / Search Overlay */}
      {isSearchOpen && isSearchSubmitted ? (
        <div className="fixed top-0 left-0 w-full bg-white z-50 pt-2 pb-3 px-4 shadow-[0_2px_15px_rgba(0,0,0,0.05)] transition-all duration-300">
          <div className="flex items-center gap-3 mb-4 mt-2">
            <button onClick={() => setIsSearchSubmitted(false)} className="text-gray-700 shrink-0">
              <ArrowLeft size={24} />
            </button>
            <span className="font-medium text-gray-700 text-[16px]">Search for tasty & budget meals</span>
          </div>
          <div className="flex gap-3 items-center">
            <div className="flex-1 bg-white border border-gray-300 rounded-[16px] flex items-center px-3 h-[50px] shadow-sm">
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none text-[16px] font-medium text-gray-800"
              />
              {searchQuery && (
                <button onClick={() => { setSearchQuery(""); }} className="p-1 shrink-0">
                  <X size={20} className="text-gray-500" />
                </button>
              )}
            </div>
            <button
              onClick={() => {
                if (isVegMode) {
                  setIsVegMode(false);
                  if (!rememberVegChoice) setVegChoice("");
                } else {
                  setIsVegModalOpen(true);
                  if (!rememberVegChoice) setVegChoice("");
                }
              }}
              className="flex flex-col items-center justify-center h-[50px] w-[50px] rounded-xl bg-white shadow-sm border border-gray-200 shrink-0 relative"
            >
              <span className="font-black text-[10px] text-[#22C55E] leading-none mb-1">VEG</span>
              <div className={`w-5 h-2.5 rounded-full flex items-center p-[1px] transition-colors border ${isVegMode ? 'bg-[#22C55E] border-[#22C55E] justify-end' : 'bg-gray-100 border-gray-300 justify-start'}`}>
                <div className={`w-2 h-2 rounded-full shadow-sm ${isVegMode ? 'bg-white' : 'bg-gray-400'}`}></div>
              </div>
            </button>
          </div>
        </div>
      ) : (
        <div className={`fixed top-0 left-0 w-full h-[60px] bg-white z-50 transition-opacity duration-200 ${(isScrolled || isSearchOpen) ? 'opacity-100 shadow-[0_2px_10px_rgba(0,0,0,0.05)]' : 'opacity-0 pointer-events-none'}`}>
          <div className="px-4 h-full flex items-center">
            {isSearchOpen ? (
              <div className="flex items-center w-full h-[40px] bg-white border border-gray-300 rounded-[20px] px-3 shadow-sm">
                <button onClick={() => { window.history.back(); }} className="text-gray-600 mr-2 shrink-0">
                  <ArrowLeft size={20} strokeWidth={2.5} />
                </button>
                <input 
                  type="text" 
                  autoFocus
                  placeholder="Search in 99store"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setIsSearchSubmitted(false);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && searchQuery.trim()) {
                      setIsSearchSubmitted(true);
                    }
                  }}
                  className="flex-1 bg-transparent border-none outline-none text-[15px] font-medium text-gray-800 placeholder:text-gray-400"
                />
                {searchQuery && (
                  <button onClick={() => {
                    setSearchQuery("");
                    setIsSearchSubmitted(false);
                  }} className="ml-2 text-gray-400 p-1 shrink-0">
                    <X size={16} strokeWidth={2.5} />
                  </button>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-between w-full gap-3 h-[40px]">
                <Link href="/" className="text-gray-700 shrink-0">
                  <ArrowLeft size={24} />
                </Link>
                <div className="flex-1 font-black text-gray-900 text-[18px] tracking-tight truncate pl-1">
                  SWADDO
                </div>
                <button onClick={() => setIsSearchOpen(true)} className="text-gray-700 shrink-0">
                  <Search size={22} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {isSearchOpen && (searchQuery.trim() || isSearchSubmitted) ? (
        <div className={`${isSearchSubmitted ? 'pt-[130px]' : 'pt-[60px]'} min-h-screen bg-white pb-10`}>
          {(() => {
             const query = searchQuery.toLowerCase();
             let filteredItems = items.filter(item => 
               item.name.toLowerCase().includes(query) || 
               (item.stall_name || "").toLowerCase().includes(query) ||
               (item.description && item.description.toLowerCase().includes(query))
             );
             
             if (isVegMode) {
               if (vegChoice === 'pure_veg') {
                 filteredItems = filteredItems.filter(item => pureVegStallIds.has(item.stall_id));
               } else {
                 filteredItems = filteredItems.filter(item => item.is_veg === true || item.is_veg === 'true' || item.is_veg === 1 || item.is_veg === '1');
               }
             }

             const uniqueStalls: any[] = [];
             const stallMap = new Set();
             
             for (const item of filteredItems) {
               if (!stallMap.has(item.stall_id)) {
                 stallMap.add(item.stall_id);
                 
                 // Calculate the lowest price for this stall across its valid items
                 const stallItems = items.filter(i => 
                   i.stall_id === item.stall_id && 
                   (isVegMode ? (vegChoice === 'pure_veg' ? pureVegStallIds.has(i.stall_id) : (i.is_veg === true || i.is_veg === 'true' || i.is_veg === 1 || i.is_veg === '1')) : true)
                 );
                 
                 const prices = stallItems.map(i => typeof i.price === 'number' ? i.price : parseFloat((i.price || "0").toString().replace(/[^0-9.]/g, '')));
                 const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
                 
                 uniqueStalls.push({
                   id: item.stall_id,
                   name: item.stall_name,
                   image_url: item.image_url, // Fallback to item image if stall has no image
                   address: item.stall_address,
                   minPrice: Math.round(minPrice)
                 });
               }
             }

             if (filteredItems.length === 0 && uniqueStalls.length === 0) {
               return <div className="text-center text-gray-500 py-10 mt-10 font-medium">No results found for "{searchQuery}"</div>;
             }
             
             if (isSearchSubmitted) {
               // Group dishes by stall
               const dishesByStallMap: Record<string, any> = {};
               for (const item of filteredItems) {
                 if (!dishesByStallMap[item.stall_id]) {
                   // Calculate min price for the stall
                   const allStallItems = items.filter(i => i.stall_id === item.stall_id);
                   let minPrice = 49;
                   if (allStallItems.length > 0) {
                     minPrice = Math.min(...allStallItems.map(i => parseFloat(i.price.toString().replace(/[^0-9.]/g, ''))));
                   }
                   dishesByStallMap[item.stall_id] = {
                     stallId: item.stall_id,
                     stallName: item.stall_name,
                     items: [],
                     minPrice: Math.round(minPrice)
                   };
                 }
                 dishesByStallMap[item.stall_id].items.push(item);
               }
               
               const stallGroups = Object.values(dishesByStallMap).map(group => ({
                 ...group,
                 items: group.items.sort((a: any, b: any) => a.name.toLowerCase() === query ? -1 : b.name.toLowerCase() === query ? 1 : 0)
               }));

               return (
                 <div className="flex flex-col w-full">
                   {/* Tabs & Filters */}
                   <div className="sticky top-[118px] z-40 bg-white border-b border-gray-100 px-4 pt-1 shadow-[0_4px_10px_rgba(0,0,0,0.02)]">
                     <div className="flex items-center gap-6">
                       <button onClick={() => setSearchTab("restaurants")} className={`pb-3 text-[15px] font-bold transition-colors ${searchTab === "restaurants" ? 'border-b-2 border-black text-black' : 'text-gray-500 border-b-2 border-transparent'}`}>Restaurants</button>
                       <button onClick={() => setSearchTab("dishes")} className={`pb-3 text-[15px] font-bold transition-colors ${searchTab === "dishes" ? 'border-b-2 border-black text-black' : 'text-gray-500 border-b-2 border-transparent'}`}>Dishes</button>
                     </div>
                     <div className="flex gap-2 py-3 overflow-x-auto hide-scrollbar -mx-4 px-4">
                       <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-200 bg-white text-[13px] font-medium text-blue-700 whitespace-nowrap shrink-0">
                         Sort by <ChevronDown size={14} strokeWidth={2.5} className="text-blue-700" />
                       </button>
                       <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-200 bg-white text-[13px] font-medium text-gray-700 whitespace-nowrap shrink-0">
                         <ArrowUp size={14} className="text-[#D92686]" strokeWidth={3} />
                         Price Crash
                       </button>
                       <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-200 bg-white text-[13px] font-medium text-gray-700 whitespace-nowrap shrink-0">
                         <div className="flex -space-x-1.5">
                           <div className="w-[18px] h-[18px] rounded-full flex items-center justify-center border-[1.5px] border-[#D92686] bg-white z-10">
                              <svg width="9" height="9" viewBox="0 0 24 24" fill="#D92686" className="text-[#D92686] mt-[1px]"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                           </div>
                           <div className="w-[18px] h-[18px] rounded-full flex items-center justify-center border-[1.5px] border-[#D92686] bg-white z-0">
                              <svg width="9" height="9" viewBox="0 0 24 24" fill="#D92686" className="text-[#D92686] mt-[1px]"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                           </div>
                         </div>
                         40-60% Lower Prices
                       </button>
                       <button 
                         onClick={() => {
                           if (isVegMode && vegChoice === 'pure_veg') {
                             setIsVegMode(false);
                             setVegChoice('');
                           } else {
                             setIsVegMode(true);
                             setVegChoice('pure_veg');
                           }
                         }}
                         className={`flex items-center px-3 py-1.5 rounded-full border ${isVegMode && vegChoice === 'pure_veg' ? 'border-[#22C55E] bg-[#22C55E]/10 text-[#22C55E]' : 'border-gray-200 bg-white text-gray-700'} text-[13px] font-medium whitespace-nowrap shrink-0 transition-colors`}
                       >
                         Pure Veg
                         {isVegMode && vegChoice === 'pure_veg' && <X size={14} className="ml-1 text-[#22C55E]" />}
                       </button>
                       <button className="flex items-center px-3 py-1.5 rounded-full border border-gray-200 bg-white text-[13px] font-medium text-gray-700 whitespace-nowrap shrink-0">
                         Rated 4+
                       </button>
                     </div>
                   </div>

                   <div className="px-4 mt-5">
                     {searchTab === "restaurants" ? (
                       <div className="flex flex-col gap-6">
                         <h3 className="font-bold text-[15px] text-gray-900 mb-2">Restaurants matching your search</h3>
                         {uniqueStalls.length > 0 ? uniqueStalls.map(stall => (
                           <Link href={`/stall?id=${stall.id}${isVegMode ? '&veg=true' : ''}`} key={stall.id} className="flex gap-4 items-center">
                             <div className="w-[100px] h-[110px] rounded-[16px] overflow-hidden bg-gray-100 shrink-0 shadow-sm relative border border-gray-100">
                                <Image src={stall.image_url || "/categories/burger.png"} fill className="object-cover" alt={stall.name} />
                                <div className="absolute bottom-0 w-full bg-gradient-to-t from-black/80 to-transparent pt-6 pb-2 px-2">
                                  <p className="text-white text-[10px] font-medium leading-tight">Items</p>
                                  <p className="text-white font-black text-[13px] leading-tight">at ₹{stall.minPrice}</p>
                                </div>
                             </div>
                             <div className="flex-1 flex flex-col justify-center">
                               <p className="text-[#FF007F] text-[10px] font-black tracking-wider uppercase mb-1">40% Lower Prices</p>
                               <h4 className="font-black text-[17px] text-gray-900 tracking-tight leading-tight">{stall.name}</h4>
                               <div className="flex items-center gap-1 mt-1">
                                 <Star size={12} className="text-[#00A14F] fill-[#00A14F]" />
                                 <span className="text-[13px] font-bold text-gray-800">4.2 • 35-40 mins</span>
                               </div>
                               <p className="text-[12px] text-gray-500 font-medium truncate mt-1">Pizzas, Fast Food, Beverages</p>
                               <p className="text-[12px] text-gray-400 font-medium mt-1 truncate">{stall.address ? stall.address.split(',').slice(0,2).join(', ') : 'Free Delivery'}</p>
                             </div>
                           </Link>
                         )) : (
                           <p className="text-gray-500 text-sm">No restaurants found exactly matching "{searchQuery}". Try the Dishes tab!</p>
                         )}
                       </div>
                     ) : (
                       <div className="flex flex-col gap-8">
                         {stallGroups.map(group => (
                           <div key={group.stallId} className="flex flex-col p-4 bg-white rounded-[20px] shadow-[0_2px_12px_rgba(0,0,0,0.06)] border border-gray-100">
                             <Link href={`/stall?id=${group.stallId}${isVegMode ? '&veg=true' : ''}`} className="flex justify-between items-start mb-4 block">
                               <div>
                                 <p className="text-[#FF007F] text-[10px] font-black tracking-wider uppercase mb-1">30% Lower Prices</p>
                                 <h4 className="font-black text-[18px] text-gray-900 tracking-tight leading-tight">{group.stallName}</h4>
                                 <div className="flex items-center gap-1 mt-1">
                                   <Star size={12} className="text-[#00A14F] fill-[#00A14F]" />
                                   <span className="text-[12px] font-medium text-gray-700">4.2 • 35-40 mins • Fast Food</span>
                                 </div>
                                 <div className="flex items-center gap-1 mt-1">
                                   <div className="w-4 h-4 bg-green-100 rounded-full flex items-center justify-center shrink-0"><span className="text-green-700 text-[10px] font-bold">%</span></div>
                                   <span className="text-[11px] text-gray-600 font-medium">Free Delivery • Items At ₹{group.minPrice}</span>
                                 </div>
                               </div>
                               <div className="w-[60px] h-[60px] rounded-full overflow-hidden border border-gray-100 shadow-sm shrink-0">
                                 <Image src={group.items[0]?.image_url || "/categories/pizza.png"} width={60} height={60} alt={group.stallName} className="object-cover w-full h-full" />
                               </div>
                             </Link>
                             
                             {/* Horizontal Scroll of Dishes */}
                             <div className="flex gap-4 overflow-x-auto hide-scrollbar -mx-4 px-4 pb-2">
                               {group.items.map(item => (
                                 <div key={item.id} className="w-[140px] shrink-0 flex flex-col">
                                    <div className="w-full h-[140px] rounded-[16px] overflow-hidden bg-gray-100 shadow-sm relative mb-2">
                                      <Image src={item.image_url || "/categories/burger.png"} fill className="object-cover" alt={item.name} />
                                      <div className="absolute top-2 left-2 bg-white/90 px-1.5 py-0.5 rounded text-[10px] font-black text-green-700 shadow-sm">Popular</div>
                                      <button className="absolute bottom-2 right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md border border-gray-100 active:scale-95 transition-transform">
                                        <Plus size={20} className="text-[#FF007F]" />
                                      </button>
                                    </div>
                                    <div className="flex items-start gap-1 px-1">
                                      <div className={`mt-1 w-2.5 h-2.5 border flex items-center justify-center shrink-0 ${item.is_veg ? 'border-green-600' : 'border-red-600'}`}>
                                        <div className={`w-1.5 h-1.5 rounded-full ${item.is_veg ? 'bg-green-600' : 'bg-red-600'}`}></div>
                                      </div>
                                      <p className="font-bold text-[13px] text-gray-900 leading-tight line-clamp-2">{item.name}</p>
                                    </div>
                                    <div className="flex items-center gap-1.5 mt-1 px-1">
                                      <span className="text-[11px] text-gray-400 line-through">₹{Math.round(parseFloat(item.price.toString().replace(/[^0-9.]/g, '')) * 1.2)}</span>
                                      <span className="text-[13px] font-black text-[#FF007F]">₹{item.price}</span>
                                    </div>
                                 </div>
                               ))}
                             </div>
                           </div>
                         ))}
                       </div>
                     )}
                   </div>
                 </div>
               );
             }

             return (
               <div className="px-4">
                  <div 
                    onClick={() => {
                      setIsSearchSubmitted(true);
                      setSearchTab("dishes");
                    }}
                    className="flex items-center p-3 rounded-[16px] bg-gray-50 mt-4 mb-6 shadow-sm border border-gray-100 cursor-pointer active:scale-[0.98] transition-transform"
                  >
                    <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 relative bg-white border border-gray-200">
                       <Image src={filteredItems[0]?.image_url || "/categories/pizza.png"} fill alt="dish" className="object-cover" />
                    </div>
                    <div className="ml-3 flex-1">
                      <p className="font-bold text-[15px] text-gray-900 capitalize">{searchQuery}</p>
                      <p className="text-[12px] text-gray-500 font-medium mt-0.5">Dish</p>
                    </div>
                    <Search size={20} className="text-gray-400 mr-2" />
                  </div>
                  
                  {uniqueStalls.length > 0 && (
                    <>
                      <div className="flex items-center gap-3 mb-5 mt-6">
                        <h3 className="text-[10px] font-bold text-gray-500 tracking-widest shrink-0 uppercase">
                          RESTAURANTS RELEVANT FOR '{searchQuery}'
                        </h3>
                        <div className="h-[1px] bg-gray-200 flex-1"></div>
                      </div>
                      <div className="flex flex-col gap-5 mb-8">
                        {uniqueStalls.map(stall => (
                          <div 
                            key={stall.id} 
                            onClick={() => {
                              setSearchQuery(stall.name);
                              setIsSearchSubmitted(true);
                              setSearchTab("restaurants");
                            }}
                            className="flex gap-4 items-center cursor-pointer active:scale-[0.98] transition-transform"
                          >
                            <div className="w-14 h-14 rounded-[12px] overflow-hidden bg-gray-100 shrink-0 shadow-sm relative border border-gray-100">
                               <Image src={stall.image_url || "/categories/burger.png"} fill className="object-cover" alt={stall.name} />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-bold text-[15px] text-gray-800 tracking-tight">{stall.name}</h4>
                              <div className="flex items-center gap-1 mt-1">
                                <Star size={12} className="text-[#00A14F] fill-[#00A14F]" />
                                <span className="text-[12px] font-medium text-gray-500 truncate max-w-[200px]">
                                  4.2 • 35-40 mins • {stall.address ? stall.address.split(',')[1]?.trim() || stall.address.split(',')[0] : 'Bihar Sharif'}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {filteredItems.length > 0 && (
                    <>
                      <div className="flex items-center gap-3 mb-5 mt-8">
                        <h3 className="text-[10px] font-bold text-gray-500 tracking-widest shrink-0 uppercase">
                          MORE RESULTS MATCHING YOUR QUERY
                        </h3>
                        <div className="h-[1px] bg-gray-200 flex-1"></div>
                      </div>
                      <div className="flex flex-col gap-6">
                        {filteredItems.map(item => (
                          <div 
                            key={item.id} 
                            onClick={() => {
                              setSearchQuery(item.name);
                              setIsSearchSubmitted(true);
                              setSearchTab("dishes");
                            }}
                            className="flex gap-4 items-center cursor-pointer active:scale-[0.98] transition-transform"
                          >
                            <div className="w-14 h-14 rounded-full overflow-hidden bg-gray-100 shrink-0 shadow-sm relative border border-gray-100">
                              <Image src={item.image_url || "/categories/pizza.png"} fill className="object-cover" alt={item.name} />
                            </div>
                            <div className="flex-1">
                              <p className="text-[15px] text-gray-600 font-medium">
                                {item.name.split(new RegExp(`(${searchQuery})`, 'gi')).map((part: string, i: number) => 
                                  part.toLowerCase() === query ? <strong key={i} className="font-black text-gray-900">{part}</strong> : part
                                )}
                              </p>
                              <p className="text-[12px] text-gray-400 font-medium mt-0.5">Dish</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
               </div>
             );
          })()}
        </div>
      ) : (
        <>
          {/* Header Section (Full Image Banner) */}
          <div className="relative w-full h-[240px] overflow-hidden">
            {/* Full Cover Graphic */}
            <Image 
              src="/mealsunder99.png" 
              alt="Meals under 99" 
              fill 
              quality={100}
              unoptimized
              className="object-cover"
              priority
            />
            
            {/* Top Navigation */}
            <div className={`absolute top-5 w-full px-4 flex items-center justify-between z-20 transition-opacity duration-300 ${isScrolled || isSearchOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
              <Link href="/" className="w-10 h-10 bg-black/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <ArrowLeft className="text-white" size={22} />
              </Link>
              <button onClick={() => setIsSearchOpen(true)} className="w-10 h-10 bg-black/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <Search className="text-white" size={20} />
              </button>
            </div>
          </div>

          <div className="sticky top-[59px] z-40 w-full overflow-x-auto hide-scrollbar pt-4 pb-3 px-4 border-b border-gray-100 bg-white">
            <div className="flex gap-2 min-w-max">
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-200 bg-white text-[13px] font-medium text-blue-700 whitespace-nowrap shrink-0">
                Sort by <ChevronDown size={14} strokeWidth={2.5} className="text-blue-700" />
              </button>
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-200 bg-white text-[13px] font-medium text-gray-700 whitespace-nowrap shrink-0">
                <ArrowUp size={14} className="text-[#D92686]" strokeWidth={3} />
                Price Crash
              </button>
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-200 bg-white text-[13px] font-medium text-gray-700 whitespace-nowrap shrink-0">
                <div className="flex -space-x-1.5">
                  <div className="w-[18px] h-[18px] rounded-full flex items-center justify-center border-[1.5px] border-[#D92686] bg-white z-10">
                     <svg width="9" height="9" viewBox="0 0 24 24" fill="#D92686" className="text-[#D92686] mt-[1px]"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                  </div>
                  <div className="w-[18px] h-[18px] rounded-full flex items-center justify-center border-[1.5px] border-[#D92686] bg-white z-0">
                     <svg width="9" height="9" viewBox="0 0 24 24" fill="#D92686" className="text-[#D92686] mt-[1px]"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                  </div>
                </div>
                40-60% Lower Prices
              </button>
              <button 
                onClick={() => {
                  if (isVegMode && vegChoice === 'pure_veg') {
                    setIsVegMode(false);
                    setVegChoice('');
                  } else {
                    setIsVegMode(true);
                    setVegChoice('pure_veg');
                  }
                }}
                className={`flex items-center px-3 py-1.5 rounded-full border ${isVegMode && vegChoice === 'pure_veg' ? 'border-[#22C55E] bg-[#22C55E]/10 text-[#22C55E]' : 'border-gray-200 bg-white text-gray-700'} text-[13px] font-medium whitespace-nowrap shrink-0 transition-colors`}
              >
                Pure Veg
                {isVegMode && vegChoice === 'pure_veg' && <X size={14} className="ml-1 text-[#22C55E]" />}
              </button>
              <button className="flex items-center px-3 py-1.5 rounded-full border border-gray-200 bg-white text-[13px] font-medium text-gray-700 whitespace-nowrap shrink-0">
                Rated 4+
              </button>
            </div>
          </div>

          <div className="px-4 mt-5">
            <h2 className="font-bold text-[15px] text-gray-900 mb-4">
              All {items.length} Items
            </h2>
            
            {/* Item Grid */}
            <div className="grid grid-cols-2 gap-4">
              {(() => {
                const gridFilteredItems = items.filter(item => {
                  if (isVegMode) {
                    if (vegChoice === 'pure_veg') {
                      return pureVegStallIds.has(item.stall_id);
                    } else {
                      return item.is_veg === true || item.is_veg === 'true' || item.is_veg === 1 || item.is_veg === '1';
                    }
                  }
                  return true;
                });

                if (gridFilteredItems.length === 0) {
                  return (
                    <div className="col-span-2 py-10 text-center">
                      <p className="text-gray-500 font-medium text-[14px]">No items found</p>
                    </div>
                  );
                }
                
                return gridFilteredItems.map((item) => {
                const parsedPrice = typeof item.price === 'number' ? item.price : parseFloat((item.price || "0").toString().replace(/[^0-9.]/g, ''));
                const originalPrice = Math.round(parsedPrice * 1.2);
                let quantity = 0;
                if (cart.stallId === item.stall_id?.toString()) {
                  if (item.has_variants) {
                    const prefix = String(item.id) + '_';
                    quantity = cart.items.filter((i: any) => String(i.id).startsWith(prefix)).reduce((sum: number, i: any) => sum + i.quantity, 0);
                  } else {
                    const isAdded = cart.items.find((i: any) => String(i.id) === String(item.id));
                    quantity = isAdded ? isAdded.quantity : 0;
                  }
                }
                
                return (
                <div key={item.id} className="flex flex-col">
                  {/* Image Container */}
                  <div className="relative w-full aspect-[4/3] rounded-[16px] overflow-hidden bg-gray-100 shadow-sm mb-2">
                    <Image src={item.image_url || "/categories/burger.png"} alt={item.name} fill className="object-cover" />
                    
                    {/* Rating Badge */}
                    <div className="absolute bottom-2 left-2 bg-white px-1.5 py-0.5 rounded flex items-center gap-1 shadow-sm">
                      <Star size={10} className="text-green-600 fill-green-600" />
                      <span className="text-[10px] font-bold text-green-700">4.5</span>
                    </div>
                    
                    {/* Add Button */}
                    {quantity > 0 ? (
                      <div className="absolute bottom-2 right-2 h-7 bg-white rounded-lg flex items-center justify-between shadow-md border border-gray-100 px-1 overflow-hidden z-20">
                        <button 
                          onClick={(e) => { 
                            e.preventDefault(); 
                            e.stopPropagation(); 
                            if (item.has_variants) {
                              const variantsInCart = cart.items.filter((i: any) => String(i.id).startsWith(String(item.id) + '_'));
                              if (variantsInCart.length === 1) {
                                updateQuantity(item.stall_id?.toString(), item.stall_name, variantsInCart[0], -1);
                              } else {
                                alert("Multiple variants added. Please go to cart to remove.");
                              }
                            } else {
                              updateQuantity(item.stall_id?.toString(), item.stall_name, { id: String(item.id), name: item.name, price: parsedPrice }, -1); 
                            }
                          }}
                          className="w-6 h-full flex justify-center items-center text-gray-600 active:bg-gray-100"
                        ><Minus size={14} /></button>
                        <span className="text-[12px] font-bold text-gray-800 w-4 text-center">{quantity}</span>
                        <button 
                          onClick={(e) => { 
                            e.preventDefault(); 
                            e.stopPropagation(); 
                            if (item.has_variants) {
                              setVariantModal({ isOpen: true, stallId: item.stall_id?.toString(), stallName: item.stall_name, item });
                            } else {
                              updateQuantity(item.stall_id?.toString(), item.stall_name, { id: String(item.id), name: item.name, price: parsedPrice }, 1); 
                            }
                          }}
                          className="w-6 h-full flex justify-center items-center text-[#FF007F] active:bg-gray-100"
                        ><Plus size={14} /></button>
                      </div>
                    ) : (
                      <button 
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (item.has_variants) {
                            setVariantModal({ isOpen: true, stallId: item.stall_id?.toString(), stallName: item.stall_name, item });
                          } else {
                            updateQuantity(
                              item.stall_id?.toString(), 
                              item.stall_name, 
                              { id: String(item.id), name: item.name, price: parsedPrice }, 
                              1
                            );
                          }
                        }}
                        className="absolute bottom-2 right-2 w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-md border border-gray-100 active:scale-95 transition-transform z-10"
                      >
                        {item.has_variants ? (
                          <span className="text-[#FF007F] text-[10px] font-bold">ADD</span>
                        ) : (
                          <Plus size={18} className="text-[#FF007F]" />
                        )}
                      </button>
                    )}
                  </div>
                  
                  {/* Details */}
                  <div className="flex flex-col px-1">
                    <p className="text-[11px] text-gray-500 font-medium truncate mb-0.5">{item.stall_name}</p>
                    
                    <div className="flex items-start gap-1">
                      {item.is_veg ? (
                        <div className="mt-1 w-3 h-3 border border-green-600 flex items-center justify-center shrink-0">
                          <div className="w-1.5 h-1.5 bg-green-600 rounded-full"></div>
                        </div>
                      ) : (
                        <div className="mt-1 w-3 h-3 border border-red-600 flex items-center justify-center shrink-0">
                          <div className="w-1.5 h-1.5 bg-red-600 rounded-full"></div>
                        </div>
                      )}
                      <h3 className="font-bold text-[13px] text-gray-900 leading-tight line-clamp-2">
                        {item.name}
                      </h3>
                    </div>
                    
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-[11px] text-gray-400 line-through">₹{originalPrice}</span>
                      <span className="text-[13px] font-bold text-[#FF007F]">₹{parsedPrice}</span>
                    </div>

                    <p className="text-[10px] font-bold text-[#FF007F] mt-1 flex items-center gap-1">
                      😎 Our app: 20% lower
                    </p>
                  </div>
                </div>
                );
              });
              })()}
            </div>
          </div>
        </>
      )}
      {variantModal.isOpen && variantModal.item && (
        <VariantModalComponent 
          modalState={variantModal} 
          setModalState={setVariantModal} 
          updateQuantity={updateQuantity}
        />
      )}

      {/* Veg Modal Overlay */}
      <AnimatePresence>
        {isVegModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60" 
              onClick={() => setIsVegModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-sm bg-white rounded-[24px] p-6 shadow-2xl z-10"
            >
              <button 
                onClick={() => setIsVegModalOpen(false)}
                className="absolute top-4 right-4 p-1 text-gray-400 hover:bg-gray-100 rounded-full transition-colors z-20"
              >
                <X size={20} strokeWidth={2.5} />
              </button>

              <div className="absolute top-5 right-12 w-20 h-20 shrink-0 flex items-center justify-center pointer-events-none">
                <Image src="/categories/all.png" alt="Food" fill className="object-contain scale-[1.25]" />
              </div>

              <div className="flex items-start justify-between mb-8 pr-16 mt-2">
                <h2 className="text-[20px] font-black text-gray-800 leading-[1.1] max-w-[180px]">
                  I want to see veg choices from
                </h2>
              </div>

              <div className="space-y-5 mb-6">
                <label className="flex items-center justify-between cursor-pointer group">
                  <span className="text-[15px] font-medium text-gray-700">All restaurants</span>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${vegChoice === 'all' ? 'border-green-600' : 'border-gray-300 group-hover:border-green-400'}`}>
                    {vegChoice === 'all' && <div className="w-3 h-3 bg-green-600 rounded-full"></div>}
                  </div>
                  <input type="radio" className="hidden" checked={vegChoice === 'all'} onChange={() => setVegChoice('all')} />
                </label>

                <label className="flex items-center justify-between cursor-pointer group">
                  <span className="text-[15px] font-medium text-gray-700">Pure veg restaurants only</span>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${vegChoice === 'pure_veg' ? 'border-green-600' : 'border-gray-300 group-hover:border-green-400'}`}>
                    {vegChoice === 'pure_veg' && <div className="w-3 h-3 bg-green-600 rounded-full"></div>}
                  </div>
                  <input type="radio" className="hidden" checked={vegChoice === 'pure_veg'} onChange={() => setVegChoice('pure_veg')} />
                </label>
              </div>

              <div className="border-t border-dashed border-gray-200 mb-5"></div>

              <label className="flex items-center justify-between cursor-pointer mb-6 group">
                <span className="text-[13px] font-medium text-gray-500">Remember my choice going forward</span>
                <div className={`w-[18px] h-[18px] rounded-[4px] border-2 flex items-center justify-center transition-colors ${rememberVegChoice ? 'border-green-600 bg-green-600' : 'border-gray-200 group-hover:border-gray-300'}`}>
                  {rememberVegChoice && <Check size={12} strokeWidth={3} className="text-white" />}
                </div>
                <input type="checkbox" className="hidden" checked={rememberVegChoice} onChange={(e) => setRememberVegChoice(e.target.checked)} />
              </label>

              <button 
                onClick={() => {
                  if (!vegChoice) return;
                  setIsVegMode(true);
                  setIsVegModalOpen(false);
                }}
                disabled={!vegChoice}
                className={`w-full text-white font-bold text-[15px] py-3.5 rounded-xl shadow-md transition-colors ${vegChoice ? 'bg-[#FF5722] hover:bg-[#E64A19]' : 'bg-gray-300 cursor-not-allowed'}`}
              >
                Show restaurants
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

function VariantModalComponent({ modalState, setModalState, updateQuantity }: any) {
  const { cartItemCount } = useCart();
  const { item, stallId, stallName } = modalState;
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [modalQty, setModalQty] = useState(1);

  const variantsList = item.variants || [];
  const selectedVariant = variantsList[selectedIndex];
  const variantId = `${item.id}_${selectedVariant?.name}`;
  
  const handleAdd = () => {
    updateQuantity(stallId, stallName, { 
      id: variantId, 
      name: `${item.name} (${selectedVariant.name})`, 
      price: Number(selectedVariant.price), 
    }, modalQty);
    setModalState({ isOpen: false, stallId: '', stallName: '', item: null });
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-50 transition-opacity" onClick={() => setModalState({ isOpen: false, stallId: '', stallName: '', item: null })} />
      
      {/* Floating Close Button */}
      <div className="fixed top-[15%] left-1/2 -translate-x-1/2 w-10 h-10 bg-[#2D3035] shadow-lg rounded-full flex items-center justify-center text-white cursor-pointer z-[60]" onClick={() => setModalState({ isOpen: false, stallId: '', stallName: '', item: null })}>
        <X size={18} strokeWidth={2.5} />
      </div>

      <div className={`fixed ${cartItemCount > 0 ? 'bottom-[85px]' : 'bottom-0'} left-0 w-full bg-[#f3f4f6] rounded-t-3xl z-50 overflow-hidden flex flex-col max-h-[80vh] transition-all duration-300`}>
        {/* Header */}
        <div className="bg-white p-4 rounded-t-3xl flex items-center gap-3 shadow-sm z-10 shrink-0 border-b border-gray-100">
          <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 relative bg-gray-50 border border-gray-100">
            <Image src={item.image_url || "/categories/burger.png"} alt={item.name} fill className="object-cover" />
          </div>
          <h3 className="font-extrabold text-[17px] text-gray-900 leading-tight">{item.name}</h3>
        </div>
        
        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 hide-scrollbar pb-28">
          <h4 className="font-extrabold text-[16px] text-gray-800">Size</h4>
          <p className="text-[13px] text-gray-500 mb-3 font-medium">Select any 1</p>
          
          <div className="bg-white rounded-[16px] shadow-sm overflow-hidden border border-gray-100/60">
            {variantsList.map((v: any, i: number) => (
              <div 
                key={i} 
                onClick={() => setSelectedIndex(i)}
                className={`flex justify-between items-center px-4 py-4 cursor-pointer transition-colors ${i !== variantsList.length - 1 ? 'border-b border-gray-100' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`shrink-0 w-[14px] h-[14px] border-[1.5px] flex items-center justify-center rounded-[3px] ${item.is_veg ? 'border-[#00A14F]' : 'border-[#8B3A1A]'}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${item.is_veg ? 'bg-[#00A14F]' : 'bg-[#8B3A1A]'}`}></div>
                  </div>
                  <span className="font-bold text-[15px] text-gray-800">{v.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-medium text-[14px] text-gray-600">₹{v.price}</span>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedIndex === i ? 'border-[#00A14F]' : 'border-gray-300'}`}>
                    {selectedIndex === i && <div className="w-2.5 h-2.5 bg-[#00A14F] rounded-full"></div>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Bottom Fixed Bar */}
        <div className="absolute bottom-0 left-0 w-full bg-white p-4 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] flex items-center gap-4 z-20">
          <div className="h-[48px] w-[110px] rounded-full flex items-center justify-between border-2 border-[#d94696] px-1 bg-white">
            <button 
              onClick={() => setModalQty(Math.max(1, modalQty - 1))}
              className="w-10 h-full flex justify-center items-center text-[#d94696]"
            ><Minus size={18} strokeWidth={3} /></button>
            <span className="text-[16px] font-black text-[#d94696] w-4 text-center">{modalQty}</span>
            <button 
              onClick={() => setModalQty(modalQty + 1)}
              className="w-10 h-full flex justify-center items-center text-[#d94696]"
            ><Plus size={18} strokeWidth={3} /></button>
          </div>
          
          <button 
            onClick={handleAdd}
            className="flex-1 h-[48px] bg-[#00A14F] text-white font-extrabold rounded-full text-[15px] shadow-sm active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
          >
            Add Item | ₹{(selectedVariant?.price || 0) * modalQty}
          </button>
        </div>

      </div>
    </>
  );
}
