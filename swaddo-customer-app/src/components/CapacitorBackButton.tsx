"use client";

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { App as CapacitorApp } from '@capacitor/app';

export default function CapacitorBackButton() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const isNative = !!(window as any).Capacitor?.isNative;
    if (!isNative) return;

    const backButtonListener = CapacitorApp.addListener('backButton', () => {
      // Check if we are on root or main tabs where back button should exit
      const isRoot = pathname === '/' || pathname === '/login' || pathname === '/home';
      
      if (isRoot) {
        CapacitorApp.exitApp();
      } else {
        // Navigate back in history
        router.back();
      }
    });

    return () => {
      backButtonListener.then(listener => listener.remove());
    };
  }, [router, pathname]);

  return null;
}
