"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search, MapPin, Star, Heart, Mic, Camera, ChevronDown, CheckCircle2, Menu, Clock, X, Check, Plus, Minus } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { motion, AnimatePresence } from "framer-motion";
import LocationSelector from "@/components/LocationSelector";
import { useLocation } from "@/context/LocationContext";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

const categories = [
  { name: "Burgers", image: "/categories/burger.png", price: "49" },
  { name: "Biryani", image: "/categories/biryani.png", price: "79" },
  { name: "Noodles", image: "/categories/Noodles.png", price: "69" },
  { name: "Momos", image: "/categories/momo.png", price: "49" },
  { name: "Pizza", image: "/categories/pizza.png", price: "99" },
  { name: "Rolls", image: "/categories/roll.png", price: "49" },
  { name: "Ice Cream", image: "/categories/icecream.png", price: "49" },
  { name: "Cake", image: "/categories/cake.png", price: "49" },
  { name: "Sandwich", image: "/categories/sandwich.png", price: "49" },
  { name: "Paratha", image: "/categories/paratha.png", price: "49" },
  { name: "Pasta", image: "/categories/pasta.png", price: "49" },
  { name: "Khichdi", image: "/categories/khichdi.png", price: "49" },
  { name: "Kebab", image: "/categories/kebab.png", price: "49" },
  { name: "Coffee", image: "/categories/coffee.png", price: "49" },
  { name: "Pastry", image: "/categories/pastry.png", price: "49" },
  { name: "Dosa", image: "/categories/Dosa.png", price: "49" },
  { name: "Gulab Jamun", image: "/categories/Gulab Jamun.png", price: "49" },
  { name: "Juice", image: "/categories/juice.png", price: "49" },
  { name: "Pav Bhaji", image: "/categories/Pav Bhaji.png", price: "49" },
  { name: "Poha", image: "/categories/poha.png", price: "49" },
  { name: "Poori", image: "/categories/poori.png", price: "49" },
  { name: "Jalebi", image: "/categories/jalebi.png", price: "49" },
  { name: "Pakoda", image: "/categories/pakoda.png", price: "49" },
  { name: "Kachori", image: "/categories/kachori.png", price: "49" },
  { name: "Cutlet", image: "/categories/cutlet.png", price: "49" },
];

