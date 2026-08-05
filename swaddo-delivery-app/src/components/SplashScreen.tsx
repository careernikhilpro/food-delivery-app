"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bike, Package, Wind } from "lucide-react";

export default function SplashScreen() {
  const [mounted, setMounted] = useState(false);
  const [show, setShow] = useState(true);

  useEffect(() => {
    setMounted(true);
    const t = setTimeout(() => {
      setShow(false);
    }, 1800); 
    return () => clearTimeout(t);
  }, []);

  if (!mounted) return null;

  return (
    <AnimatePresence>
      {show && (
        <motion.div 
          key="splash-screen"
          exit={{ opacity: 0, scale: 1.1 }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
          className="fixed inset-0 z-[99999] bg-gradient-to-br from-[#10B981] to-[#064E3B] flex flex-col items-center justify-center touch-none"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: [1, 1.05, 1], opacity: 1 }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="flex flex-col items-center justify-center bg-white/15 rounded-[32px] w-48 h-48 shadow-[0_16px_64px_rgba(0,0,0,0.3)] border-2 border-white/20 backdrop-blur-md"
          >
            <h1 className="text-4xl font-black text-white tracking-tighter leading-none mt-2">Swaddo</h1>
            <p className="text-[10px] font-bold text-[#34D399] tracking-[0.2em] uppercase mt-3 text-center leading-relaxed">Delivery<br/>Partner</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
