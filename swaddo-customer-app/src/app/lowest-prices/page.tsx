"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Star, Plus, Minus } from "lucide-react";
import { useState, useEffect } from "react";
import { useCart } from "@/context/CartContext";

const CATEGORIES = [
  { id: "all", name: "ALL", image: "/categories/burger.png", bgColor: "bg-[#fce5d8]" },
  { id: "biryani", name: "BIRYANI", image: "/categories/biryani.png", bgColor: "bg-white" },
  { id: "pizza", name: "PIZZA", image: "/categories/pizza.png", bgColor: "bg-white" },
  { id: "burger", name: "BURGER", image: "/categories/burger.png", bgColor: "bg-white" },
  { id: "noodles", name: "NOODLES", image: "/categories/Noodles.png", bgColor: "bg-white" },
];

const FILTERS = [
  { id: "discount", label: "25-60% lower prices", icon: "🔥" },
  { id: "under49", label: "₹49 & under" },
  { id: "50to99", label: "₹50 - ₹99" },
  { id: "100to149", label: "₹100 - ₹149" },
];

export default function LowestPricesPage() {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const { updateQuantity, cart } = useCart();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/stalls/lowest-prices`)
      .then(res => res.json())
      .then(data => {
        setItems(data.data || []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const highlightedOffers = items.filter(i => i.is_highlighted_offer);
  const gridItems = items;

  const getFinalPrice = (item: any) => {
    if (item.offer_price) return Number(item.offer_price);
    if (item.discount_percentage) return Number(item.price) * (1 - Number(item.discount_percentage)/100);
    return Number(item.price);
  };

  return (
    <div className="flex flex-col min-h-screen bg-white font-body pb-24">
      {/* Header Section (Full Image Banner) */}
      <div className="relative w-full h-[220px] overflow-hidden rounded-b-[24px]">
        <Image 
          src="/everydaybanner.png" 
          alt="Everyday Lowest Prices" 
          fill 
          quality={100}
          unoptimized
          className="object-cover"
          priority
        />
        
        <Link href="/" className="absolute top-5 left-4 z-20 w-10 h-10 bg-black/20 rounded-full flex items-center justify-center backdrop-blur-sm">
          <ArrowLeft className="text-white" size={22} />
        </Link>
      </div>

      
      {/* Dynamic Top Offers Slider */}
      {highlightedOffers.length > 0 && (
        <div className="w-full overflow-x-auto hide-scrollbar mt-4 mb-2 px-4">
          <div className="flex gap-4 min-w-max">
            {highlightedOffers.map((item) => {
              const finalPrice = getFinalPrice(item);
              const stallIdStr = item.stall_id.toString();
              const itemIdStr = item.id.toString();
              const cartItem = cart.stallId === stallIdStr ? cart.items.find((i: any) => i.id === itemIdStr) : null;

              return (
                <div key={item.id} className="relative w-[320px] rounded-2xl bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200 p-4 shadow-sm overflow-hidden flex justify-between items-center shrink-0">
                  <div className="absolute -top-4 -right-4 w-24 h-24 bg-orange-300 opacity-20 rounded-full blur-2xl"></div>
                  
                  <div className="flex flex-col z-10 w-[60%]">
                    <span className="text-[10px] font-black text-white bg-red-500 px-2 py-0.5 rounded-full w-fit uppercase tracking-wider shadow-sm mb-1">Top Offer</span>
                    <h3 className="text-[18px] font-black text-gray-900 leading-tight">{item.name}</h3>
                    <p className="text-gray-500 text-[11px] font-medium mt-0.5 mb-1.5 line-clamp-1">{item.stall_name}</p>
                    
                    <div className="flex items-center gap-2 mb-3">
                       <span className="text-red-500 font-black text-[18px]">₹{Math.round(finalPrice)}</span>
                       <span className="text-gray-400 font-medium text-[13px] line-through">₹{item.price}</span>
                    </div>
                    
                    <div className="flex items-center">
                      {cartItem ? (
                          <div className="h-8 bg-white rounded-lg flex items-center justify-between shadow-sm border border-red-200 px-1 w-24">
                            <button 
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); updateQuantity(stallIdStr, item.stall_name, { id: itemIdStr, name: item.name, price: finalPrice, markup: 0, isVeg: item.is_veg }, -1); }}
                              className="w-8 h-full flex justify-center items-center text-red-600 font-bold"
                            ><Minus size={16} /></button>
                            <span className="text-[13px] font-bold text-red-700 text-center flex-1">{cartItem.quantity}</span>
                            <button 
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); updateQuantity(stallIdStr, item.stall_name, { id: itemIdStr, name: item.name, price: finalPrice, markup: 0, isVeg: item.is_veg }, 1); }}
                              className="w-8 h-full flex justify-center items-center text-red-600 font-bold"
                            ><Plus size={16} /></button>
                          </div>
                      ) : (
                         <button 
                           onClick={() => updateQuantity(stallIdStr, item.stall_name, { id: itemIdStr, name: item.name, price: finalPrice, markup: 0, isVeg: item.is_veg }, 1)}
                           className="bg-white border border-red-500 text-red-600 font-black text-[13px] px-6 py-1.5 rounded-lg shadow-sm hover:bg-red-50"
                         >
                           + ADD
                         </button>
                      )}
                    </div>
                  </div>
                  
                  <div className="relative w-[110px] h-[110px] z-10 mr-[-10px]">
                    <Image src={item.image_url || "/categories/biryani.png"} alt={item.name} fill className="object-cover rounded-full drop-shadow-md scale-110" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Categories Horizontal Slider */}
      <div className="w-full overflow-x-auto hide-scrollbar pt-6 pb-2 px-4">
        <div className="flex gap-4 min-w-max">
          {CATEGORIES.map((cat) => (
            <button 
              key={cat.id} 
              onClick={() => setActiveCategory(cat.id)}
              className={`flex flex-col items-center justify-center gap-1 min-w-[100px] h-[120px] rounded-[24px] transition-colors ${activeCategory === cat.id ? 'bg-[#fce5d8]' : 'bg-transparent'}`}
            >
              <div className="relative w-[90px] h-[90px]">
                <Image src={cat.image} alt={cat.name} fill className="object-contain drop-shadow-sm scale-125" />
              </div>
              <span className={`text-[12px] font-bold tracking-wide uppercase mt-[-5px] ${activeCategory === cat.id ? 'text-gray-900' : 'text-gray-500'}`}>{cat.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Filters Horizontal Slider */}
      <div className="w-full overflow-x-auto hide-scrollbar pt-2 pb-4 px-4">
        <div className="flex gap-2 min-w-max">
          {FILTERS.map((filter) => (
            <button 
              key={filter.id} 
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-200 bg-white hover:bg-gray-50 text-[13px] font-medium text-gray-700 shadow-sm"
            >
              {filter.icon && <span>{filter.icon}</span>}
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 mt-2">
        <h2 className="font-bold text-[17px] text-gray-900 mb-4">All {gridItems.length} Items</h2>
        
        {loading ? (
          <div className="flex justify-center py-10"><span className="text-gray-500">Loading lowest prices...</span></div>
        ) : gridItems.length === 0 ? (
          <div className="flex justify-center py-10"><span className="text-gray-500">No items found</span></div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {gridItems.map((item) => {
              const finalPrice = getFinalPrice(item);
              const stallIdStr = item.stall_id.toString();
              const itemIdStr = item.id.toString();
              const cartItem = cart.stallId === stallIdStr ? cart.items.find((i: any) => i.id === itemIdStr) : null;
              const hasDiscount = finalPrice < Number(item.price);

              return (
                <div key={item.id} className="flex flex-col">
                  {/* Image Container */}
                  <div className="relative w-full aspect-square rounded-[20px] overflow-hidden bg-gray-100 shadow-sm mb-2">
                    <Image src={item.image_url || "/categories/burger.png"} alt={item.name} fill className="object-cover" />
                    
                    {/* Rating Badge */}
                    {item.stall_rating && (
                      <div className="absolute bottom-2 left-2 bg-white px-1.5 py-0.5 rounded flex items-center gap-1 shadow-sm">
                        <Star size={10} className="text-green-600 fill-green-600" />
                        <span className="text-[10px] font-bold text-green-700">{item.stall_rating}</span>
                      </div>
                    )}
                    
                    {/* Add Button */}
                    {cartItem ? (
                      <div className="absolute bottom-2 right-2 h-7 bg-white rounded-lg flex items-center justify-between shadow-md border border-gray-100 px-1 overflow-hidden min-w-[70px]">
                        <button 
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); updateQuantity(stallIdStr, item.stall_name, { id: itemIdStr, name: item.name, price: finalPrice, markup: 0, isVeg: item.is_veg }, -1); }}
                          className="w-6 h-full flex justify-center items-center text-gray-600 active:bg-gray-100"
                        ><Minus size={14} /></button>
                        <span className="text-[12px] font-bold text-gray-800 text-center flex-1">{cartItem.quantity}</span>
                        <button 
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); updateQuantity(stallIdStr, item.stall_name, { id: itemIdStr, name: item.name, price: finalPrice, markup: 0, isVeg: item.is_veg }, 1); }}
                          className="w-6 h-full flex justify-center items-center text-[#FF007F] active:bg-gray-100"
                        ><Plus size={14} /></button>
                      </div>
                    ) : (
                      <button 
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); updateQuantity(stallIdStr, item.stall_name, { id: itemIdStr, name: item.name, price: finalPrice, markup: 0, isVeg: item.is_veg }, 1); }}
                        className="absolute bottom-2 right-2 w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-md border border-gray-100 active:bg-gray-50"
                      >
                        <Plus size={16} className="text-[#FF007F]" />
                      </button>
                    )}
                  </div>
                  
                  {/* Details */}
                  <div className="flex flex-col flex-1 px-1">
                    <p className="text-[11px] font-medium text-gray-500 mb-0.5 line-clamp-1">{item.stall_name}</p>
                    <h4 className="text-[13px] font-bold text-gray-900 leading-tight mb-1.5 line-clamp-2">
                      <span className={`inline-flex items-center justify-center w-3 h-3 border ${item.is_veg ? 'border-green-600' : 'border-red-600'} rounded-sm mr-1.5 align-middle`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${item.is_veg ? 'bg-green-600' : 'bg-red-600'}`}></span>
                      </span>
                      <span className="align-middle">{item.name}</span>
                    </h4>
                    
                    <div className="flex items-center gap-1.5 mt-auto">
                      {hasDiscount ? (
                        <>
                          <span className="text-[12px] font-medium text-gray-400 line-through">₹{item.price}</span>
                          <span className="text-[14px] font-black text-[#FF007F]">₹{Math.round(finalPrice)}</span>
                        </>
                      ) : (
                        <span className="text-[14px] font-black text-gray-900">₹{Math.round(finalPrice)}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