export default function Home() {
  const router = useRouter();
  const { currentLocation } = useLocation();
  const { updateQuantity, cart } = useCart();
  const [activeCategory, setActiveCategory] = useState("All");
  const [isVegMode, setIsVegMode] = useState(false);
  const [isVegModalOpen, setIsVegModalOpen] = useState(false);
  const [vegChoice, setVegChoice] = useState("");
  const [rememberVegChoice, setRememberVegChoice] = useState(false);
  const searchPlaceholderItems = ["'Pizza'", "'Biryani'", "'Burger'", "'Noodles'"];
  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  const [stalls, setStalls] = useState<any[]>([]);

  const [bannerRefreshKey, setBannerRefreshKey] = useState(0);
  const [scrollY, setScrollY] = useState(0);
  const [scrollDirection, setScrollDirection] = useState('up');
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const searchInterval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % searchPlaceholderItems.length);
    }, 3000);
    
    const bannerRefreshInterval = setInterval(() => {
      setBannerRefreshKey((prev) => prev + 1);
    }, 15000);

    return () => {
      clearInterval(searchInterval);
      clearInterval(bannerRefreshInterval);
    };
  }, []);

  useEffect(() => {
    api.get('/stalls').then(res => {
      if (res.data && res.data.data) {
        const backendStalls = res.data.data.map((stall: any) => ({
          id: stall.id,
          name: stall.name,
          isAd: false,
          discountText: stall.active_offer_title || "20% LOWER PRICES",
          showStamp: true,
          rating: stall.rating || "4.1",
          deliveryTime: `${stall.prep_time || 30}-${(stall.prep_time || 30) + 10} mins`,
          categories: stall.tags || "Food",
          deliveryInfo: `Free Delivery • Items At ₹${stall.min_price || 99}`,
        }));
        setStalls(backendStalls);
      }
    }).catch(err => console.error("Error fetching stalls:", err));
  }, []);

  useEffect(() => {
    const scrollContainer = document.querySelector('.app-scroll-container');
    if (!scrollContainer) return;
    
    let lastScrollY = scrollContainer.scrollTop;
    
    const handleScroll = (e: any) => {
      const currentScrollY = e.target.scrollTop;
      setScrollY(currentScrollY);
      setIsScrolled(currentScrollY > 0);
      
      if (currentScrollY > lastScrollY && currentScrollY > 50) {
        setScrollDirection('down');
      } else if (currentScrollY < lastScrollY) {
        setScrollDirection('up');
      }
      lastScrollY = currentScrollY;
    };
    
    scrollContainer.addEventListener('scroll', handleScroll);
    return () => scrollContainer.removeEventListener('scroll', handleScroll);
  }, []);

  const formatAddress = (address: string) => {
    if (!address || address === "Location not set") return "Select Location";
    const parts = address.split(',');
    if (parts.length > 2) {
      return `${parts[0]}, ${parts[1]}`;
    }
    return address;
  };

  return (
    <div className="flex flex-col min-h-screen pb-24 bg-white font-body">

      {/* 1. Floating Search Bar (Appears on scroll up via transform) */}
      <div 
        className={`fixed left-0 w-full z-40 bg-white px-4 py-2 shadow-sm border-b border-gray-100 transition-transform duration-300 ease-out ${
          scrollY > 280 && scrollDirection === 'up' ? 'translate-y-0' : '-translate-y-full pointer-events-none'
        }`}
        style={{ top: 0 }}
      >
        <div className="flex items-center gap-3">
          <div className="relative flex-1 bg-white rounded-full shadow-sm border border-gray-200 h-[44px] cursor-text overflow-hidden flex items-center px-4" onClick={() => router.push("/search")}>
            <Search className="text-[#FF007F] shrink-0" size={18} />
            <div className="ml-3 flex-1 overflow-hidden relative h-full">
              <AnimatePresence mode="popLayout">
                <motion.div
                  key={placeholderIndex}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -20, opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  className="flex items-center h-full absolute w-full"
                >
                  <span className="text-[14px] text-gray-500 font-medium">Search for {searchPlaceholderItems[placeholderIndex]}</span>
                </motion.div>
              </AnimatePresence>
            </div>
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
            className="flex flex-col items-center justify-center h-[44px] w-[44px] rounded-xl bg-white shadow-sm border border-gray-200 shrink-0 relative"
          >
            <span className="font-black text-[9px] text-[#22C55E] leading-none mb-1">VEG</span>
            <div className={`w-5 h-2.5 rounded-full flex items-center p-[1px] transition-colors border ${isVegMode ? 'bg-[#22C55E] border-[#22C55E] justify-end' : 'bg-gray-100 border-gray-300 justify-start'}`}>
              <div className={`w-2 h-2 rounded-full shadow-sm ${isVegMode ? 'bg-white' : 'bg-gray-400'}`}></div>
            </div>
          </button>
        </div>
      </div>

      <div className={`pt-4 pb-4 px-4 flex flex-col transition-colors duration-300 relative z-20 ${isScrolled ? 'bg-white shadow-sm' : 'bg-[#FF5722]'}`}>
        
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3 flex-1 overflow-hidden">
            <div className="w-10 h-10 rounded-full bg-[#FFD700] flex items-center justify-center shrink-0 shadow-sm border border-white/20">
              <svg viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 ml-0.5"><path d="M3 11l19-9-9 19-2-8-8-2z"/></svg>
            </div>
            <LocationSelector customTrigger={(onClick) => (
              <div className="flex flex-col flex-1 truncate cursor-pointer" onClick={onClick}>
                 <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={`font-heading font-extrabold text-[16px] tracking-tight leading-none truncate transition-colors ${isScrolled ? 'text-gray-900' : 'text-white'}`}>
                       {formatAddress(currentLocation || "Pune Railway Station...")}
                    </span>
                    <ChevronDown size={18} className={`transition-colors ${isScrolled ? 'text-gray-900' : 'text-white'}`} />
                 </div>
                 <span className={`text-[12px] font-medium truncate pr-4 mt-1 transition-colors ${isScrolled ? 'text-gray-500' : 'text-white/90'}`}>
                    Sangamvadi, Pune, Maharashtra, India
                 </span>
              </div>
            )} />
          </div>
          
          <button onClick={() => router.push('/profile')} className="w-10 h-10 flex flex-col items-start justify-center gap-[5px] shrink-0 pl-1 text-white">
             <div className={`w-6 h-[3px] rounded-full transition-colors ${isScrolled ? 'bg-gray-900' : 'bg-white'}`}></div>
             <div className={`w-[18px] h-[3px] rounded-full transition-colors ${isScrolled ? 'bg-gray-900' : 'bg-white'}`}></div>
             <div className={`w-6 h-[3px] rounded-full transition-colors ${isScrolled ? 'bg-gray-900' : 'bg-white'}`}></div>
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className={`relative flex-1 rounded-full shadow-md h-[52px] cursor-text overflow-hidden flex items-center px-4 border transition-colors ${isScrolled ? 'bg-gray-50 border-gray-200' : 'bg-white border-transparent'}`} onClick={() => router.push("/search")}>
            <Search className={`shrink-0 transition-colors ${isScrolled ? 'text-[#FF007F]' : 'text-gray-400'}`} size={20} />
            <div className="ml-3 flex-1 overflow-hidden relative h-full">
              <AnimatePresence mode="popLayout">
                <motion.div
                  key={placeholderIndex}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -20, opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  className="flex items-center h-full absolute w-full"
                >
                  <span className={`text-[15px] font-medium transition-colors ${isScrolled ? 'text-gray-600' : 'text-gray-500'}`}>Search for {searchPlaceholderItems[placeholderIndex]}</span>
                </motion.div>
              </AnimatePresence>
            </div>
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
            className={`flex flex-col items-center justify-center h-[52px] w-[52px] rounded-2xl shadow-md shrink-0 border relative z-50 transition-colors ${isScrolled ? 'bg-gray-50 border-gray-200' : 'bg-white border-transparent'}`}
          >
            <span className="font-black text-[11px] text-[#22C55E] leading-none mb-1">VEG</span>
            <div className={`w-6 h-3.5 rounded-full flex items-center p-[2px] transition-colors border ${isVegMode ? 'bg-[#22C55E] border-[#22C55E] justify-end' : 'bg-gray-200 border-gray-300 justify-start'}`}>
              <div className={`w-2.5 h-2.5 rounded-full shadow-sm ${isVegMode ? 'bg-white' : 'bg-gray-400'}`}></div>
            </div>
          </button>
        </div>
      </div>

      <div className="bg-[#FF5722] rounded-b-[24px] pt-1 pb-6 flex flex-col relative z-10 -mt-4 overflow-hidden">
        <div className="relative w-full h-[165px] z-20 mt-4 flex justify-between items-center bg-transparent">
          <AnimatePresence mode="wait">
            <motion.div
              key={bannerRefreshKey}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0, transition: { duration: 0.15 } }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
              className="absolute inset-0 w-full h-full flex justify-between items-center"
            >
               <div className="absolute right-[0%] top-[-10px] w-[65%] h-[200px] bg-[#FCE38A] z-0" style={{ clipPath: 'polygon(40% 0%, 100% 0%, 75% 50%, 85% 100%, 0% 100%, 75% 50%)' }}></div>
               <div className="relative z-10 flex flex-col max-w-[55%] pl-6 mb-0 justify-center h-full">
                 <div className="relative w-[170px] h-[120px] mt-0">
                   <Image 
                     src="/prices.png" 
                     alt="Prices That Slay Everyday" 
                     fill 
                     className="object-contain object-left"
                   />
                 </div>
                 <Link href="/lowest-prices">
                    <button className="bg-[#FF007F] text-white font-black text-[13px] px-6 py-2.5 rounded-full w-fit uppercase tracking-wide mt-1 relative z-20 ml-0 hover:scale-105 transition-transform">
                      ORDER NOW
                    </button>
                 </Link>
               </div>
                 <div className="absolute right-[5px] top-[-5px] w-[145px] h-[145px] rounded-full z-10">
                   <AnimatePresence mode="wait">
                     <motion.div
                       key="static-plate"
                       initial={{ opacity: 0, scale: 0.5 }}
                       animate={{ opacity: 1, scale: 1 }}
                       exit={{ opacity: 0, scale: 0.5 }}
                       transition={{ type: "spring", stiffness: 120, damping: 20, duration: 1 }}
                       className="absolute inset-0 rounded-full overflow-hidden"
                     >
                       <motion.div
                         animate={{ rotate: [0, 360, 360] }}
                         transition={{ repeat: Infinity, duration: 3, ease: "easeInOut", times: [0, 0.2, 1] }}
                         className="absolute inset-0"
                       >
                         <Image src="/categories/frontpicture.png" alt="Promo" fill className="object-cover" />
                       </motion.div>
                     </motion.div>
                   </AnimatePresence>
                 </div>
                 <div className="absolute right-[38%] bottom-[-10px] -rotate-[22deg] transform origin-right z-20">
                   <motion.div 
                     key="static-price-container"
                     animate={{ 
                       scale: [0, 1, 1], 
                       opacity: [0, 1, 1], 
                       x: [100, 0, 0], 
                       y: [-60, 0, 0] 
                     }}
                     transition={{ repeat: Infinity, duration: 3, ease: "easeOut", times: [0, 0.2, 1] }}
                     className="bg-transparent flex flex-col items-end"
                   >
                     <div className="flex flex-col items-end -rotate-[4deg]">
                       <span className="text-[#FCE38A] font-black text-[12px] leading-none mb-[-2px] tracking-tight">ITEMS</span>
                       <span className="text-[#FCE38A] font-black text-[12px] leading-none mb-[-4px] tracking-tight">STARTING AT</span>
                     </div>
                     <span className="text-[#FF5722] font-black text-[38px] leading-none mt-0 tracking-tighter">
                       ₹49
                     </span>
                   </motion.div>
                 </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <div className="w-full mt-0 sticky top-0 z-30 bg-white">
        <div className={`w-full px-2 bg-white/95 backdrop-blur-sm pt-2 pb-1 transition-transform duration-300 ease-out ${
          scrollY > 280 && scrollDirection === 'up' ? 'translate-y-[60px]' : 'translate-y-0'
        }`}>
          <div className="flex overflow-x-auto hide-scrollbar gap-4 pb-2 px-2 snap-x items-end">
          
          <button onClick={() => setActiveCategory("All")} className="flex flex-col items-center shrink-0 snap-start ml-1">
             <div className={`w-[85px] h-[125px] rounded-[16px] flex flex-col items-center justify-between p-1 pt-3 pb-3 transition-colors ${activeCategory === "All" ? 'bg-[#FFF0F5]' : 'bg-transparent'}`}>
                <div className="w-[95px] h-[95px] relative drop-shadow-md mb-1 mt-1 translate-x-1.5">
                   <Image src="/categories/all.png" alt="All" fill className="object-contain scale-[1.35]" />
                </div>
                <span className={`text-[14px] font-black mt-0 z-10 relative ${activeCategory === "All" ? 'text-[#FF007F]' : 'text-[#4A5568]'}`}>All</span>
             </div>
          </button>

          {categories.map((cat) => (
            <button
              key={cat.name}
              onClick={() => setActiveCategory(cat.name)}
              className="flex flex-col items-center shrink-0 snap-start"
            >
              <div className={`w-[85px] h-[125px] rounded-[16px] flex flex-col items-center justify-start p-1 pt-3 pb-2 transition-colors ${activeCategory === cat.name ? 'bg-[#FFF0F5]' : 'bg-transparent'}`}>
                <div className="w-[85px] h-[85px] relative drop-shadow-sm mb-1 mt-0">
                  <Image src={cat.image} alt={cat.name} fill className={`object-contain ${cat.name === 'Gulab Jamun' ? 'scale-[1.9]' : 'scale-[1.3]'} ${cat.image.endsWith('.png') ? '' : 'mix-blend-multiply'}`} />
                </div>
                <div className="bg-[#FF007F] text-white text-[9.5px] font-black px-2.5 py-[3px] rounded-full -mt-2 z-10 shadow-sm border border-white tracking-wide">
                  FROM ₹{cat.price}
                </div>
                <span className={`text-[14px] font-black mt-1.5 w-full text-center truncate px-1 ${activeCategory === cat.name ? 'text-[#FF007F]' : 'text-[#4A5568]'}`}>
                  {cat.name}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
      </div>
        
      {/* Meals under ₹99 Header */}
      <div className="w-full mt-2">
        <div className="flex justify-between items-center mb-3 px-4">
          <h2 className="text-[20px] font-black text-gray-800 tracking-tight">Meals under ₹99</h2>
          <Link href="/meals-under-99">
            <button className="text-[13px] font-bold text-gray-600 flex items-center hover:text-gray-900 transition-colors">See All <ChevronRight size={16} className="ml-0.5" /></button>
          </Link>
        </div>

        {/* Horizontal Stalls Slider */}
        <div className="flex overflow-x-auto hide-scrollbar gap-3 px-4 pb-4 snap-x">
          {[
            { brand: "Domino's Pizza", item: "Garlic Breadsticks", price: 99, oldPrice: 125, rating: 4.0, img: "/categories/pizza.png" },
            { brand: "Frozen Bottle - Milkshakes, ...", item: "Peri Peri Maggi", price: 69, oldPrice: 159, rating: 5.0, img: "/categories/Noodles.png" },
            { brand: "SRUSHTI", item: "Jolada Rotti", price: 40, oldPrice: 80, rating: 4.5, img: "/categories/paratha.png" },
          ].map((item, idx) => (
             <div key={idx} className="flex flex-col bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.06)] overflow-visible relative border border-gray-100/50 shrink-0 w-[150px] snap-start mb-2">
                 
                {/* Image Area */}
                <div className="relative w-full h-[110px] bg-blue-50/50 rounded-t-2xl overflow-visible">
                  <div className="absolute inset-0 rounded-t-2xl overflow-hidden">
                     <Image src={item.img} alt="Food" fill className="object-cover" />
                  </div>
                  
                  {/* Popular Tag */}
                  <div className="absolute top-2 left-2 bg-white text-[#00A14F] font-black text-[10px] px-2 py-0.5 rounded-full shadow-sm z-10">
                    Popular
                  </div>
                  
                  {/* Plus Button */}
                  {cart.stallId === "meals_99_stall" && cart.items.find(i => i.id === idx.toString()) ? (
                    <div className="absolute -bottom-4 right-3 h-7 bg-white rounded-lg flex items-center justify-between shadow-md border border-gray-100 px-1 overflow-hidden z-20">
                      <button 
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); updateQuantity("meals_99_stall", "Meals under ₹99", { id: idx.toString(), name: item.item, price: item.price, markup: 0 }, -1); }}
                        className="w-6 h-full flex justify-center items-center text-gray-600 active:bg-gray-100"
                      ><Minus size={14} /></button>
                      <span className="text-[12px] font-bold text-gray-800 w-4 text-center">{cart.items.find(i => i.id === idx.toString())?.quantity}</span>
                      <button 
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); updateQuantity("meals_99_stall", "Meals under ₹99", { id: idx.toString(), name: item.item, price: item.price, markup: 0 }, 1); }}
                        className="w-6 h-full flex justify-center items-center text-[#FF007F] active:bg-gray-100"
                      ><Plus size={14} /></button>
                    </div>
                  ) : (
                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        updateQuantity(
                          "meals_99_stall", 
                          "Meals under ₹99", 
                          { id: idx.toString(), name: item.item, price: item.price, markup: 0 }, 
                          1
                        );
                      }}
                      className="absolute -bottom-4 right-3 w-7 h-7 bg-white border-2 border-pink-100 text-[#FF007F] shadow-sm rounded-full flex items-center justify-center text-lg font-semibold hover:bg-pink-50 transition-colors z-20"
                    >
                      <Plus size={16} />
                    </button>
                  )}
                  
                  {/* Rating Tag */}
                  <div className="absolute -bottom-2.5 left-2 bg-white text-[#00A14F] font-black text-[10px] px-1.5 py-0.5 rounded-md shadow-sm border border-gray-100 flex items-center gap-0.5 z-20">
                    <Star size={10} className="fill-[#00A14F]" />
                    {item.rating.toFixed(1)}
                  </div>
                </div>

                {/* Info Area */}
                <div className="px-2.5 pt-4 pb-3 flex flex-col gap-0.5 bg-white rounded-b-2xl relative z-10">
                  <p className="text-[11px] font-medium text-gray-500 leading-tight truncate">{item.brand}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <div className="shrink-0 w-[10px] h-[10px] border border-[#00A14F] flex items-center justify-center rounded-[2px]">
                      <div className="w-1.5 h-1.5 bg-[#00A14F] rounded-full"></div>
                    </div>
                    <h3 className="font-bold text-[13px] text-gray-900 leading-tight truncate">{item.item}</h3>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <span className="text-[12px] font-semibold text-gray-400 line-through">₹{item.oldPrice}</span>
                    <span className="text-[11px] font-black text-[#FF007F] bg-[#FFF0F5] px-1.5 py-0.5 rounded-md">₹{item.price}</span>
                  </div>
                </div>
             </div>
          ))}
        </div>
      </div>

      {/* Store Highlight Banner (Subway) */}
      <div className="w-full px-4 mt-2">
        <div className="relative w-full h-[110px] bg-white rounded-2xl shadow-[0_4px_15px_rgba(0,0,0,0.04)] border border-gray-100 flex items-center overflow-visible">
          
          {/* Left Text Content */}
          <div className="pl-4 flex flex-col justify-center z-10 w-[60%] h-full">
            <h3 className="font-black text-[#FF007F] text-[18px] tracking-tight leading-tight">Cravvers at ₹79*</h3>
            <p className="text-gray-500 text-[14px] font-medium mt-0.5 tracking-tight">From Subway</p>
            <button className="flex items-center gap-1.5 text-[#00A14F] font-black text-[13px] mt-2 tracking-wide uppercase">
              ORDER NOW 
              <div className="bg-[#00A14F] text-white rounded-full flex items-center justify-center w-[18px] h-[18px]">
                <ChevronRight size={14} strokeWidth={4} className="ml-[1px]" />
              </div>
            </button>
            <p className="text-[10px] text-gray-400 font-medium mt-1 tracking-tight">*T&C apply</p>
          </div>
          
          {/* Right Image Content */}
          <div className="absolute right-2 top-1/2 -translate-y-1/2 w-[110px] h-[110px] z-10 flex items-center justify-center">
            {/* Using burger as shown in the screenshot */}
            <Image src="/categories/burger.png" alt="Subway Burger" fill className="object-contain scale-110 drop-shadow-md" />
            
            {/* Circular Logo Badge overlapping the image */}
            <div className="absolute right-[-5px] top-[10px] w-[38px] h-[38px] bg-white rounded-full flex items-center justify-center border-[1.5px] border-yellow-100 shadow-sm z-20">
               <span className="text-[8px] font-black text-[#00A14F] leading-[1.1] tracking-tight text-center">SUB<br/>WAY</span>
            </div>
          </div>

        </div>
      </div>

      {/* 6. Comparison Section (SWADDO vs OTHER APPS) */}
      <div className="w-full mt-4 bg-[#FFF0F5] pt-3 pb-8 relative overflow-visible">
        {/* Wavy Top Border */}
        <div className="absolute top-[-10px] left-0 w-full overflow-hidden leading-none z-10">
          <svg className="relative block w-full h-[12px]" preserveAspectRatio="none" viewBox="0 0 1200 120">
            <path d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z" fill="#FFF0F5"></path>
          </svg>
        </div>

        {/* Header */}
        <div className="px-4 mb-3 mt-1">
          <div className="flex items-center gap-1.5 mb-0.5">
             <div className="flex -space-x-1">
               <div className="w-[18px] h-[18px] bg-[#FF007F] rounded-full flex items-center justify-center text-white text-[10px] font-black shadow-sm">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
               </div>
               <div className="w-[18px] h-[18px] bg-[#FF007F] rounded-full flex items-center justify-center text-white text-[10px] font-black shadow-sm">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
               </div>
             </div>
             <h3 className="text-[#FF007F] font-black text-[12px] uppercase tracking-wider">SWADDO <span className="text-[#FF007F] font-semibold lowercase italic text-[11px] ml-0.5 mr-0.5">vs</span> OTHER APPS</h3>
          </div>
          <h2 className="text-[26px] font-black text-[#FF007F] tracking-tighter leading-[1]">40-60% LOWER PRICES</h2>
        </div>

        {/* Horizontal Slider */}
        <div className="flex overflow-x-auto hide-scrollbar gap-2.5 px-4 pb-2 snap-x">
          {[
            { store: "Cheesiano Pizza", rating: 4.2, time: "50-55 mins", category: "Pizzas", price: "50", img: "/categories/pizza.png", lower: "40%" },
            { store: "Frozen Bottle - Milksha...", rating: 4.3, time: "40-50 mins", category: "Beverages", price: "50", img: "/categories/all.png", lower: "40%" },
            { store: "Wow! Momo", rating: 4.2, time: "45-55 mins", category: "Momos", price: "99", img: "/categories/momo.png", lower: "45%" }
          ].map((item, idx) => (
            <div key={idx} className="flex flex-col bg-white rounded-2xl shadow-sm border border-gray-100/50 overflow-hidden shrink-0 w-[145px] snap-start">
               {/* Image Area */}
               <div className="relative w-full h-[145px] bg-blue-50/50 overflow-hidden">
                 <Image src={item.img} alt={item.store} fill className="object-cover scale-110" />
                 {/* Dark Gradient */}
                 <div className="absolute bottom-0 w-full h-[60%] bg-gradient-to-t from-black/90 to-transparent"></div>
                 {/* Items at Price */}
                 <div className="absolute bottom-2 left-2 flex flex-col items-start leading-none gap-[1px]">
                    <span className="text-white font-bold text-[10px] tracking-wide shadow-sm opacity-90">ITEMS</span>
                    <span className="text-white font-black text-[16px] shadow-sm tracking-tight">AT ₹{item.price}</span>
                 </div>
               </div>
               
               {/* Info Area */}
               <div className="p-2 pb-2 bg-white flex flex-col">
                 <div>
                   <h3 className="font-bold text-[12.5px] text-gray-900 leading-tight truncate">{item.store}</h3>
                   <div className="flex items-center gap-1 mt-0.5 text-gray-700">
                     <div className="bg-[#00A14F] text-white rounded-full p-[2px] shadow-sm">
                       <Star size={7.5} className="fill-white" />
                     </div>
                     <span className="text-[11px] font-bold">{item.rating} <span className="font-medium text-gray-500">• {item.time}</span></span>
                   </div>
                   <p className="text-[11px] text-gray-500 mt-0 tracking-tight">{item.category}</p>
                 </div>
                 
                 {/* Divider */}
                 <div className="w-full h-[1px] bg-gray-100 my-1.5"></div>
                 
                 {/* Lower Price Tag */}
                 <div className="flex items-center gap-1 mb-0.5">
                   <div className="flex -space-x-[3px]">
                     <div className="w-3.5 h-3.5 rounded-full flex items-center justify-center text-[#FF007F]">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                     </div>
                     <div className="w-3.5 h-3.5 rounded-full flex items-center justify-center text-[#FF007F]">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                     </div>
                   </div>
                   <span className="text-[#FF007F] font-bold text-[10px] tracking-tight ml-0.5">Our app: {item.lower} lower</span>
                 </div>
               </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Offline Menu Price Match Advertisement Banner */}
      <div className="w-full px-4 mt-2 mb-2">
        <div className="relative w-full bg-white rounded-xl p-3 shadow-[0_4px_20px_rgba(0,0,0,0.06)] border border-gray-100 overflow-hidden flex items-center min-h-[100px]">
           {/* Background Green Waves (SVG) */}
           <div className="absolute top-0 right-0 w-[150%] h-[150%] opacity-20 pointer-events-none -translate-y-4 translate-x-12">
             <svg width="100%" height="100%" viewBox="0 0 200 100" preserveAspectRatio="none">
               <path d="M0,20 C50,15 80,10 120,30 C160,50 170,20 200,40" stroke="#00A14F" strokeWidth="1.5" fill="none" />
               <path d="M0,25 C50,20 80,15 120,35 C160,55 170,25 200,45" stroke="#00A14F" strokeWidth="1.5" fill="none" />
               <path d="M0,30 C50,25 80,20 120,40 C160,60 170,30 200,50" stroke="#00A14F" strokeWidth="1.5" fill="none" />
               <path d="M0,35 C50,30 80,25 120,45 C160,65 170,35 200,55" stroke="#00A14F" strokeWidth="1.5" fill="none" />
             </svg>
           </div>
           
           {/* Signboard Content */}
           <div className="relative z-10 flex flex-col items-start bg-white rounded-lg px-2 py-2 transform -rotate-[2deg] shadow-sm border border-gray-50/80 w-[75%] ml-1">
              <h3 className="text-[#005526] font-black tracking-widest text-[9.5px] uppercase mb-1 ml-1">Offline Menu Price Match</h3>
              <div className="flex items-center gap-2">
                 <span className="text-[#FF007F] font-black text-[42px] leading-none tracking-tighter drop-shadow-sm -mt-2">₹0</span>
                 <div className="flex flex-col justify-center h-full pt-1">
                    <span className="text-[#FF007F] font-black text-[13px] leading-tight">Platform Fee</span>
                    <span className="text-[#FF007F] font-black text-[13px] leading-tight">Packaging Fee</span>
                 </div>
              </div>
           </div>

           {/* 3D Mascot Placeholder (Using an emoji/text or image if provided) */}
           <div className="absolute right-[-15px] top-1/2 -translate-y-1/2 w-[110px] h-[110px] z-20 flex items-center justify-center drop-shadow-xl bg-transparent">
              <div className="w-[80px] h-[80px] bg-green-100 rounded-full flex items-center justify-center border-4 border-white shadow-md text-[#005526] text-[10.5px] font-black tracking-tight text-center leading-[1.1] uppercase">
                 Lowest<br/>Price<br/>Guarantee
              </div>
           </div>
        </div>
      </div>

      {/* 7. Explore all restaurants section */}
      <div className="w-full mt-2 bg-white pt-2 pb-12">
        {/* Filter Pills */}
        <div className="flex overflow-x-auto hide-scrollbar gap-2 mb-5 snap-x px-4 scroll-pl-4">
           {/* Sliders Icon Pill */}
           <button className="flex items-center justify-center border border-gray-200 rounded-full w-[34px] h-[34px] shrink-0 snap-start bg-white shadow-sm">
             <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4B5563" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
               <circle cx="16" cy="9" r="2.5"></circle>
               <line x1="5" y1="9" x2="13.5" y2="9"></line>
               <circle cx="8" cy="15" r="2.5"></circle>
               <line x1="10.5" y1="15" x2="19" y2="15"></line>
             </svg>
           </button>

           {/* 10-60% lower prices Pill */}
           <button className="flex items-center gap-1.5 border border-gray-200 rounded-full px-3 h-[34px] shrink-0 snap-start bg-white">
             <div className="flex -space-x-1.5">
               <div className="w-[18px] h-[18px] rounded-full flex items-center justify-center border-[1.5px] border-[#FF007F] bg-white z-10">
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="#FF007F" className="text-[#FF007F] mt-[1px]"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
               </div>
               <div className="w-[18px] h-[18px] rounded-full flex items-center justify-center border-[1.5px] border-[#FF007F] bg-white z-0">
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="#FF007F" className="text-[#FF007F] mt-[1px]"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
               </div>
             </div>
             <span className="text-[13px] font-medium text-gray-700 tracking-tight">10-60% lower prices</span>
           </button>

           {/* Veg/Non-Veg Pill */}
           <button className="flex items-center gap-1.5 border border-gray-200 rounded-full px-3 h-[34px] shrink-0 snap-start bg-white">
             <span className="text-[13px] font-medium text-gray-700 tracking-tight">Veg/Non-Veg</span>
             <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4B5563" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mt-[1px]"><polyline points="6 9 12 15 18 9"></polyline></svg>
           </button>

           {/* ₹99 & under Pill */}
           <button className="flex items-center justify-center border border-gray-200 rounded-full px-3 h-[34px] shrink-0 snap-start bg-white">
             <span className="text-[13px] font-medium text-gray-700 tracking-tight">₹99 & under</span>
           </button>

           {/* delivery under 30 mins Pill */}
           <button className="flex items-center justify-center border border-gray-200 rounded-full px-3 h-[34px] shrink-0 snap-start bg-white">
             <span className="text-[13px] font-medium text-gray-700 tracking-tight">delivery under 30 mins</span>
           </button>
        </div>

        <div className="px-4 mb-4">
          <h2 className="text-[20px] font-black text-gray-900 tracking-tight">Explore all restaurants</h2>
        </div>

        {/* Restaurant Cards List */}
        <div className="flex flex-col gap-5">
          {stalls.map((restaurant, idx) => (
            <RestaurantCard key={idx} data={restaurant} />
          ))}
        </div>
      </div>

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
              {/* Close Button */}
              <button 
                onClick={() => setIsVegModalOpen(false)}
                className="absolute top-4 right-4 p-1 text-gray-400 hover:bg-gray-100 rounded-full transition-colors z-20"
              >
                <X size={20} strokeWidth={2.5} />
              </button>

              {/* Image positioned right next to close button */}
              <div className="absolute top-5 right-12 w-20 h-20 shrink-0 flex items-center justify-center pointer-events-none">
                <Image src="/categories/all.png" alt="Food" fill className="object-contain scale-[1.25]" />
              </div>

              {/* Title */}
              <div className="flex items-start justify-between mb-8 pr-16 mt-2">
                <h2 className="text-[20px] font-black text-gray-800 leading-[1.1] max-w-[180px]">
                  I want to see veg choices from
                </h2>
              </div>

              {/* Radio Options */}
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

              {/* Divider */}
              <div className="border-t border-dashed border-gray-200 mb-5"></div>

              {/* Checkbox */}
              <label className="flex items-center justify-between cursor-pointer mb-6 group">
                <span className="text-[13px] font-medium text-gray-500">Remember my choice going forward</span>
                <div className={`w-[18px] h-[18px] rounded-[4px] border-2 flex items-center justify-center transition-colors ${rememberVegChoice ? 'border-green-600 bg-green-600' : 'border-gray-200 group-hover:border-gray-300'}`}>
                  {rememberVegChoice && <Check size={12} strokeWidth={3} className="text-white" />}
                </div>
                <input type="checkbox" className="hidden" checked={rememberVegChoice} onChange={(e) => setRememberVegChoice(e.target.checked)} />
              </label>

              {/* Submit Button */}
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

function RestaurantCard({ data }: { data: any }) {
  const { updateQuantity, cart } = useCart();
  const [items, setItems] = useState<any[]>(data.items || []);

  useEffect(() => {
    if (!data.items) {
      api.get(`/stalls/${data.id}/menu`).then(res => {
        if (Array.isArray(res.data)) {
          const menuItems = res.data.slice(0, 3).map((item: any) => ({
            id: item.id.toString(),
            name: item.name,
            image: item.image_url || "/categories/burger.png",
            newPrice: "₹" + Math.round(item.price),
            originalPrice: "₹" + Math.round(item.price * 1.2),
            isPopular: true,
            lowerPriceApp: true,
            lowerPriceText: "Our app: 20% lower",
          }));
          setItems(menuItems);
        }
      }).catch(err => console.error("Error fetching menu:", err));
    }
  }, [data.id, data.items]);

  return (
    <div className="px-4">
      <div className="w-full bg-white border border-gray-200 rounded-[20px] p-4 shadow-sm relative overflow-hidden">
         
         
         
         {/* Card Header Info */}
         <Link href={`/stall?id=${data.id}`} className="relative z-10 flex flex-col items-start gap-0.5 mb-4 block cursor-pointer">
            <div className="flex items-center gap-2 mt-1">
               {data.isAd && (
                 <div className="bg-gray-100 text-gray-500 text-[10px] font-bold px-1.5 py-[2px] rounded flex items-center leading-none">Ad</div>
               )}
               <h3 className="text-gray-900 font-black text-[22px] tracking-tight leading-none mt-0.5">{data.name}</h3>
            </div>
            
            <div className="flex items-center gap-1.5 text-gray-700 mt-2">
               <div className="bg-[#00A14F] text-white rounded-full p-[2.5px] shadow-sm">
                  <Star size={9} className="fill-white" />
               </div>
               <span className="text-[13px] font-bold">{data.rating} <span className="font-medium text-gray-500">• {data.deliveryTime} • {data.categories}</span></span>
            </div>
            
            <div className="flex items-center gap-1.5 text-gray-600 mt-1">
               <div className="bg-[#00A14F] text-white text-[9px] font-black rounded-sm px-[3px] py-[1px] leading-none">%</div>
               <span className="text-[13px] font-medium">{data.deliveryInfo}</span>
            </div>
         </Link>

         {/* Horizontal Scroll Food Items */}
         {items.length > 0 && (
         <div className="flex overflow-x-auto hide-scrollbar gap-3 pb-1 pt-1 snap-x w-full">
            {items.map((item: any, idx: number) => {
              const parsedPrice = Number((item.newPrice || "0").replace(/[^0-9]/g, ''));
              const isAdded = cart.stallId === data.id && cart.items.find(i => i.id === item.id || i.id === idx.toString());
              const quantity = isAdded ? isAdded.quantity : 0;
              
              return (
              <div key={idx} className="flex flex-col shrink-0 w-[140px] snap-start">
                 <div className="relative w-full h-[120px] rounded-[16px] overflow-hidden mb-2 shadow-sm border border-gray-100">
                   <Image src={item.image} alt={item.name} fill className="object-cover" />
                   <div className="absolute top-0 w-full h-[40%] bg-gradient-to-b from-black/40 to-transparent"></div>
                   {item.isPopular && (
                     <div className="absolute top-2 left-2 bg-white px-2 py-0.5 rounded-full shadow-sm">
                       <span className="text-[#00A14F] font-bold text-[10px]">Popular</span>
                     </div>
                   )}
                   {quantity > 0 ? (
                      <div className="absolute bottom-2 right-2 h-7 bg-white rounded-lg flex items-center justify-between shadow-md border border-gray-100 px-1 overflow-hidden z-20">
                        <button 
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); updateQuantity(data.id, data.name, { id: item.id || idx.toString(), name: item.name, price: parsedPrice, image_url: item.image }, -1); }}
                          className="w-6 h-full flex justify-center items-center text-gray-600 active:bg-gray-100"
                        ><Minus size={14} /></button>
                        <span className="text-[12px] font-bold text-gray-800 w-4 text-center">{quantity}</span>
                        <button 
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); updateQuantity(data.id, data.name, { id: item.id || idx.toString(), name: item.name, price: parsedPrice, image_url: item.image }, 1); }}
                          className="w-6 h-full flex justify-center items-center text-[#FF007F] active:bg-gray-100"
                        ><Plus size={14} /></button>
                      </div>
                   ) : (
                     <button 
                       onClick={(e) => { 
                         e.preventDefault(); 
                         e.stopPropagation(); 
                         updateQuantity(data.id, data.name, { id: item.id || idx.toString(), name: item.name, price: parsedPrice, image_url: item.image }, 1); 
                       }}
                       className="absolute bottom-2 right-2 w-[28px] h-[28px] bg-white rounded-full border border-pink-100 shadow-md flex items-center justify-center z-10"
                     >
                        <span className="text-[#FF007F] text-[20px] leading-none mb-[2px] font-medium">+</span>
                     </button>
                   )}
                 </div>
                 <div className="flex flex-col gap-1">
                    <div className="flex items-start gap-1">
                       <div className="mt-[3px] shrink-0 w-[11px] h-[11px] border border-[#00A14F] flex items-center justify-center rounded-[2px]">
                          <div className="w-1.5 h-1.5 bg-[#00A14F] rounded-full"></div>
                       </div>
                       <h4 className="text-[13px] font-bold text-gray-900 leading-tight">{item.name}</h4>
                    </div>
                    <div className="flex flex-col pl-[15px] mt-0.5 gap-1">
                       {item.originalPrice ? (
                         <div className="flex items-center gap-1.5">
                            <span className="text-[12px] font-medium text-gray-400 line-through">{item.originalPrice}</span>
                            <span className="text-[11px] font-black text-[#FF007F] bg-[#FFF0F5] px-1.5 py-0.5 rounded-md">{item.newPrice}</span>
                         </div>
                       ) : (
                         <span className="text-[13px] font-bold text-gray-800">{item.newPrice}</span>
                       )}
                       
                       {item.lowerPriceText && (
                         <div className="flex items-center gap-1">
                            <div className="flex -space-x-[3px]">
                               <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ${item.lowerPriceApp ? 'text-[#FF007F]' : 'text-gray-400'}`}>
                                  <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                               </div>
                               <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ${item.lowerPriceApp ? 'text-[#FF007F]' : 'text-gray-400'}`}>
                                  <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                               </div>
                            </div>
                            <span className={`font-bold text-[10px] tracking-tight ml-0.5 ${item.lowerPriceApp ? 'text-[#FF007F]' : 'text-gray-500'}`}>{item.lowerPriceText}</span>
                         </div>
                       )}
                    </div>
                 </div>
              </div>
            )})}
         </div>
         )}

      </div>
    </div>
  );
}

function ChevronRight({ size, className, strokeWidth = 2 }: { size: number, className?: string, strokeWidth?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="m9 18 6-6-6-6"/>
    </svg>
  );
}

