"use client";

import { useState, useEffect } from "react";
import { WifiOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { Network } from '@capacitor/network';
import { Capacitor } from '@capacitor/core';

export default function OfflineOverlay() {
  const [isOnline, setIsOnline] = useState(true);
  const [showOverlay, setShowOverlay] = useState(false);

  useEffect(() => {
    let networkListener: any;

    const setupNativeNetwork = async () => {
      const status = await Network.getStatus();
      setIsOnline(status.connected);

      networkListener = await Network.addListener('networkStatusChange', status => {
        if (status.connected) {
          setIsOnline(true);
          setTimeout(() => setShowOverlay(false), 2000);
        } else {
          setIsOnline(false);
          setShowOverlay(true);
        }
      });
    };

    const handleWebOnline = () => {
      setIsOnline(true);
      setTimeout(() => setShowOverlay(false), 2000); // Hide after showing success for 2s
    };

    const handleWebOffline = () => {
      setIsOnline(false);
      setShowOverlay(true);
    };

    if (Capacitor.isNativePlatform()) {
      setupNativeNetwork();
    } else {
      if (typeof window !== "undefined") {
        setIsOnline(navigator.onLine);
        window.addEventListener("online", handleWebOnline);
        window.addEventListener("offline", handleWebOffline);
      }
    }

    return () => {
      if (networkListener) networkListener.remove();
      if (typeof window !== "undefined") {
        window.removeEventListener("online", handleWebOnline);
        window.removeEventListener("offline", handleWebOffline);
      }
    };
  }, []);

  return (
    <AnimatePresence>
      {showOverlay && (
        <motion.div
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="fixed bottom-0 left-0 w-full z-[100] px-4 pb-6 pt-2 pointer-events-none"
        >
          <div className="max-w-md mx-auto pointer-events-auto">
            {!isOnline ? (
              <div className="bg-white rounded-2xl shadow-[0_-8px_30px_rgba(0,0,0,0.12)] p-5 border border-red-100 flex items-start gap-4">
                <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center shrink-0">
                  <WifiOff size={24} className="text-red-500" />
                </div>
                <div className="flex-1 pt-1">
                  <h3 className="font-heading font-bold text-gray-900 text-lg leading-tight">No Internet Connection</h3>
                  <p className="text-sm text-gray-500 mt-1">Please check your connection or try again later.</p>
                  
                  <button 
                    onClick={() => window.location.reload()}
                    className="mt-4 px-5 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-full text-sm font-semibold transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-green-500 rounded-2xl shadow-lg p-4 flex items-center justify-center gap-2">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                <span className="text-white font-semibold text-sm">Back Online!</span>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
