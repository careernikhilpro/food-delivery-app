"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, MoreVertical, Users, MapPin, CreditCard, RefreshCcw, Edit2, Settings, LogOut, Clock, Star, CheckCircle2, XCircle, Loader2, ChevronRight, RefreshCw, Route, ThumbsUp, Lock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import useSWR from "swr";
import { OrderCardShimmer } from "@/components/Shimmer";
import { useAuth } from "@/hooks/useAuth";
import { io } from "socket.io-client";
import { api } from "@/lib/api";
import { useCart } from "@/context/CartContext";

const getRestaurantImage = (stallName: string) => {
  const name = stallName.toLowerCase();
  if (name.includes('pizza')) return '/categories/pizza.jpg';
  if (name.includes('biryani')) return '/categories/biryani.png';
  if (name.includes('burger')) return '/categories/burger.jpg';
  if (name.includes('cake') || name.includes('sweet')) return '/categories/cake.jpg';
  if (name.includes('dosa') || name.includes('south')) return '/categories/south_indian.jpg';
  if (name.includes('chinese')) return '/categories/chinese.jpg';
  return '/categories/north_indian.jpg'; // fallback
};

interface RatingState {
  score: number;
  timestamp: number | null;
}

interface OrderRating {
  app: RatingState;
  restaurant: RatingState;
  rider: RatingState;
}

