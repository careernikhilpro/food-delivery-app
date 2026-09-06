"use client";

import { useState, useEffect, Suspense, useMemo } from "react";
import useSWR from "swr";
import { StallCardShimmer, MenuItemShimmer } from "@/components/Shimmer";
import { ArrowLeft, Share2, Star, Clock, MapPin, Plus, Minus, ShoppingBag, Loader2, Heart, Tag, Search, ChevronDown, BookOpen } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { io } from "socket.io-client";
import { useCart } from "@/context/CartContext";
import { useLocation } from "@/context/LocationContext";
import { api } from "@/lib/api";

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

const PromoIcon = ({ className = "w-5 h-5 shrink-0" }: { className?: string }) => (
  <svg viewBox="0 0 40 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="28" cy="12" r="10" fill="white" stroke="#C2185B" strokeWidth="2.5"/>
    <circle cx="12" cy="12" r="10" fill="white" stroke="#C2185B" strokeWidth="2.5"/>
    <path transform="translate(12, 12) scale(0.45) translate(-12, -10.5)" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="#C2185B"/>
    <path transform="translate(28, 12) scale(0.45) translate(-12, -10.5)" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="#C2185B"/>
  </svg>
);

const StampIcon = () => (
  <svg width="100" height="100" viewBox="0 0 100 100" className="absolute -top-4 right-0 -mr-4 opacity-95 shrink-0 pointer-events-none z-10 scale-90 overflow-visible">
    <g transform="rotate(-15 50 50)">
      {/* Outer and Inner circles */}
      <circle cx="50" cy="50" r="45" fill="none" stroke="#E6D3DC" strokeWidth="1.5" />
      <circle cx="50" cy="50" r="30" fill="none" stroke="#E6D3DC" strokeWidth="1.5" />
      
      {/* Curved text EVERYDAY (Top) */}
      <path id="curve-top" d="M 12.5 50 A 37.5 37.5 0 0 1 87.5 50" fill="transparent" />
      <text className="text-[11px] font-black uppercase tracking-widest" fill="#E6D3DC">
        <textPath href="#curve-top" startOffset="50%" textAnchor="middle">EVERYDAY</textPath>
      </text>

      {/* Curved text EVERYDAY (Bottom) */}
      <path id="curve-bottom" d="M 87.5 50 A 37.5 37.5 0 0 1 12.5 50" fill="transparent" />
      <text className="text-[11px] font-black uppercase tracking-widest" fill="#E6D3DC">
        <textPath href="#curve-bottom" startOffset="50%" textAnchor="middle">EVERYDAY</textPath>
      </text>

      {/* Pink Banner with V-notches */}
      <polygon points="-8,36 8,50 -8,64 108,64 92,50 108,36" fill="#F48FB1" />

      {/* Text inside banner */}
      <text x="50" y="50" className="text-[14px] font-black uppercase tracking-wider" fill="white" textAnchor="middle" alignmentBaseline="central" dominantBaseline="central" fontWeight="900" style={{ textShadow: "0px 1px 2px rgba(0,0,0,0.15)" }}>LOWEST PRICE</text>
    </g>
  </svg>
);

