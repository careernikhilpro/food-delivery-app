"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Search, Star, Plus, Minus, ChevronDown, CheckCircle2, Menu, Clock, X, Check } from "lucide-react";
import { useEffect, useState } from "react";
import { useCart } from "@/context/CartContext";
import { api } from "@/lib/api";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

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

const FILTERS = [
  { id: "discount", label: "25-60% lower prices", icon: "😎" },
  { id: "delivery", label: "Delivery time", iconRight: <ChevronDown size={14} /> },
  { id: "vegNonVeg", label: "Veg/Non-Veg", iconRight: <ChevronDown size={14} /> },
];

export default function CategoryPage() {
  const params = useParams();
  const router = useRouter();
  const initialCategory = decodeURIComponent(params.name as string);
  
  const { updateQuantity, cart } = useCart();
  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [variantModal, setVariantModal] = useState<any>({ isOpen: false, stallId: '', stallName: '', item: null });

  useEffect(() => {
    // Scroll to top on category change
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    setIsLoading(true);
    let categoryName = activeCategory;
    
    // Strip trailing 's' to match DB (e.g. Burgers -> Burger)
    let searchTerm = categoryName;
    if (searchTerm.endsWith('s') || searchTerm.endsWith('S')) {
      searchTerm = searchTerm.slice(0, -1);
    }
    
    api.get(`/stalls/search/all?q=${searchTerm}`)
      .then((res: any) => {
        if (res.data && Array.isArray(res.data.dishes)) {
          const parsePrice = (price: any) => typeof price === 'number' ? price : parseFloat((price || "0").toString().replace(/[^0-9.]/g, ''));
          const sortedDishes = res.data.dishes.sort((a: any, b: any) => parsePrice(a.price) - parsePrice(b.price));
          setItems(sortedDishes);
        }
      })
      .catch((err: any) => console.error("Error fetching category items:", err))
      .finally(() => setIsLoading(false));
  }, [activeCategory]);

  return (
    <div className="flex flex-col min-h-screen bg-white font-body pb-24">
      {/* Header Section (Full Image Banner) */}
      <div className="relative w-full h-[240px] overflow-hidden bg-gradient-to-r from-emerald-600 to-green-500">
        {/* Top Navigation */}
        <div className="absolute top-5 w-full px-4 flex items-center justify-between z-20">
          <button onClick={() => router.back()} className="w-10 h-10 bg-black/20 rounded-full flex items-center justify-center backdrop-blur-sm">
            <ArrowLeft className="text-white" size={22} />
          </button>
          <button className="w-10 h-10 bg-black/20 rounded-full flex items-center justify-center backdrop-blur-sm">
            <Search className="text-white" size={20} />
          </button>
        </div>
        
        <div className="absolute inset-0 flex items-center justify-center z-10 px-6">
            <div className="text-center">
                <h1 className="text-4xl font-black text-white italic tracking-tighter drop-shadow-md transform -skew-x-12 uppercase">EVERYDAY<br/>LOWEST PRICES</h1>
                <div className="w-16 h-1 bg-yellow-400 mx-auto mt-2 rounded-full"></div>
            </div>
        </div>
      </div>

      {/* Categories Horizontal Slider */}
      <div className="w-full overflow-x-auto hide-scrollbar pt-6 pb-2 px-4 -mt-10 relative z-20 bg-white rounded-t-3xl">
        <div className="flex gap-4 min-w-max px-2">
          {categories.map((cat) => (
            <button 
              key={cat.name} 
              onClick={() => setActiveCategory(cat.name)}
              className={`flex flex-col items-center justify-center gap-1.5 p-2 rounded-2xl transition-all ${activeCategory.toLowerCase() === cat.name.toLowerCase() ? 'bg-pink-50 ring-1 ring-pink-200 shadow-sm' : ''}`}
            >
              <div className="w-[70px] h-[70px] rounded-full overflow-hidden border border-gray-100 bg-white shadow-sm flex items-center justify-center">
                  <Image src={cat.image} alt={cat.name} width={50} height={50} className="object-contain" />
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[9px] font-black text-white bg-[#FF007F] px-1.5 py-0.5 rounded uppercase tracking-wider mb-0.5 shadow-sm">From ₹{cat.price}</span>
                <span className={`text-[12px] font-bold ${activeCategory.toLowerCase() === cat.name.toLowerCase() ? 'text-gray-900' : 'text-gray-600'}`}>{cat.name}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Filters Horizontal Slider */}
      <div className="w-full overflow-x-auto hide-scrollbar pt-3 pb-4 px-4 border-b border-gray-100">
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
        <h2 className="font-black text-[18px] text-gray-900 mb-4 tracking-tight">All {items.length} Items</h2>
        
        {/* Item Grid */}
        <div className="grid grid-cols-2 gap-4">
          {items.map((item) => {
            const parsedPrice = typeof item.price === 'number' ? item.price : parseFloat((item.price || "0").toString().replace(/[^0-9.]/g, ''));
            const originalPrice = Math.round(parsedPrice * 1.2);
            let quantity = 0;
            if (String(cart.stallId) === String(item.stall_id)) {
              if (item.has_variants) {
                const prefix = String(item.id) + '_';
                quantity = cart.items.filter(i => String(i.id).startsWith(prefix)).reduce((sum, i) => sum + i.quantity, 0);
              } else {
                const isAdded = cart.items.find(i => String(i.id) === String(item.id));
                quantity = isAdded ? isAdded.quantity : 0;
              }
            }
            
            const fallbackImg = categories.find(c => c.name === activeCategory)?.image || "/categories/burger.png";
            
            return (
              <div key={item.id} className="flex flex-col bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.06)] overflow-visible relative border border-gray-100/50 shrink-0 mb-2">
                 
                  {/* Image Area */}
                  <div className="relative w-full h-[140px] bg-blue-50/50 rounded-t-2xl overflow-visible">
                    <div className="absolute inset-0 rounded-t-2xl overflow-hidden">
                       <Image src={item.image_url || fallbackImg} alt={item.name} fill className={`object-cover ${!item.image_url && fallbackImg.includes('gulab') ? 'scale-125' : ''}`} />
                    </div>
                    
                    {/* Popular Tag */}
                    <div className="absolute top-2 left-2 bg-white text-[#00A14F] font-black text-[10px] px-2 py-0.5 rounded-full shadow-sm z-10">
                      Popular
                    </div>
                    
                    {/* Plus Button */}
                    {quantity > 0 ? (
                      <div className="absolute -bottom-4 right-3 h-8 bg-white rounded-lg flex items-center justify-between shadow-md border border-gray-100 px-1 overflow-hidden z-20">
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
                              updateQuantity(item.stall_id?.toString(), item.stall_name, { id: String(item.id), name: item.name, price: parsedPrice, image: item.image_url, isVeg: item.is_veg }, -1); 
                            }
                          }}
                          className="w-6 h-full flex justify-center items-center text-gray-600 active:bg-gray-100"
                        ><Minus size={14} /></button>
                        <span className="text-[13px] font-bold text-gray-800 flex-1 text-center min-w-[20px]">{quantity}</span>
                        <button 
                          onClick={(e) => { 
                            e.preventDefault(); 
                            e.stopPropagation(); 
                            if (item.has_variants) {
                              setVariantModal({ isOpen: true, stallId: item.stall_id?.toString(), stallName: item.stall_name, item });
                            } else {
                              updateQuantity(item.stall_id?.toString(), item.stall_name, { id: String(item.id), name: item.name, price: parsedPrice, image: item.image_url, isVeg: item.is_veg }, 1); 
                            }
                          }}
                          className="w-6 h-full flex justify-center items-center text-[#FF007F] active:bg-gray-100"
                        ><Plus size={14} strokeWidth={3} /></button>
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
                              { id: String(item.id), name: item.name, price: parsedPrice, image: item.image_url, isVeg: item.is_veg }, 
                              1
                            );
                          }
                        }}
                        className="absolute -bottom-4 right-3 w-9 h-9 bg-white border border-[#FF007F] rounded-full flex items-center justify-center z-20 shadow-[0_2px_8px_rgba(255,0,127,0.25)] hover:bg-gray-50 transition-colors"
                      >
                        <Plus size={18} className="text-[#FF007F]" strokeWidth={2.5} />
                      </button>
                    )}
                  </div>

                  {/* Details */}
                  <div className="p-3 pt-4 pb-4">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <div className={`w-3 h-3 rounded-sm border flex items-center justify-center ${item.is_veg !== false ? 'border-green-600' : 'border-red-600'}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${item.is_veg !== false ? 'bg-green-600' : 'bg-red-600'}`} />
                      </div>
                      <div className="text-[10px] font-bold text-gray-500 bg-gray-50 px-1.5 py-0.5 rounded line-clamp-1 truncate">{item.stall_name}</div>
                    </div>
                    
                    <h3 className="font-bold text-[14px] text-gray-800 leading-[1.2] mb-2 line-clamp-2">{item.name}</h3>
                    
                    <div className="flex items-center justify-between mt-auto">
                      <div className="flex flex-col">
                        <span className="text-[11px] text-gray-400 line-through leading-none mb-1">₹{Math.round(parsedPrice * 1.3)}</span>
                        <span className="font-black text-[15px] text-gray-900 leading-none">₹{parsedPrice}</span>
                      </div>
                    </div>
                  </div>
                </div>
            );
          })}
        </div>
      </div>
      
      {/* Variant Selection Modal */}
      {variantModal.isOpen && variantModal.item && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50" onClick={() => setVariantModal({ isOpen: false, stallId: '', stallName: '', item: null })}>
          <div 
            className="w-full bg-white rounded-t-[24px] p-5 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg text-gray-800">Select Variant</h3>
              <button onClick={() => setVariantModal({ isOpen: false, stallId: '', stallName: '', item: null })} className="p-1 bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200">
                <X size={20} />
              </button>
            </div>
            
            <div className="flex gap-3 mb-5 pb-4 border-b border-gray-100">
              <div className="w-16 h-16 rounded-xl bg-gray-100 overflow-hidden relative shrink-0">
                <Image src={variantModal.item.image_url || "/categories/burger.png"} alt={variantModal.item.name} fill className="object-cover" />
              </div>
              <div>
                <h4 className="font-bold text-gray-800">{variantModal.item.name}</h4>
                <p className="text-[12px] text-gray-500 line-clamp-2 mt-0.5">{variantModal.item.description}</p>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {(variantModal.item.variants || []).map((v: any, idx: number) => {
                const vId = `${variantModal.item.id}_${idx}`;
                const isAdded = cart.items.find((i: any) => i.id === vId);
                const qty = isAdded ? isAdded.quantity : 0;
                const vPrice = Number((v.price || "0").toString().replace(/[^0-9.]/g, ''));

                return (
                  <div key={idx} className="flex justify-between items-center p-3 border border-gray-100 rounded-xl hover:border-gray-200 transition-colors">
                    <div>
                      <span className="font-semibold text-gray-800 text-[14px]">{v.name}</span>
                      <div className="text-[14px] font-bold text-gray-600 mt-0.5">₹{vPrice}</div>
                    </div>
                    {qty > 0 ? (
                      <div className="flex items-center justify-between w-[80px] h-[32px] bg-green-50 border border-green-200 text-green-700 font-bold text-[14px] rounded-lg">
                        <button onClick={() => updateQuantity(variantModal.stallId, variantModal.stallName, { id: vId, name: `${variantModal.item.name} - ${v.name}`, price: vPrice, image: variantModal.item.image_url, isVeg: variantModal.item.is_veg }, -1)} className="w-1/3 flex justify-center py-1"><Minus size={14} /></button>
                        <span>{qty}</span>
                        <button onClick={() => updateQuantity(variantModal.stallId, variantModal.stallName, { id: vId, name: `${variantModal.item.name} - ${v.name}`, price: vPrice, image: variantModal.item.image_url, isVeg: variantModal.item.is_veg }, 1)} className="w-1/3 flex justify-center py-1"><Plus size={14} /></button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => updateQuantity(variantModal.stallId, variantModal.stallName, { id: vId, name: `${variantModal.item.name} - ${v.name}`, price: vPrice, image: variantModal.item.image_url, isVeg: variantModal.item.is_veg }, 1)}
                        className="px-6 h-[32px] rounded-lg border border-[#FF007F] text-[#FF007F] font-bold text-[13px] bg-white hover:bg-pink-50 transition-colors uppercase"
                      >
                        Add
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
