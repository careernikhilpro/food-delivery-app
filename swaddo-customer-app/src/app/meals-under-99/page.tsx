"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Search, Star, Plus, Minus, ChevronDown, X } from "lucide-react";
import { useEffect, useState } from "react";
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
  const [variantModal, setVariantModal] = useState<any>({ isOpen: false, stallId: '', stallName: '', item: null });

  useEffect(() => {
    api.get("/stalls/meals-under-99").then((res: any) => {
      if (res.data && Array.isArray(res.data.data)) {
        setItems(res.data.data);
      }
    }).catch((err: any) => console.error("Error fetching meals under 99:", err));
  }, []);

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
        <h2 className="font-bold text-[15px] text-gray-900 mb-4">All {items.length} Items</h2>
        
        {/* Item Grid */}
        <div className="grid grid-cols-2 gap-4">
          {items.map((item) => {
            const parsedPrice = typeof item.price === 'number' ? item.price : parseFloat((item.price || "0").toString().replace(/[^0-9.]/g, ''));
            const originalPrice = Math.round(parsedPrice * 1.2);
            let quantity = 0;
            if (cart.stallId === item.stall_id?.toString()) {
              if (item.has_variants) {
                const prefix = String(item.id) + '_';
                quantity = cart.items.filter(i => String(i.id).startsWith(prefix)).reduce((sum, i) => sum + i.quantity, 0);
              } else {
                const isAdded = cart.items.find(i => String(i.id) === String(item.id));
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
          })}
        </div>
      </div>
      {variantModal.isOpen && variantModal.item && (
        <VariantModalComponent 
          modalState={variantModal} 
          setModalState={setVariantModal} 
          updateQuantity={updateQuantity}
        />
      )}
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
