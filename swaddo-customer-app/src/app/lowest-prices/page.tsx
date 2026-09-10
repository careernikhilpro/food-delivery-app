"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Star, Plus, Minus } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/context/CartContext";

const CATEGORIES = [
  { id: "all", name: "ALL", image: "/categories/burger.png", bgColor: "bg-[#fce5d8]" },
  { id: "biryani", name: "BIRYANI", image: "/categories/biryani.png", bgColor: "bg-white" },
  { id: "pizza", name: "PIZZA", image: "/categories/pizza.png", bgColor: "bg-white" },
  { id: "burger", name: "BURGER", image: "/categories/burger.png", bgColor: "bg-white" },
  { id: "noodles", name: "NOODLES", image: "/categories/Noodles.png", bgColor: "bg-white" },
];

const FILTERS = [
  { id: "discount", label: "25-60% lower prices", icon: "😎" },
  { id: "under49", label: "₹49 & under" },
  { id: "50to99", label: "₹50 - ₹99" },
  { id: "100to149", label: "₹100 - ₹149" },
];

const MOCK_ITEMS = [
  {
    id: 1,
    name: "Margherita Pizza (Serves 1)",
    restaurant: "The Pizza Project by Oven Story",
    rating: "4.3",
    originalPrice: 149,
    discountPrice: 99,
    image: "/categories/pizza.png",
    isVeg: true,
  },
  {
    id: 2,
    name: "Mumbai Burger",
    restaurant: "Jumboking Burgers",
    rating: "3.8",
    originalPrice: 60,
    discountPrice: 39,
    image: "/categories/burger.png",
    isVeg: true,
    promo: "😎 Our app: 40% lower",
  },
  {
    id: 3,
    name: "Cheese Burger",
    restaurant: "Burger King",
    rating: "4.1",
    originalPrice: 99,
    discountPrice: 59,
    image: "/categories/burger.png",
    isVeg: true,
  },
  {
    id: 4,
    name: "Veg Sandwich",
    restaurant: "Subway",
    rating: "4.5",
    originalPrice: 120,
    discountPrice: 79,
    image: "/categories/sandwich.png",
    isVeg: true,
  }
];

