"use client";

import { useCart } from "@/context/CartContext";
import Link from "next/link";
import Image from "next/image";
import { ShoppingCart, Trash2 } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState, useRef } from "react";

export default function FloatingCart() {
  const { cartItemCount, cartTotal, cart, clearCart } = useCart();
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const scrollContainer = document.querySelector('.app-scroll-container');
    if (!scrollContainer) return;

    const handleScroll = (e: Event) => {
      const target = e.target as HTMLElement;
      const currentScrollY = target.scrollTop;
      
      if (currentScrollY > lastScrollY.current + 10) {
        setIsVisible(false);
        lastScrollY.current = currentScrollY;
      } else if (currentScrollY < lastScrollY.current - 10) {
        setIsVisible(true);
        lastScrollY.current = currentScrollY;
      }
    };

    scrollContainer.addEventListener("scroll", handleScroll, { passive: true });
    return () => scrollContainer.removeEventListener("scroll", handleScroll);
  }, []);

  // Don't show the floating cart on the actual cart page or checkout page
  if (cartItemCount === 0 || pathname === '/cart' || pathname === '/checkout') {
    return null;
  }

  // A default thumbnail if we don't have one
  const stallImage = "/categories/north_indian.jpg"; 
  const stallName = cart.stallName || "Restaurant";

  let menuLink = `/stall?id=${cart.stallId}`;
  if (cart.stallId === 'meals_99_stall') {
    menuLink = `/meals-under-99`;
  }

  return (
    <div className={`fixed bottom-0 left-0 w-full z-50 p-3 bg-white border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] flex items-center justify-between transition-transform duration-300 ease-in-out ${isVisible ? 'translate-y-0' : 'translate-y-full'}`}>
      {/* Left side: Restaurant Info */}
      <div className="flex items-center gap-3 w-1/3">
        <div className="relative w-11 h-11 rounded-lg overflow-hidden shrink-0 border border-gray-100">
          <Image src={stallImage} alt={stallName} fill className="object-cover" />
        </div>
        <div className="flex flex-col">
          <span className="text-[13px] font-bold text-gray-800 line-clamp-1 leading-tight mb-0.5">{stallName}</span>
          <Link href={menuLink} className="text-[12px] font-bold text-green-700 hover:underline">
            View Menu
          </Link>
        </div>
      </div>

      {/* Right side: Cart Button and Trash */}
      <div className="flex items-center gap-2">
        {/* View Cart Button */}
        <Link 
          href="/cart" 
          className="bg-green-700 hover:bg-green-800 text-white rounded-full py-2 px-5 flex items-center gap-3 transition-colors shadow-sm"
        >
          <div className="flex flex-col items-start border-r border-green-600/50 pr-3">
            <span className="text-[10px] font-medium text-white/90 leading-tight">
              {cartItemCount} item{cartItemCount > 1 ? 's' : ''} | ₹{cartTotal}
            </span>
            <span className="text-[13px] font-black tracking-wide leading-tight mt-0.5">VIEW CART</span>
          </div>
          <ShoppingCart size={20} className="fill-transparent" />
        </Link>
        
        {/* Clear Cart Button */}
        <button 
          onClick={clearCart}
          className="w-[42px] h-[42px] bg-red-50 hover:bg-red-100 rounded-[14px] flex items-center justify-center transition-colors shrink-0"
        >
          <Trash2 size={20} className="text-pink-500" />
        </button>
      </div>
    </div>
  );
}
