"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Search, Star, Plus, Minus, ChevronDown } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/context/CartContext";

const FILTERS = [
  { id: "discount", label: "25-60% lower prices", icon: "😎" },
  { id: "delivery", label: "Delivery time", iconRight: <ChevronDown size={14} /> },
  { id: "vegNonVeg", label: "Veg/Non-Veg", iconRight: <ChevronDown size={14} /> },
];

const MOCK_ITEMS = [
  {
    id: 1,
    name: "Dabeli",
    restaurant: "Ganesh Bhel - Sadashiv Peth",
    rating: "4.3",
    originalPrice: 54,
    discountPrice: 48, // Adjusted to make sense
    image: "/categories/sandwich.png", // Using a placeholder since we don't have Dabeli
    isVeg: true,
    promo: "😎 Our app: 10% lower",
  },
  {
    id: 2,
    name: "Spdp chaat",
    restaurant: "Shree Krishna Panipuri Chaat ...",
    rating: "3.8",
    originalPrice: 72,
    discountPrice: 59,
    image: "/categories/kachori.png", // Using placeholder
    isVeg: true,
    promo: "😎 Our app: 20% lower",
  },
  {
    id: 3,
    name: "Chicken Steamed Momos [8 Pieces]",
    restaurant: "Rocket Momos",
    rating: "4.3",
    originalPrice: 119,
    discountPrice: 99,
    image: "/categories/momo.png", // Assuming momo.png exists
    isVeg: false,
  },
  {
    id: 4,
    name: "Classic Corn Pizza",
    restaurant: "Pizza Hut",
    rating: "3.8",
    originalPrice: 129,
    discountPrice: 99,
    image: "/categories/pizza.png",
    isVeg: true,
  }
];

export default function MealsUnder99Page() {
  const { updateQuantity, cart } = useCart();

  return (
    <div className="flex flex-col min-h-screen bg-white font-body pb-24">
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
        <div className="absolute top-5 w-full px-4 flex items-center justify-between z-20">
          <Link href="/" className="w-10 h-10 bg-black/20 rounded-full flex items-center justify-center backdrop-blur-sm">
            <ArrowLeft className="text-white" size={22} />
          </Link>
          <button className="w-10 h-10 bg-black/20 rounded-full flex items-center justify-center backdrop-blur-sm">
            <Search className="text-white" size={20} />
          </button>
        </div>
      </div>

      {/* Filters Horizontal Slider */}
      <div className="w-full overflow-x-auto hide-scrollbar pt-5 pb-4 px-4 border-b border-gray-100">
        <div className="flex gap-2 min-w-max">
          {FILTERS.map((filter) => (
            <button 
              key={filter.id} 
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-gray-300 bg-white hover:bg-gray-50 text-[13px] font-medium text-gray-700 shadow-sm transition-colors"
            >
              {filter.icon && <span>{filter.icon}</span>}
              {filter.label}
              {filter.iconRight && <span className="ml-0.5 text-gray-500">{filter.iconRight}</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 mt-5">
        <h2 className="font-bold text-[15px] text-gray-900 mb-4">All {MOCK_ITEMS.length} Items</h2>
        
        {/* Item Grid */}
        <div className="grid grid-cols-2 gap-4">
          {MOCK_ITEMS.map((item) => (
            <div key={item.id} className="flex flex-col">
              {/* Image Container */}
              <div className="relative w-full aspect-[4/3] rounded-[16px] overflow-hidden bg-gray-100 shadow-sm mb-2">
                <Image src={item.image} alt={item.name} fill className="object-cover" />
                
                {/* Rating Badge */}
                <div className="absolute bottom-2 left-2 bg-white px-1.5 py-0.5 rounded flex items-center gap-1 shadow-sm">
                  <Star size={10} className="text-green-600 fill-green-600" />
                  <span className="text-[10px] font-bold text-green-700">{item.rating}</span>
                </div>
                
                {/* Add Button */}
                {cart.stallId === "meals_99_stall" && cart.items.find(i => i.id === item.id.toString()) ? (
                  <div className="absolute bottom-2 right-2 h-7 bg-white rounded-lg flex items-center justify-between shadow-md border border-gray-100 px-1 overflow-hidden">
                    <button 
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); updateQuantity("meals_99_stall", "Meals under ₹99", { id: item.id.toString(), name: item.name, price: item.discountPrice, markup: 0, isVeg: item.isVeg }, -1); }}
                      className="w-6 h-full flex justify-center items-center text-gray-600 active:bg-gray-100"
                    ><Minus size={14} /></button>
                    <span className="text-[12px] font-bold text-gray-800 w-4 text-center">{cart.items.find(i => i.id === item.id.toString())?.quantity}</span>
                    <button 
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); updateQuantity("meals_99_stall", "Meals under ₹99", { id: item.id.toString(), name: item.name, price: item.discountPrice, markup: 0, isVeg: item.isVeg }, 1); }}
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
                  {item.isVeg ? (
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