export default function LowestPricesPage() {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const { updateQuantity, cart } = useCart();

  return (
    <div className="flex flex-col min-h-screen bg-white font-body pb-24">
      {/* Header Section (Full Image Banner) */}
      <div className="relative w-full h-[220px] overflow-hidden rounded-b-[24px]">
        {/* Full Cover Graphic */}
        <Image 
          src="/everydaybanner.png" 
          alt="Everyday Lowest Prices" 
          fill 
          quality={100}
          unoptimized
          className="object-cover"
          priority
        />
        
        {/* Back Button */}
        <Link href="/" className="absolute top-5 left-4 z-20 w-10 h-10 bg-black/20 rounded-full flex items-center justify-center backdrop-blur-sm">
          <ArrowLeft className="text-white" size={22} />
        </Link>
      </div>

      
      {/* Chicken Biryani Hero Highlight */}
      <div className="px-4 mt-4 mb-2">
        <div className="relative w-full rounded-2xl bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200 p-4 shadow-sm overflow-hidden flex justify-between items-center">
          {/* Sparkles / background decoration */}
          <div className="absolute -top-4 -right-4 w-24 h-24 bg-orange-300 opacity-20 rounded-full blur-2xl"></div>
          
          <div className="flex flex-col z-10 w-[60%]">
            <span className="text-[10px] font-black text-white bg-red-500 px-2 py-0.5 rounded-full w-fit uppercase tracking-wider shadow-sm mb-1">Top Offer</span>
            <h3 className="text-[18px] font-black text-gray-900 leading-tight">Chicken Biryani</h3>
            <p className="text-gray-500 text-[11px] font-medium mt-0.5 mb-1.5">Don't Stop Crispy Chicken Stall</p>
            
            <div className="flex items-center gap-2 mb-3">
               <span className="text-red-500 font-black text-[18px]">&#8377;99</span>
               <span className="text-gray-400 font-medium text-[13px] line-through">&#8377;199</span>
            </div>
            
            <div className="flex items-center">
              {cart.stallId === "40" && cart.items.find(i => i.id === "1021") ? (
                  <div className="h-8 bg-white rounded-lg flex items-center justify-between shadow-sm border border-red-200 px-1">
                    <button 
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); updateQuantity("40", "Don't Stop Crispy Chicken Stall", { id: "1021", name: "Chicken Biryani", price: 99, markup: 0, isVeg: false }, -1); }}
                      className="w-6 h-full flex justify-center items-center text-red-600 font-bold"
                    ><Minus size={16} /></button>
                    <span className="text-[13px] font-bold text-red-700 w-6 text-center">{cart.items.find(i => i.id === "1021")?.quantity}</span>
                    <button 
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); updateQuantity("40", "Don't Stop Crispy Chicken Stall", { id: "1021", name: "Chicken Biryani", price: 99, markup: 0, isVeg: false }, 1); }}
                      className="w-6 h-full flex justify-center items-center text-red-600 font-bold"
                    ><Plus size={16} /></button>
                  </div>
              ) : (
                 <button 
                   onClick={() => updateQuantity("40", "Don't Stop Crispy Chicken Stall", { id: "1021", name: "Chicken Biryani", price: 99, markup: 0, isVeg: false }, 1)}
                   className="bg-white border border-red-500 text-red-600 font-black text-[13px] px-6 py-1.5 rounded-lg shadow-sm hover:bg-red-50"
                 >
                   + ADD
                 </button>
              )}
            </div>
          </div>
          
          <div className="relative w-[110px] h-[110px] z-10 mr-[-10px]">
            <Image src="/categories/biryani.png" alt="Chicken Biryani" fill className="object-contain drop-shadow-md scale-125" />
          </div>
        </div>
      </div>

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
        <h2 className="font-bold text-[17px] text-gray-900 mb-4">All {MOCK_ITEMS.length} Items</h2>
        
        {/* Item Grid */}
        <div className="grid grid-cols-2 gap-4">
          {MOCK_ITEMS.map((item) => (
            <div key={item.id} className="flex flex-col">
              {/* Image Container */}
              <div className="relative w-full aspect-square rounded-[20px] overflow-hidden bg-gray-100 shadow-sm mb-2">
                <Image src={item.image} alt={item.name} fill className="object-cover" />
                
                {/* Rating Badge */}
                <div className="absolute bottom-2 left-2 bg-white px-1.5 py-0.5 rounded flex items-center gap-1 shadow-sm">
                  <Star size={10} className="text-green-600 fill-green-600" />
                  <span className="text-[10px] font-bold text-green-700">{item.rating}</span>
                </div>
                
                {/* Add Button */}
                {cart.stallId === "lowest_prices_stall" && cart.items.find(i => i.id === item.id.toString()) ? (
                  <div className="absolute bottom-2 right-2 h-7 bg-white rounded-lg flex items-center justify-between shadow-md border border-gray-100 px-1 overflow-hidden">
                    <button 
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); updateQuantity("lowest_prices_stall", "Lowest Prices", { id: item.id.toString(), name: item.name, price: item.discountPrice, markup: 0, isVeg: item.isVeg }, -1); }}
                      className="w-6 h-full flex justify-center items-center text-gray-600 active:bg-gray-100"
                    ><Minus size={14} /></button>
                    <span className="text-[12px] font-bold text-gray-800 w-4 text-center">{cart.items.find(i => i.id === item.id.toString())?.quantity}</span>
                    <button 
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); updateQuantity("lowest_prices_stall", "Lowest Prices", { id: item.id.toString(), name: item.name, price: item.discountPrice, markup: 0, isVeg: item.isVeg }, 1); }}
                      className="w-6 h-full flex justify-center items-center text-[#FF007F] active:bg-gray-100"
                    ><Plus size={14} /></button>
                  </div>
                ) : (
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      updateQuantity(
                        "lowest_prices_stall", 
                        "Lowest Prices", 
                        { id: item.id.toString(), name: item.name, price: item.discountPrice, markup: 0, isVeg: item.isVeg }, 
                        1
                      );
                    }}
                    className="absolute bottom-2 right-2 w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-md border border-gray-100 active:scale-95 transition-transform"
                  >
                    <Plus size={18} className="text-[#FF007F]" />
                  </button>
                )}
              </div>
              
              {/* Details */}
              <div className="flex flex-col px-1">
                <p className="text-[11px] text-gray-500 font-medium truncate mb-0.5">{item.restaurant}</p>
                
                <div className="flex items-start gap-1">
                  {item.isVeg && (
                    <div className="mt-1 w-3 h-3 border border-green-600 flex items-center justify-center shrink-0">
                      <div className="w-1.5 h-1.5 bg-green-600 rounded-full"></div>
                    </div>
                  )}
                  <h3 className="font-bold text-[13px] text-gray-900 leading-tight line-clamp-2">
                    {item.name}
                  </h3>
                </div>
                
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-[11px] text-gray-400 line-through">₹{item.originalPrice}</span>
                  <span className="text-[13px] font-bold text-[#FF007F]">₹{item.discountPrice}</span>
                </div>

                {item.promo && (
                  <p className="text-[10px] font-bold text-[#FF007F] mt-1 flex items-center gap-1">
                    {item.promo}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