export default function ProfilePage() {
  useAuth();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { clearCart, updateQuantity } = useCart();

  const handleLogout = () => {
    localStorage.removeItem("swaddo_customer_token");
    router.push("/login");
  };

  const fetcher = (url: string) => api.get(url).then(res => res.data);
  const { data: ordersRes, isLoading, mutate: mutateOrders } = useSWR('/orders', fetcher, { revalidateOnFocus: false, dedupingInterval: 60000, keepPreviousData: true });
  const rawOrders = ordersRes?.data || [];
  
  const orders = useMemo(() => {
    if (!Array.isArray(rawOrders)) return [];
    return rawOrders.map((o) => {
      const itemsArray = (o.items || "1x Order Item").split(',').map((i: any) => {
        const parts = i.trim().split('x ');
        return { qty: parseInt(parts[0]) || 1, name: parts[1] || parts[0] };
      });

      return {
        id: o.id,
        stall: o.stall_name || o.stall || "Stall",
        date: `${o.date}, ${o.time}`,
        items: itemsArray,
        summary: o.items_summary || o.items || "Order Items",
        total: o.total,
        status: o.status,
        location: o.stall_location || "Gondia City, Maharashtra",
        ratingData: {
          app: { score: 0, timestamp: null },
          restaurant: { score: 0, timestamp: null },
          rider: { score: 0, timestamp: null }
        }
      };
    });
  }, [rawOrders]);

  // Rating Modal States
  const [orderToRate, setOrderToRate] = useState<any | null>(null);
  const [currentRatings, setCurrentRatings] = useState<OrderRating>({
    app: { score: 0, timestamp: null },
    restaurant: { score: 0, timestamp: null },
    rider: { score: 0, timestamp: null }
  });

  const activeOrders = useMemo(() => orders.filter(o => !['delivered', 'cancelled', 'declined'].includes(o.status)), [orders]);
  const pastOrders = useMemo(() => orders.filter(o => ['delivered', 'cancelled', 'declined'].includes(o.status)), [orders]);

  useEffect(() => {
    if (!orders.length) return;
    
    let socketUrl = process.env.NEXT_PUBLIC_WS_URL; if (!socketUrl && process.env.NEXT_PUBLIC_API_URL) socketUrl = process.env.NEXT_PUBLIC_API_URL.replace(/\/api\/?$/, ""); 
    const socket = io(socketUrl || "http://localhost:5005", { transports: ["websocket", "polling"], reconnection: true });
    
    activeOrders.forEach((o) => {
      socket.on(`order:${o.id}`, (update) => {
        mutateOrders((current: any) => {
          if (!current) return current;
          let currentData = current.data || current;
          if (!Array.isArray(currentData)) return current;
          
          const newOrders = currentData.map(co => (co.id === update.id || co.id?.toString() === update.id) ? { ...co, status: update.status } : co);
          return { ...current, data: newOrders };
        }, false);
      });
    });
    
    return () => { socket.disconnect(); };
  }, [orders, mutateOrders, activeOrders]);

  const handleReorder = (order: any) => {
    clearCart();
    order.items.forEach((item: any) => {
      updateQuantity(order.id.toString(), order.stall, {
        id: `item-${item.name.replace(/\s+/g, '-').toLowerCase()}`,
        name: item.name,
        price: 150 
      }, item.qty);
    });
    alert('Items added to cart!');
    router.push('/cart');
  };

  const openRatingModal = (order: any) => {
    setOrderToRate(order);
    setCurrentRatings(JSON.parse(JSON.stringify(order.ratingData))); 
  };

  const isLocked = (timestamp: number | null) => {
    if (!timestamp) return false;
    return (Date.now() - timestamp) > 10 * 60 * 1000; 
  };

  const handleStarClick = (category: keyof OrderRating, score: number) => {
    if (isLocked(currentRatings[category].timestamp)) return;
    setCurrentRatings(prev => ({
      ...prev,
      [category]: { ...prev[category], score }
    }));
  };

  const submitRatings = () => {
    if (!orderToRate) return;
    const updatedRatings = { ...currentRatings };
    const now = Date.now();

    if (updatedRatings.app.score > 0 && !updatedRatings.app.timestamp) updatedRatings.app.timestamp = now;
    if (updatedRatings.restaurant.score > 0 && !updatedRatings.restaurant.timestamp) updatedRatings.restaurant.timestamp = now;
    if (updatedRatings.rider.score > 0 && !updatedRatings.rider.timestamp) updatedRatings.rider.timestamp = now;

    mutateOrders((current: any) => { if(!current) return current; const d = current.data || current; return {...current, data: d.map((o:any) => o.id === orderToRate.id ? { ...o, ratingData: updatedRatings } : o)}; }, false);
    setOrderToRate(null);
    alert('Ratings submitted successfully!');
  };

  const isFullyRated = (ratingData: OrderRating) => {
    return ratingData.app.score > 0 && ratingData.restaurant.score > 0 && ratingData.rider.score > 0;
  };

  return (
    <div className="h-[100dvh] overflow-hidden bg-gray-50 flex flex-col font-sans relative">
      
      {/* Header Section with Orange Background */}
      <div className="bg-[#FF5722] rounded-b-[30px] pt-2 pb-6 px-4 text-white relative shadow-sm z-10 flex-shrink-0">
        
        {/* Top Navbar */}
        <div className="flex justify-between items-center mb-3">
          <button onClick={() => router.back()} className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors">
            <ArrowLeft size={24} />
          </button>
          
          <div className="flex items-center gap-2">
            <button className="bg-white text-gray-900 px-4 py-1.5 rounded-full text-[14px] font-bold shadow-sm hover:bg-gray-50 transition-colors">
              Help
            </button>
            <div className="relative">
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)} 
                className="p-2 -mr-2 rounded-full hover:bg-white/10 transition-colors relative z-50"
              >
                <MoreVertical size={24} />
              </button>

              {/* 3-Dots Dropdown Menu */}
              <AnimatePresence>
                {isMenuOpen && (
                  <>
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="fixed inset-0 z-40" 
                      onClick={() => setIsMenuOpen(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -10 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-12 w-48 bg-white rounded-xl shadow-lg border border-gray-100 z-50 overflow-hidden"
                    >
                      <button className="w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-50 text-[14px] font-medium flex items-center gap-3 transition-colors border-b border-gray-100">
                        <Edit2 size={16} className="text-gray-400" />
                        Edit profile
                      </button>
                      <button className="w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-50 text-[14px] font-medium flex items-center gap-3 transition-colors border-b border-gray-100">
                        <Settings size={16} className="text-gray-400" />
                        Settings
                      </button>
                      <button onClick={handleLogout} className="w-full text-left px-4 py-3 text-red-500 hover:bg-red-50 text-[14px] font-medium flex items-center gap-3 transition-colors">
                        <LogOut size={16} className="text-red-400" />
                        Log out
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* User Info */}
        <div className="px-2">
          <h1 className="text-2xl font-black mb-1">Yatharth Sinha</h1>
          <p className="text-[13px] text-white/90 font-medium tracking-wide mb-1">+91 - 9082998752</p>
          <p className="text-[13px] text-white/90 font-medium tracking-wide">nikhil.kumar709198@gmail.com</p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="px-4 mt-4 relative z-10 space-y-4 flex-shrink-0">
        
        {/* Offline Menu Price Match Banner */}
        <div className="relative rounded-[16px] shadow-sm border border-gray-100 flex items-center p-2 h-[90px]" style={{ background: 'linear-gradient(to right, #f8fdf9, #eef9f2)' }}>
          {/* Faint green background lines (wrapped to clip) */}
          <div className="absolute inset-0 overflow-hidden rounded-[16px] pointer-events-none z-0">
            <div className="absolute inset-0 opacity-[0.15]" style={{
              backgroundImage: `repeating-linear-gradient(-10deg, transparent, transparent 12px, #22c55e 12px, #22c55e 13px)`
            }}></div>
          </div>
          
          {/* White Inset Card */}
          <div className="relative z-10 flex-1 bg-white rounded-[12px] h-full flex flex-col justify-center px-4 shadow-[0_2px_10px_rgba(0,0,0,0.03)] border border-gray-50 mr-12">
             <span className="text-[9px] font-black text-[#1B5E20] tracking-wider mb-1">OFFLINE MENU PRICE MATCH</span>
             <div className="flex items-center gap-2">
               <span className="text-[34px] font-black text-[#FF007F] leading-none tracking-tighter">₹0</span>
               <div className="flex flex-col text-[12px] font-black text-[#FF007F] leading-[1.15] tracking-tight mt-1">
                 <span>Platform Fee</span>
                 <span>Packaging Fee</span>
               </div>
             </div>
          </div>

          {/* Guarantee Circle Overlapping */}
          <div className="absolute -right-2 z-20 w-[74px] h-[74px] rounded-full bg-[#E8F5E9] flex flex-col items-center justify-center shadow-md border-[3px] border-white text-center">
             <span className="text-[9.5px] font-black text-[#004D40] leading-[1.1]">LOWEST</span>
             <span className="text-[9.5px] font-black text-[#004D40] leading-[1.1]">PRICE</span>
             <span className="text-[9.5px] font-black text-[#004D40] leading-[1.1]">GUARANTEE</span>
          </div>
        </div>

        {/* Quick Links Grid */}
        <div className="grid grid-cols-3 gap-3">
          <button className="bg-white p-3.5 pb-4 rounded-[20px] flex flex-col items-start gap-4 border border-gray-200 hover:bg-gray-50 transition-colors">
            <MapPin size={22} strokeWidth={1.5} className="text-gray-800" />
            <span className="text-[13px] font-medium text-gray-500 leading-tight text-left">Saved<br/>Address</span>
          </button>
          <button className="bg-white p-3.5 pb-4 rounded-[20px] flex flex-col items-start gap-4 border border-gray-200 hover:bg-gray-50 transition-colors">
            <CreditCard size={22} strokeWidth={1.5} className="text-gray-800" />
            <span className="text-[13px] font-medium text-gray-500 leading-tight text-left">Payment<br/>Modes</span>
          </button>
          <button className="bg-white p-3.5 pb-4 rounded-[20px] flex flex-col items-start gap-4 border border-gray-200 hover:bg-gray-50 transition-colors">
            <RefreshCcw size={22} strokeWidth={1.5} className="text-gray-800" />
            <span className="text-[13px] font-medium text-gray-500 leading-tight text-left">My<br/>Refunds</span>
          </button>
        </div>
        
      </div>

      {/* Orders Scrollable Area */}
      <div className="px-4 mt-6 flex-1 overflow-y-auto pb-8 app-scroll-container">
        <h2 className="text-[12px] font-black text-gray-800 uppercase tracking-widest mb-4 px-2">YOUR ORDERS</h2>
        
        {isLoading ? (
          <div className="space-y-4 px-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <OrderCardShimmer key={i} />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-start mt-2">
            {/* Empty State Illustration */}
            <div className="relative w-72 h-60 -mb-12 opacity-90">
               <Image 
                 src="/profile page picture.png" 
                 alt="No orders yet" 
                 fill 
                 className="object-contain"
               />
            </div>
            
            <h3 className="text-[18px] font-black text-gray-900 mb-0.5">You haven't ordered yet</h3>
            <p className="text-[13px] text-gray-500 text-center font-medium mb-4 px-4 leading-relaxed">
              Get started for great taste and greater savings on Swaddo!
            </p>
            
            <button onClick={() => router.push('/')} className="bg-[#FF5722] text-white font-bold text-[15px] px-8 py-3 rounded-full shadow-md hover:bg-[#E64A19] transition-colors">
              Explore Swaddo
            </button>
            
            {/* Version Text right under the button */}
            <p className="text-gray-400 text-[11px] font-medium mt-3">App version 1.0.0</p>
          </div>
        ) : (
          <div className="space-y-5 px-2">
            {activeOrders.length > 0 && (
              <div className="mb-6">
                <h3 className="text-[10px] font-bold text-green-600 mb-3 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                  Active
                </h3>
                <div className="space-y-6">
                  {activeOrders.map(order => (
                    <div key={order.id} className="bg-white rounded-[24px] shadow-[0_8px_30px_rgb(34,197,94,0.12)] hover:shadow-[0_8px_30px_rgb(34,197,94,0.2)] border border-green-100/60 overflow-hidden transition-all duration-300 relative group">
                      <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-green-400 to-green-600 shadow-[0_0_15px_rgba(34,197,94,0.5)]"></div>
                      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-green-50/50 to-transparent rounded-bl-full pointer-events-none z-0"></div>
                      
                      <div className="p-5 pl-6 flex gap-4 relative z-10">
                        <div className="w-[64px] h-[64px] rounded-[18px] overflow-hidden bg-gray-50 shrink-0 border border-green-100/50 shadow-[0_4px_10px_rgb(0,0,0,0.03)] relative">
                          <Image src={getRestaurantImage(order.stall)} alt={order.stall} fill className="object-cover" />
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                          <div className="flex justify-between items-start gap-2">
                            <div className="flex flex-col">
                              <h3 className="font-heading font-black text-gray-900 text-[16px] leading-tight truncate tracking-tight">{order.stall}</h3>
                              <p className="text-[12px] text-gray-400 font-medium mt-1 truncate">{order.location}</p>
                            </div>
                            <span className="font-heading font-black text-[15px] text-gray-900">₹{order.total}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="px-5 pl-6 py-3.5 bg-gradient-to-r from-green-50/30 to-transparent text-[13px] border-y border-dashed border-gray-100">
                         <div className="space-y-2">
                            {order.items.map((item: any, idx: number) => (
                               <div key={idx} className="flex items-center gap-2.5">
                                  <span className="bg-white border border-gray-200 text-gray-500 shadow-sm font-bold shrink-0 px-2 py-0.5 rounded-md text-[11px]">{item.qty}</span>
                                  <span className="text-gray-700 font-semibold">{item.name}</span>
                               </div>
                            ))}
                         </div>
                      </div>
                      
                      <div className="px-5 pl-6 py-4 flex items-center justify-between bg-white relative z-10">
                        <div className="flex items-center gap-2 text-orange-600 bg-orange-50/80 px-2.5 py-1.5 rounded-lg border border-orange-100/50">
                          <Clock size={14} className="animate-spin-slow" />
                          <span className="text-[10px] font-black uppercase tracking-wider">{order.status.replace(/_/g, ' ')}</span>
                        </div>
                        <Link href={`/track?id=${order.id}`} className="flex items-center gap-1.5 bg-[#FF5722] hover:bg-[#E64A19] shadow-md shadow-[#FF5722]/20 hover:shadow-lg text-white font-black py-2 px-4 rounded-[12px] transition-all duration-300 text-[12px] active:scale-95 tracking-wide">
                          <Route size={14} strokeWidth={2.5} /> Track Order
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {pastOrders.length > 0 && (
              <div>
                <h3 className="text-[10px] font-bold text-gray-400 mb-3 uppercase tracking-wider">
                  Past
                </h3>
                <div className="space-y-6">
                  {pastOrders.map(order => (
                    <div key={order.id} className="bg-white rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-gray-100/60 overflow-hidden transition-all duration-300 relative group">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-gray-50/50 to-transparent rounded-bl-full pointer-events-none z-0"></div>
                      
                      <div className="p-5 flex gap-4 relative z-10">
                        <div className="w-[64px] h-[64px] rounded-[18px] overflow-hidden bg-gray-50 shrink-0 border border-gray-100 shadow-[0_4px_10px_rgb(0,0,0,0.03)] relative opacity-85 group-hover:opacity-100 transition-opacity">
                          <Image src={getRestaurantImage(order.stall)} alt={order.stall} fill className="object-cover grayscale-[15%] group-hover:grayscale-0 transition-all duration-500" />
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                          <div className="flex justify-between items-start gap-2">
                            <div className="flex flex-col">
                              <h3 className="font-heading font-black text-gray-900 text-[16px] leading-tight truncate tracking-tight">{order.stall}</h3>
                              <p className="text-[12px] text-gray-400 font-medium mt-1 truncate">{order.location}</p>
                            </div>
                            <span className="font-heading font-black text-[15px] text-gray-900">₹{order.total}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="px-5 py-3.5 bg-gradient-to-r from-gray-50/80 to-transparent text-[13px] border-y border-dashed border-gray-100">
                         <div className="space-y-2">
                            {order.items.map((item: any, idx: number) => (
                               <div key={idx} className="flex items-center gap-2.5">
                                  <span className="bg-white border border-gray-200 text-gray-500 shadow-sm font-bold shrink-0 px-2 py-0.5 rounded-md text-[11px]">{item.qty}</span>
                                  <span className="text-gray-700 font-semibold">{item.name}</span>
                               </div>
                            ))}
                         </div>
                         <div className="mt-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            {order.date}
                         </div>
                      </div>
                      
                      <div className="px-5 py-4 flex items-center justify-between bg-white relative z-10">
                        <div className="flex items-center gap-1.5">
                          {order.status === "delivered" ? (
                            <div className="flex items-center gap-1.5 text-green-600 bg-green-50/80 px-2.5 py-1.5 rounded-lg border border-green-100/50">
                              <CheckCircle2 size={14} />
                              <span className="text-[10px] font-black uppercase tracking-wider">Delivered</span>
                            </div>
                          ) : order.status === "cancelled" ? (
                            <div className="flex items-center gap-1.5 text-red-500 bg-red-50/80 px-2.5 py-1.5 rounded-lg border border-red-100/50">
                              <XCircle size={14} />
                              <span className="text-[10px] font-black uppercase tracking-wider">Cancelled</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 text-gray-500 bg-gray-50 px-2.5 py-1.5 rounded-lg border border-gray-200/50">
                              <Clock size={14} />
                              <span className="text-[10px] font-black uppercase tracking-wider">{order.status.replace(/_/g, ' ')}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          {order.status === "delivered" ? (
                            <>
                              <button 
                                onClick={() => openRatingModal(order)} 
                                className={`flex items-center gap-1.5 font-bold py-2 px-3.5 rounded-[12px] transition-all duration-300 text-[12px] active:scale-95 ${isFullyRated(order.ratingData) ? 'bg-green-50 text-green-600 border border-green-200/50' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 shadow-sm'}`}
                              >
                                {isFullyRated(order.ratingData) ? <CheckCircle2 size={14} /> : <ThumbsUp size={14} className="text-gray-400" />} 
                                {isFullyRated(order.ratingData) ? 'Rated' : 'Rate'}
                              </button>
                              <button onClick={() => handleReorder(order)} className="flex items-center gap-1.5 bg-[#FF5722] hover:bg-[#E64A19] shadow-md shadow-[#FF5722]/20 hover:shadow-lg text-white font-black py-2 px-4 rounded-[12px] transition-all duration-300 text-[12px] active:scale-95 tracking-wide">
                                <RefreshCw size={14} strokeWidth={2.5} /> Reorder
                              </button>
                            </>
                          ) : (
                            <button onClick={() => handleReorder(order)} className="flex items-center gap-1.5 bg-[#FF5722] hover:bg-[#E64A19] shadow-md shadow-[#FF5722]/20 hover:shadow-lg text-white font-black py-2 px-4 rounded-[12px] transition-all duration-300 text-[12px] active:scale-95 tracking-wide">
                              <RefreshCw size={14} strokeWidth={2.5} /> Reorder
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Advanced Rating Modal */}
      {orderToRate && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-[32px] p-6 w-full max-w-md shadow-2xl my-8">
            <h3 className="text-xl font-heading font-black text-gray-900 mb-2 text-center">Rate Your Experience</h3>
            <div className="bg-gray-50 rounded-2xl p-4 mb-6 border border-gray-100">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">You ordered from {orderToRate.stall}</p>
              <div className="space-y-1 max-h-24 overflow-y-auto">
                {orderToRate.items.map((item: any, idx: number) => (
                   <p key={idx} className="text-sm font-medium text-gray-800">{item.qty}x {item.name}</p>
                ))}
              </div>
            </div>

            <div className="space-y-5">
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-gray-800">Restaurant & Food</span>
                  {isLocked(currentRatings.restaurant.timestamp) && <span className="text-[10px] text-red-500 font-bold flex items-center gap-1"><Lock size={10}/> Locked</span>}
                </div>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button key={star} onClick={() => handleStarClick('restaurant', star)} disabled={isLocked(currentRatings.restaurant.timestamp)} className={`p-1 transition-transform ${isLocked(currentRatings.restaurant.timestamp) ? 'cursor-not-allowed opacity-80' : 'hover:scale-110 active:scale-95'}`}>
                      <Star size={32} className={`${star <= currentRatings.restaurant.score ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'} transition-colors`} />
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-gray-800">Delivery Partner</span>
                  {isLocked(currentRatings.rider.timestamp) && <span className="text-[10px] text-red-500 font-bold flex items-center gap-1"><Lock size={10}/> Locked</span>}
                </div>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button key={star} onClick={() => handleStarClick('rider', star)} disabled={isLocked(currentRatings.rider.timestamp)} className={`p-1 transition-transform ${isLocked(currentRatings.rider.timestamp) ? 'cursor-not-allowed opacity-80' : 'hover:scale-110 active:scale-95'}`}>
                      <Star size={32} className={`${star <= currentRatings.rider.score ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'} transition-colors`} />
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-gray-800">SwaDDo App Experience</span>
                  {isLocked(currentRatings.app.timestamp) && <span className="text-[10px] text-red-500 font-bold flex items-center gap-1"><Lock size={10}/> Locked</span>}
                </div>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button key={star} onClick={() => handleStarClick('app', star)} disabled={isLocked(currentRatings.app.timestamp)} className={`p-1 transition-transform ${isLocked(currentRatings.app.timestamp) ? 'cursor-not-allowed opacity-80' : 'hover:scale-110 active:scale-95'}`}>
                      <Star size={32} className={`${star <= currentRatings.app.score ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'} transition-colors`} />
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            <p className="text-[11px] text-center text-gray-400 mt-6 leading-relaxed bg-gray-50 p-2 rounded-lg">
              Ratings are permanently locked 10 minutes after being submitted. You can rate categories independently.
            </p>
            
            <div className="flex gap-3 mt-6">
              <button onClick={() => setOrderToRate(null)} className="flex-1 py-3.5 rounded-xl text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors">
                Cancel
              </button>
              <button onClick={submitRatings} className="flex-1 py-3.5 rounded-xl text-sm font-bold text-white bg-primary hover:bg-primary-hover shadow-lg shadow-primary/30 transition-all active:scale-95">
                Submit Ratings
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