function StallDetailContent() {
  const router = useRouter();
  const { latitude, longitude, liveLatitude, liveLongitude } = useLocation();
  
  const searchParams = useSearchParams();
  const stallId = searchParams.get('id');
  
  const [activeCategory, setActiveCategory] = useState("All");
  const [itemMarkup, setItemMarkup] = useState(0);
  const [isAddressOpen, setIsAddressOpen] = useState(false);

  const fetcher = (url: string) => api.get(url).then(res => res.data);

  const getShortAddress = (addr: string) => {
    if (!addr) return 'Shaniwar Peth';
    const parts = addr.split(',').map(p => p.trim());
    if (parts.length > 1) {
      if (parts[0].includes('+') || parts[0].length < 4) {
        return parts[1].substring(0, 15) + (parts[1].length > 15 ? '...' : '');
      }
      return parts[0].substring(0, 15) + (parts[0].length > 15 ? '...' : '');
    }
    return addr.substring(0, 15) + (addr.length > 15 ? '...' : '');
  };
  
  const { data: stallRes, isLoading: stallLoading, mutate: mutateStall } = useSWR(
    stallId && !stallId.startsWith('rest_') ? `/stalls/${stallId}` : null, 
    fetcher, { revalidateOnFocus: false, dedupingInterval: 60000, keepPreviousData: true }
  );
  
  const { data: menuRes, isLoading: menuLoading, mutate: mutateMenu } = useSWR(
    stallId && !stallId.startsWith('rest_') ? `/stalls/${stallId}/menu` : null, 
    fetcher, { revalidateOnFocus: false, dedupingInterval: 60000, keepPreviousData: true }
  );
  
  const getDummyStall = (id: string) => {
    if (id === 'rest_1') return { id: 'rest_1', name: 'Subway', address: 'Patna', categories: 'Sandwich, Salads', rating: '4.2', distance: 2.6, image_url: '/categories/sandwich.png', isOpen: true, is_open: true };
    if (id === 'rest_2') return { id: 'rest_2', name: 'Burger King', address: 'Patna', categories: 'Burger, Fast Food', rating: '4.1', distance: 3.1, image_url: '/categories/burger.png', isOpen: true, is_open: true };
    return null;
  };
  
  const getDummyMenu = (id: string) => {
    if (id === 'rest_1') return [
      { id: 's1', name: 'Crispy Paneer Patty Burger', price: 114, is_veg: true, category: 'Burger', image_url: '/categories/burger.png' },
      { id: 's2', name: 'Peri Peri Fries', price: 105, is_veg: true, category: 'Sides', image_url: '/categories/burger.png' },
      { id: 's3', name: 'Veggie Sandwich', price: 175, is_veg: true, category: 'Sandwich', image_url: '/categories/sandwich.png' }
    ];
    if (id === 'rest_2') return [
      { id: 's1', name: 'Whopper', price: 149, is_veg: false, category: 'Burger', image_url: '/categories/burger.png' },
      { id: 's2', name: 'Fries (M)', price: 109, is_veg: true, category: 'Sides', image_url: '/categories/burger.png' }
    ];
    return null;
  };

  const stallData = stallId?.startsWith('rest_') ? getDummyStall(stallId) : (stallRes?.data || stallRes);
  const rawMenuData = stallId?.startsWith('rest_') ? (getDummyMenu(stallId) || []) : (menuRes?.data || menuRes || []);
  const isLoading = stallId?.startsWith('rest_') ? false : ((!stallData && stallLoading) || (!rawMenuData.length && menuLoading));

  const items = useMemo(() => {
    if (!Array.isArray(rawMenuData)) return [];
    return rawMenuData.map((item) => ({
      id: item.id?.toString(),
      name: item.name,
      description: item.description || "",
      price: Number(item.price), 
      isVeg: item.is_veg === true || item.is_veg === 'true' || item.is_veg === 1 || item.is_veg === '1',
      isSoldOut: item.is_available === false,
      category: (item.category && item.category.trim().toLowerCase() !== "all") ? item.category : "Others",
      image: (item.image_url && !item.image_url.includes('unsplash.com') && !item.image_url.includes('picsum.photos')) ? item.image_url : ""
    }));
  }, [rawMenuData]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [itemFavorites, setItemFavorites] = useState<string[]>([]);
  const [isVegMode, setIsVegMode] = useState(searchParams.get('veg') === 'true');
  const [isNonVegMode, setIsNonVegMode] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isDeepScrolled, setIsDeepScrolled] = useState(false);

  useEffect(() => {
    const scrollContainer = document.querySelector('.app-scroll-container');
    const handleScroll = (e: Event) => {
      const target = e.target as HTMLElement;
      setIsScrolled(target.scrollTop > 50);
      setIsDeepScrolled(target.scrollTop > 260); // Approx height where search bar disappears
    };

    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll);
    }
    
    return () => {
      if (scrollContainer) {
        scrollContainer.removeEventListener('scroll', handleScroll);
      }
    };
  }, []);

  useEffect(() => {
    const scrollContainer = document.querySelector('.app-scroll-container');
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        const scrollTop = scrollContainer ? scrollContainer.scrollTop : 0;
        setIsDeepScrolled(!entry.isIntersecting && scrollTop > 150);
      },
      { threshold: 0, rootMargin: "-48px 0px 0px 0px" } 
    );
    
    const targetElement = document.getElementById('main-search-bar');
    if (targetElement) {
      observer.observe(targetElement);
    }
    
    return () => {
      if (targetElement) observer.unobserve(targetElement);
    };
  }, [isLoading]);

  useEffect(() => {
    if (stallId && typeof window !== "undefined") {
      const favs = JSON.parse(localStorage.getItem("swaddo_favorites") || "[]");
      setIsFavorite(favs.some((fav: any) => fav.id === stallId));
      
      const itemFavs = JSON.parse(localStorage.getItem("swaddo_item_favorites") || "[]");
      setItemFavorites(itemFavs);

      const urlVegMode = searchParams.get('veg') === 'true';
      const savedVegMode = localStorage.getItem("swaddo_veg_mode") === "true";
      if (urlVegMode) {
        setIsVegMode(true);
        localStorage.setItem("swaddo_veg_mode", "true");
      } else {
        setIsVegMode(savedVegMode);
      }
    }
  }, [stallId]);

  const toggleFavorite = () => {
    if (!stallData || typeof window === "undefined") return;
    
    const favs = JSON.parse(localStorage.getItem("swaddo_favorites") || "[]");
    const stallSummary = {
      id: stallId,
      name: stallData.name,
      address: stallData.address || stallData.location,
      rating: stallData.rating,
      image: stallData.image || stallData.cover_image,
      category: stallData.tags || "Food"
    };

    if (isFavorite) {
      const newFavs = favs.filter((f: any) => f.id !== stallId);
      localStorage.setItem("swaddo_favorites", JSON.stringify(newFavs));
      setIsFavorite(false);
    } else {
      favs.push(stallSummary);
      localStorage.setItem("swaddo_favorites", JSON.stringify(favs));
      setIsFavorite(true);
    }
  };

  const toggleItemFavorite = (id: string, e: any) => {
    e.stopPropagation();
    let newFavs = [...itemFavorites];
    if (newFavs.includes(id)) {
      newFavs = newFavs.filter((fid: string) => fid !== id);
    } else {
      newFavs.push(id);
    }
    setItemFavorites(newFavs);
    localStorage.setItem("swaddo_item_favorites", JSON.stringify(newFavs));
  };

  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };
  
  const { cart, updateQuantity, cartItemCount, cartTotal } = useCart();

  // Calculate markup distance
  useEffect(() => {
    if (!stallData) return;
    let active = true;
    const calculateMarkup = async () => {
      let currentItemMarkup = 0;
      if (stallData?.latitude && stallData?.longitude) {
        try {
          const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5005/api';
          let browsingDistanceKm = 0;
          if (latitude && longitude) {
             const routeRes = await fetch(`${baseUrl}/location/route`, {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({ originLat: parseFloat(stallData.latitude), originLng: parseFloat(stallData.longitude), destLat: latitude, destLng: longitude })
             });
             const data = await routeRes.json();
             if (data.status === 'success' && data.data) browsingDistanceKm = data.data.distanceKm;
          }
          let physicalDistanceKm = 0;
          if (liveLatitude && liveLongitude) {
             const liveRouteRes = await fetch(`${baseUrl}/location/route`, {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({ originLat: parseFloat(stallData.latitude), originLng: parseFloat(stallData.longitude), destLat: liveLatitude, destLng: liveLongitude })
             });
             const liveData = await liveRouteRes.json();
             if (liveData.status === 'success' && liveData.data) physicalDistanceKm = liveData.data.distanceKm;
          }
          if (active && (browsingDistanceKm >= 4.0 || physicalDistanceKm >= 4.0)) {
            // currentItemMarkup = 20; // DISABLED FOR NOW: Replaced with >4km blocking logic in cart
          }
        } catch (e) {
          if (active) {
            let browsingDist = (latitude && longitude) ? getDistance(parseFloat(stallData.latitude), parseFloat(stallData.longitude), latitude, longitude) : 0;
            let physicalDist = (liveLatitude && liveLongitude) ? getDistance(parseFloat(stallData.latitude), parseFloat(stallData.longitude), liveLatitude, liveLongitude) : 0;
            if (browsingDist >= 3.2 || physicalDist >= 3.2) {
              // currentItemMarkup = 20; // DISABLED FOR NOW
            }
          }
        }
      }
      if (active) setItemMarkup(currentItemMarkup);
    };
    calculateMarkup();
    return () => { active = false; };
  }, [stallData, latitude, longitude, liveLatitude, liveLongitude]);

  // Socket IO real-time updates
  useEffect(() => {
    if (!stallId) return;
    let socketUrl = process.env.NEXT_PUBLIC_WS_URL; if (!socketUrl && process.env.NEXT_PUBLIC_API_URL) socketUrl = process.env.NEXT_PUBLIC_API_URL.replace(/\/api\/?$/, ""); 
    const socket = io(socketUrl || "http://localhost:5005", { transports: ["websocket", "polling"], reconnection: true });
    
    const channel = `stall:${stallId}:menu`;
    socket.on("connect", () => socket.emit("join_room", channel));
    
    socket.on(channel, (payload) => {
      const { type, item } = payload;
      mutateMenu((current: any) => {
        if (!current) return current;
        let menuArr = current.data || current;
        if (!Array.isArray(menuArr)) menuArr = [];
        
        let newArr = [...menuArr];
        switch (type) {
          case "item_added":
            newArr.unshift(item);
            break;
          case "item_updated":
          case "stock_changed":
            newArr = newArr.map(p => p.id?.toString() === item.id?.toString() ? { ...p, ...item } : p);
            break;
          case "item_deleted":
            newArr = newArr.filter(p => p.id?.toString() !== item.id?.toString());
            break;
        }
        return { ...current, data: newArr };
      }, false);
    });

    socket.on("stall_update", (updatedStall) => {
      if (updatedStall.id?.toString() === stallId) {
        mutateStall((current: any) => {
          if (!current) return current;
          const currentStall = current.data || current;
          return { ...current, data: { ...currentStall, ...updatedStall } };
        }, false);
      }
    });

    return () => { socket.disconnect(); };
  }, [stallId, mutateMenu, mutateStall]);

  const handleUpdateCartLocal = (item: any, delta: number) => {
    updateQuantity(stallId as string, stallData.name, { id: item.id.toString(), name: item.name, price: Number(item.price), markup: itemMarkup, isVeg: item.isVeg ?? true }, delta);
  };

  const dynamicCategories = ["All", ...Array.from(new Set(items.map(i => i.category)))];

  const categoriesToRender = activeCategory === "All" 
    ? dynamicCategories.filter(c => c !== "All")
    : [activeCategory];

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const renderMenuItem = (item: any) => {
    const qty = cart.stallId === stallId ? (cart.items.find(i => i.id === item.id.toString())?.quantity || 0) : 0;
    const basePrice = Number(item.price) + itemMarkup;
      const discountPercentage = Number(item.discount_percentage) || 0;
      const hasDiscount = discountPercentage > 0;
      const originalPrice = hasDiscount ? Math.round(basePrice / (1 - (discountPercentage / 100))) : basePrice;
      const otherAppPrice = hasDiscount ? `${Math.floor(originalPrice * 1.05)}-${Math.floor(originalPrice * 1.15)}` : null;
    
    return (
      <motion.div 
        layout
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        key={item.id} 
        className={`flex flex-col bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] border border-gray-100 overflow-visible ${item.isSoldOut ? "opacity-60 grayscale-[0.2]" : ""}`}
      >
        {/* Top Image */}
        <div className="relative w-full aspect-[4/3] bg-[#FDEADD] group overflow-hidden rounded-t-2xl shrink-0">
          <div className="absolute inset-0 z-0">
            <div className="w-full h-full bg-[url('/placeholder.png')] bg-repeat opacity-60 bg-[length:120px]"></div>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={item.image || '/placeholder.png'} alt={item.name} className="relative z-10 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
          <div className="absolute top-2 left-2 bg-white text-green-700 text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm z-20">
            Popular
          </div>
        </div>
        
        {/* Info */}
        <div className="p-2.5 pt-4 flex flex-col flex-1 relative rounded-b-2xl bg-white">
          {/* Add Button overlapping the image and info section */}
          <div className="absolute -top-5 right-2 z-30">
            {item.isSoldOut || stallData?.isOpen === false || stallData?.is_open === false ? (
              <div className="py-1 px-3 bg-gray-100 text-gray-500 shadow-md border border-gray-200 text-[10px] font-black text-center rounded-xl uppercase">
                {stallData?.isOpen === false || stallData?.is_open === false ? "Closed" : "Sold Out"}
              </div>
            ) : qty === 0 ? (
              <button 
                onClick={() => handleUpdateCartLocal(item, 1)}
                className="w-10 h-10 bg-white shadow-md border-[2px] border-[#F48FB1] rounded-full flex items-center justify-center hover:bg-pink-50 transition-colors"
              >
                <Plus size={20} className="text-[#D81B60]" strokeWidth={3.5} />
              </button>
            ) : (
              <div className="flex items-center justify-between w-20 h-10 bg-white text-[#D81B60] font-black text-sm rounded-full shadow-md border-[2px] border-[#F48FB1] overflow-hidden px-1">
                <button onClick={() => handleUpdateCartLocal(item, -1)} className="w-6 h-full flex justify-center items-center hover:bg-pink-50 transition-colors"><Minus size={14} strokeWidth={3.5} /></button>
                <span className="text-[14px] text-gray-900">{qty}</span>
                <button onClick={() => handleUpdateCartLocal(item, 1)} className="w-6 h-full flex justify-center items-center hover:bg-pink-50 transition-colors"><Plus size={14} strokeWidth={3.5} /></button>
              </div>
            )}
          </div>

          <div className="inline-flex items-center gap-0.5 bg-green-50 border border-green-100 text-green-700 px-1 py-0.5 rounded text-[10px] font-black self-start -mt-3 mb-1.5 relative z-10 shadow-sm">
              <Star size={10} className="fill-green-700" />
              3.6
          </div>

          <div className="flex items-start gap-1 mb-1.5">
            <h3 className="font-body font-bold text-gray-900 text-[13px] leading-[1.3] line-clamp-3">
              <span className="inline-block mr-1 align-text-bottom pb-[2px]">{item.isVeg ? <VegIcon /> : <NonVegIcon />}</span>
              {item.name}
            </h3>
          </div>
          
          <div className="flex items-center gap-1.5 mb-1 mt-auto pt-1">
              {hasDiscount ? (
                <>
                  <span className="text-gray-400 text-[12px] font-semibold line-through decoration-gray-300">&#8377;{originalPrice}</span>
                  <span className="bg-pink-100 text-[#C2185B] text-[11px] font-black px-1.5 py-0.5 rounded">&#8377;{basePrice}</span>
                </>
              ) : (
                <span className="text-gray-900 text-[13px] font-black">&#8377;{basePrice}</span>
              )}
            </div>
            
            {hasDiscount && otherAppPrice && (
              <div className="flex items-center gap-1">
                <PromoIcon className="w-4 h-4 object-contain opacity-70 grayscale" />
                <span className="text-gray-500 text-[11px] font-medium">Other apps: &#8377;{otherAppPrice}</span>
              </div>
            )}
        </div>
      </motion.div>
    );
  };

  // Handle Android Back Button for Search Overlay
  useEffect(() => {
    const handlePopState = () => {
      if (isSearchOpen) {
        setIsSearchOpen(false);
        setSearchQuery("");
      }
    };

    if (isSearchOpen) {
      window.history.pushState({ searchOpen: true }, '');
      window.addEventListener('popstate', handlePopState);
    }

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isSearchOpen]);

  if (isLoading || !stallData) {
    return (
      <div className="min-h-screen bg-gray-50 pb-32">
        <div className="w-full h-[180px] xl:h-[240px] bg-gray-200 animate-pulse"></div>
        <div className="px-4 xl:px-8 py-5">
          <div className="h-8 bg-gray-200 rounded-md w-1/2 mb-2 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded-md w-3/4 mb-6 animate-pulse"></div>
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <MenuItemShimmer key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-32 font-body relative">
      {/* Sticky Header */}
      <div className={`fixed top-0 left-0 w-full bg-white z-50 shadow-[0_2px_10px_rgba(0,0,0,0.05)] transition-all duration-300 ${isScrolled ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'}`}>
        <div className="px-4 py-3 flex items-center justify-between gap-3">
          <button onClick={() => router.back()} className="text-gray-700 shrink-0">
            <ArrowLeft size={24} />
          </button>
          
          {isDeepScrolled ? (
            <div className="flex-1 relative w-full h-[40px] bg-gray-100/80 rounded-full flex items-center px-4" onClick={() => setIsSearchOpen(true)}>
              <div className="bg-transparent border-none outline-none text-[14px] font-medium text-gray-500 w-full text-left">Search in {stallData.name}</div>
              <Search size={18} className="text-gray-500 ml-2 shrink-0" />
            </div>
          ) : (
            <>
              <div className="flex-1 font-bold text-gray-900 text-[16px] tracking-tight truncate max-w-[200px] sm:max-w-xs text-center sm:text-left">
                {stallData.name} <span className="text-gray-400 font-medium px-1">•</span> <span className="text-gray-600 font-medium text-[14px]">{stallData.prep_time ? `${Number(stallData.prep_time)}-${Number(stallData.prep_time) + 10}` : '35-45'} mins</span>
              </div>
              <button onClick={() => setIsSearchOpen(true)} className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-700 border border-gray-100 shadow-sm shrink-0">
                <Search size={18} strokeWidth={2.5} />
              </button>
            </>
          )}
        </div>
        
        {/* Sticky Filter Chips */}
        {isDeepScrolled && (
          <div className="flex overflow-x-auto gap-3 scrollbar-hide px-4 pb-3 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-2 border border-gray-200 rounded-full px-3 py-1.5 shrink-0 bg-white">
              <VegIcon />
              <div className={`w-8 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${isVegMode ? 'bg-green-600' : 'bg-gray-200'}`} onClick={() => { setIsVegMode(!isVegMode); if (!isVegMode) setIsNonVegMode(false); }}>
                <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${isVegMode ? 'translate-x-3' : 'translate-x-0'}`}></div>
              </div>
            </div>
            <div className="flex items-center gap-2 border border-gray-200 rounded-full px-3 py-1.5 shrink-0 bg-white">
              <NonVegIcon />
              <div className={`w-8 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${isNonVegMode ? 'bg-[#8B3A1A]' : 'bg-gray-200'}`} onClick={() => { setIsNonVegMode(!isNonVegMode); if (!isNonVegMode) setIsVegMode(false); }}>
                <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${isNonVegMode ? 'translate-x-3' : 'translate-x-0'}`}></div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 border border-gray-200 rounded-full px-3 py-1.5 shrink-0 bg-white">
              <PromoIcon className="w-5 h-5 object-contain" />
              <span className="text-[13px] font-bold text-gray-800">10%-20% lower prices</span>
            </div>
            <div className="flex items-center border border-gray-200 rounded-full px-4 py-1.5 shrink-0 bg-white">
              <span className="text-[13px] font-bold text-gray-800">Rating</span>
            </div>
          </div>
        )}
      </div>

      {/* Hero Section */}
      <div className="relative w-full h-[160px] md:h-[180px] xl:h-[220px] bg-gray-100">
        {(() => {
          const imgUrl = stallData.image || stallData.cover_image;
          const isValid = imgUrl && !imgUrl.includes('unsplash.com') && !imgUrl.includes('picsum.photos');
          return isValid ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={imgUrl} alt={stallData.name} className="relative z-10 w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
          ) : null;
        })()}
        
        {/* Floating Actions */}
        <div className="absolute top-4 xl:top-6 left-4 xl:left-8 right-4 xl:right-8 flex justify-between items-center z-20">
          <button onClick={() => router.back()} className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div className="flex gap-3">
            <button className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white transition-colors">
              <Share2 size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-3xl mx-auto relative z-20">
        
        {/* Overlapping Info Card */}
        <div className="relative -mt-8 bg-white rounded-t-[32px] pt-6 px-4 pb-4">
          <StampIcon />
          <h1 className="text-[26px] font-body font-black text-gray-900 leading-none tracking-tight mb-3 pr-16">{stallData.name}</h1>
          
          <div className="flex items-center gap-2 text-[14px] text-gray-600 font-medium mb-4 relative">
            <Star size={14} className="fill-green-700 text-green-700" />
            <span className="font-bold text-green-700">{Number(stallData.rating || 4.3).toFixed(1)}</span>
            <span className="text-gray-300">|</span>
            <span>{stallData.prep_time ? `${Number(stallData.prep_time)}-${Number(stallData.prep_time) + 10}` : '35-45'} mins</span>
            <span className="text-gray-300">|</span>
            <span 
              className="cursor-pointer flex items-center gap-0.5 relative"
              onClick={() => setIsAddressOpen(!isAddressOpen)}
            >
              {getShortAddress(stallData.address || stallData.location)} 
              <ChevronDown size={14} className={`inline opacity-60 transition-transform ${isAddressOpen ? 'rotate-180' : ''}`} />
            </span>

            {/* Address Dropdown */}
            <AnimatePresence>
              {isAddressOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="absolute top-full mt-1 right-0 sm:left-1/2 sm:-translate-x-1/2 bg-white shadow-xl border border-gray-100 rounded-xl p-3.5 z-[100] w-[260px]"
                >
                  <p className="text-[13px] text-gray-800 leading-snug">{stallData.address || stallData.location}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Promo Section */}
          <div className="flex items-start gap-2 mb-4">
            <PromoIcon className="w-8 h-8 shrink-0 object-contain mt-0.5" />
            <div>
              <p className="font-extrabold text-[#C2185B] text-[15px] leading-tight">20% LOWER PRICES vs OTHER APPS</p>
              <p className="text-gray-500 text-[12px] mt-0.5">Prices seen only on Swaddo</p>
            </div>
          </div>

          {/* Search Bar */}
          <div id="main-search-bar" onClick={() => setIsSearchOpen(true)} className="relative w-full h-[46px] bg-gray-100/80 rounded-full flex items-center px-4 mb-4 cursor-text">
            <Search size={20} className="text-gray-500 mr-2" />
            <div className="bg-transparent border-none outline-none text-[15px] font-medium text-gray-500 w-full text-left">Search for dishes</div>
          </div>

          {/* Filter Chips */}
          <div id="filter-chips" className="flex overflow-x-auto gap-3 scrollbar-hide pb-2">
            <div className="flex items-center gap-2 border border-gray-200 rounded-full px-3 py-1.5 shrink-0 bg-white">
              <VegIcon />
              <div className={`w-8 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${isVegMode ? 'bg-green-600' : 'bg-gray-200'}`} onClick={() => { setIsVegMode(!isVegMode); if (!isVegMode) setIsNonVegMode(false); }}>
                <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${isVegMode ? 'translate-x-3' : 'translate-x-0'}`}></div>
              </div>
            </div>
            <div className="flex items-center gap-2 border border-gray-200 rounded-full px-3 py-1.5 shrink-0 bg-white">
              <NonVegIcon />
              <div className={`w-8 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${isNonVegMode ? 'bg-[#8B3A1A]' : 'bg-gray-200'}`} onClick={() => { setIsNonVegMode(!isNonVegMode); if (!isNonVegMode) setIsVegMode(false); }}>
                <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${isNonVegMode ? 'translate-x-3' : 'translate-x-0'}`}></div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 border border-gray-200 rounded-full px-3 py-1.5 shrink-0 bg-white">
              <PromoIcon className="w-5 h-5 object-contain" />
              <span className="text-[13px] font-bold text-gray-800">10%-20% lower prices</span>
            </div>
            <div className="flex items-center border border-gray-200 rounded-full px-4 py-1.5 shrink-0 bg-white">
              <span className="text-[13px] font-bold text-gray-800">Rating</span>
            </div>
          </div>
        </div>

        {/* Menu Grid */}
        <div className="bg-white px-4 pb-6">
          {items.length === 0 && !isLoading && (
            <div className="flex justify-center items-center h-40">
               <Loader2 className="animate-spin text-[#FF5722]" size={30} />
            </div>
          )}
          
          {categoriesToRender.map(cat => {
            const currentItems = items.filter(item => 
              item.category === cat && 
              (!isVegMode || item.isVeg) && 
              (!isNonVegMode || !item.isVeg)
            );
            if (currentItems.length === 0) return null;

            return (
              <div key={cat} className="pt-2 mb-8">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <h2 className="text-[17px] font-black text-gray-900 tracking-tight leading-none capitalize">{cat}</h2>
                  </div>
                  <ChevronDown size={20} className="text-gray-400" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <AnimatePresence>
                    {currentItems.map(item => renderMenuItem(item))}
                  </AnimatePresence>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Search Overlay */}
      <AnimatePresence>
        {isSearchOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-white z-[100] flex flex-col"
          >
            {/* Search Header */}
            <div className="px-4 py-3 flex items-center gap-3 border-b border-gray-100 shadow-sm bg-white">
              <button onClick={() => { window.history.back(); }} className="text-gray-700 shrink-0">
                <ArrowLeft size={24} />
              </button>
              <div className="flex-1 relative w-full h-[40px] bg-gray-100/80 rounded-full flex items-center px-4">
                <input 
                  type="text" 
                  autoFocus
                  placeholder={`Search in ${stallData.name}`} 
                  className="bg-transparent border-none outline-none text-[15px] font-medium text-gray-800 w-full placeholder:text-gray-500" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery ? (
                  <button onClick={() => setSearchQuery("")} className="ml-2 shrink-0 p-1">
                    <div className="w-5 h-5 bg-gray-300 rounded-full flex items-center justify-center text-white text-[12px] font-bold pb-0.5">x</div>
                  </button>
                ) : (
                  <Search size={18} className="text-gray-500 ml-2 shrink-0" />
                )}
              </div>
            </div>

            {/* Search Results */}
            <div className="flex-1 overflow-y-auto px-4 py-4 bg-gray-50/30">
              {searchQuery.trim() === "" ? (
                <div className="text-center text-gray-400 mt-10 text-[15px] font-medium">Type a dish name to search...</div>
              ) : (
                (() => {
                  const query = searchQuery.toLowerCase().trim();
                  const results = items.filter(item => 
                    item.name.toLowerCase().includes(query) || 
                    item.description.toLowerCase().includes(query)
                  );

                  if (results.length === 0) {
                    return (
                      <div className="text-gray-800 text-[15px] font-bold mt-4">
                        No results found for "{searchQuery}"
                      </div>
                    );
                  }

                  return (
                    <div className="grid grid-cols-2 gap-4 pb-24">
                      {results.map(item => renderMenuItem(item))}
                    </div>
                  );
                })()
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating MENU Button */}
      <div className="fixed bottom-24 right-5 z-40">
        <button className="w-[56px] h-[56px] bg-black text-white rounded-full flex flex-col items-center justify-center shadow-[0_4px_15px_rgba(0,0,0,0.3)] hover:scale-105 transition-transform">
          <BookOpen size={18} className="text-gray-200 mb-0.5" strokeWidth={2} />
          <span className="text-[9px] font-bold tracking-widest text-gray-200">MENU</span>
        </button>
      </div>

    </div>
  );
}


export default function StallDetail() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><Loader2 className="animate-spin text-primary" size={40} /></div>}>
      <StallDetailContent />
    </Suspense>
  )
}

