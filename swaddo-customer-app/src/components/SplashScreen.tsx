"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface SplashScreenProps {
  onComplete?: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [mounted, setMounted] = useState(false);
  const [show, setShow] = useState(true);

  useEffect(() => {
    // Set mounted immediately
    setMounted(true);
    
    const t = setTimeout(() => {
      setShow(false);
      setTimeout(() => {
        if (onComplete) {
          onComplete();
        }
      }, 600); // Wait for exit animation
    }, 2500);
    return () => clearTimeout(t);
  }, [onComplete]);

  if (!mounted) return null;

  return (
    <AnimatePresence>
      {show && (
        <motion.div 
          key="splash-screen"
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          className="fixed inset-0 z-[99999] bg-[#FF5722] overflow-hidden flex flex-col items-center justify-center touch-none"
        >
          {/* Subtle background patterns (optional based on image, looks clean solid orange in image 1) */}
          <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: "radial-gradient(circle at center, rgba(255,255,255,0.2) 0%, transparent 60%)" }} />

          {/* Main Logo Container */}
          <div className="relative z-10 flex flex-col items-center">
            
            {/* Logo Pin */}
            <motion.div
              initial={{ scale: 0, y: -20 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ 
                type: "spring",
                damping: 12,
                stiffness: 100,
                duration: 0.8
              }}
              className="relative w-28 h-32 flex flex-col items-center justify-center"
            >
              {/* Map pin vector approximation */}
              <svg viewBox="0 0 100 120" className="w-full h-full text-white drop-shadow-lg" fill="currentColor">
                 <path d="M50 0C22.4 0 0 22.4 0 50c0 37.5 50 70 50 70s50-32.5 50-70C100 22.4 77.6 0 50 0zm0 75c-13.8 0-25-11.2-25-25s11.2-25 25-25 25 11.2 25 25-11.2 25-25 25z" />
              </svg>
              {/* 'S' inside the pin */}
              <div className="absolute top-0 w-full h-[100px] flex items-center justify-center">
                 <motion.span 
                   initial={{ opacity: 0, scale: 0.5 }}
                   animate={{ opacity: 1, scale: 1 }}
                   transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
                   className="font-heading font-black text-5xl text-[#FF5722]"
                 >
                   S
                 </motion.span>
              </div>
            </motion.div>

            {/* Brand Name */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="mt-6 flex flex-col items-center"
            >
              <h1 className="font-heading font-black text-4xl tracking-tight text-white mb-2">
                Swaddo
              </h1>
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
                className="text-white/90 font-medium text-sm tracking-wide"
              >
                Food. Delivered. Yours.
              </motion.p>
            </motion.div>
          </div>

          {/* Loading Indicator at Bottom */}
          <motion.div 
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             transition={{ duration: 0.5, delay: 1.5 }}
             className="absolute bottom-12 flex flex-col items-center"
          >
             <div className="w-16 h-1 bg-white/30 rounded-full overflow-hidden">
               <motion.div 
                 className="h-full bg-white rounded-full"
                 initial={{ width: "0%" }}
                 animate={{ width: "100%" }}
                 transition={{ duration: 1, delay: 1.5, ease: "easeInOut" }}
               />
             </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
