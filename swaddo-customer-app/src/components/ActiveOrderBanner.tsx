"use client";
import { useEffect, useState } from "react";
import useSWR from "swr";
import { api } from "@/lib/api";
import { io } from "socket.io-client";
import { useRouter, usePathname } from "next/navigation";
import { Package, Navigation } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const fetcher = (url: string) => api.get(url).then(res => res.data);

export default function ActiveOrderBanner() {
  const router = useRouter();
  const pathname = usePathname();
  
  // Don't show the banner if we are already on the track page or checkout/cart page
  const hideOnPaths = ['/track', '/cart', '/checkout'];
  const shouldHide = hideOnPaths.includes(pathname);

  const { data: ordersRes, mutate } = useSWR(shouldHide ? null : '/orders', fetcher, { 
    refreshInterval: 15000, 
    revalidateOnFocus: true
  });

  const rawOrders = ordersRes?.data || [];
  
  const activeOrder = Array.isArray(rawOrders) 
    ? rawOrders.find(o => !['delivered', 'cancelled', 'declined', 'payment_pending'].includes(o.status))
    : null;

  useEffect(() => {
    if (!activeOrder) return;
    
    let socketUrl = process.env.NEXT_PUBLIC_WS_URL; 
    if (!socketUrl && process.env.NEXT_PUBLIC_API_URL) socketUrl = process.env.NEXT_PUBLIC_API_URL.replace(/\/api\/?$/, ""); 
    const socket = io(socketUrl || "http://localhost:5005", { transports: ["websocket", "polling"], reconnection: true });
    
    socket.on(`order:${activeOrder.id}`, (update) => {
      mutate();
    });
    
    return () => { socket.disconnect(); };
  }, [activeOrder?.id, mutate]);

  if (!activeOrder || shouldHide) return null;

  const getStatusText = (status: string) => {
    switch (status) {
      case 'placed': return 'Order Placed';
      case 'preparing': 
      case 'ready': return 'Preparing Food';
      case 'assigned':
      case 'heading_to_stall':
      case 'at_stall': return 'Partner Assigned';
      case 'heading_to_customer':
      case 'out_for_delivery': return 'Out for Delivery';
      case 'at_customer':
      case 'arriving': return 'Arriving Now';
      default: return 'Processing...';
    }
  };

  return (
    <div className="fixed bottom-[85px] xl:bottom-6 left-0 right-0 z-[45] px-4 pointer-events-none flex justify-center">
      <AnimatePresence>
        <motion.div 
          initial={{ y: 50, opacity: 0, scale: 0.9 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 50, opacity: 0, scale: 0.9 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className="pointer-events-auto bg-[#1A1C1E]/80 backdrop-blur-xl rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.25)] border border-white/10 p-2 pr-3 cursor-pointer flex items-center justify-between gap-3 overflow-hidden relative group hover:bg-[#1A1C1E]/90 transition-all max-w-[340px] w-full"
          onClick={() => router.push(`/track?id=${activeOrder.id}`)}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-full"></div>
          
          <div className="flex items-center gap-3 relative z-10 flex-1 min-w-0">
            <div className="w-10 h-10 bg-primary/20 text-primary rounded-full flex items-center justify-center shrink-0 relative overflow-hidden backdrop-blur-md">
              <div className="absolute inset-0 bg-primary animate-ping opacity-20"></div>
              <Package size={20} strokeWidth={2.5} />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[9px] font-black text-primary/90 uppercase tracking-[0.2em] mb-0.5">{getStatusText(activeOrder.status)}</span>
              <p className="text-[13px] text-white/90 font-medium truncate tracking-wide">{activeOrder.stall_name || 'Your Order'}</p>
            </div>
          </div>
          
          <div className="relative z-10 bg-primary hover:bg-primary-hover rounded-full px-4 py-2 flex items-center justify-center text-white shrink-0 shadow-lg transition-colors active:scale-95 text-[11px] font-bold tracking-wide gap-1.5 uppercase">
             Track <Navigation size={12} className="ml-0.5" />
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
