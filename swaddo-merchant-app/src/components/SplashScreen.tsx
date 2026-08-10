"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SplashScreen as NativeSplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';

export default function SplashScreen() {
  const [mounted, setMounted] = useState(false);
  const [show, setShow] = useState(true);

  useEffect(() => {
    setMounted(true);
    
    // In capacitor, the native splash screen stays up for 1500ms
    // We want the react splash screen to show underneath it and fade out slightly after
    const t = setTimeout(() => {
      setShow(false);
    }, 2000);

    if (Capacitor.isNativePlatform()) {
      // Don't manually hide, let Capacitor's autoHide handle it based on launchShowDuration
      // Set status bar to match the green background
      StatusBar.setStyle({ style: Style.Dark }).catch(() => {});
      StatusBar.setBackgroundColor({ color: '#16A34A' }).catch(() => {});
      
      // Schedule reverting the status bar when splash is done
      setTimeout(() => {
        StatusBar.setStyle({ style: Style.Light }).catch(() => {});
        StatusBar.setBackgroundColor({ color: '#ffffff' }).catch(() => {});
      }, 2000);
    }

    return () => clearTimeout(t);
  }, []);

  if (!mounted) return null;

  return (
    <AnimatePresence>
      {show && (
        <motion.div 
          key="splash-screen"
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="fixed inset-0 z-[99999] bg-[#16A34A] flex flex-col items-center justify-center touch-none overflow-hidden"
        >
          <div className="relative z-10 flex flex-col items-center text-center">
            <h1 className="font-heading font-black text-5xl text-white tracking-tight flex flex-col items-center justify-center m-0 leading-tight">
              <span>SWADDO</span>
              <span>MERCHANT</span>
            </h1>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
