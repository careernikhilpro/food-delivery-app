import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Preferences } from '@capacitor/preferences';

export function useAuth() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let token = localStorage.getItem('swaddo_delivery_token');
    
    // Fallback to cookie if localStorage was cleared
    if (!token && typeof document !== 'undefined') {
      const match = document.cookie.match(new RegExp('(^| )token=([^;]+)'));
      if (match) {
        token = match[2];
        localStorage.setItem('swaddo_delivery_token', token);
        Preferences.set({ key: 'swaddo_delivery_token', value: token });
      }
    }

    if (!token || token.startsWith('mock_')) {
      if (token) localStorage.removeItem('swaddo_delivery_token');
      localStorage.setItem('swaddo_redirect_to', pathname);
      router.push('/login');
      return;
    }
      
    // Strict Active Delivery Lock REMOVED for Stacked Orders support.
    // Riders can now navigate between home and multiple active delivery screens.
      
    // Ensure redirect mapping handles login -> appropriate page
    if (pathname === '/login') {
      const redirectTo = localStorage.getItem('swaddo_redirect_to') || '/home';
      localStorage.removeItem('swaddo_redirect_to');
      router.push(redirectTo);
    }
  }, [pathname, router]);
}

export function requireAuth(router: any, intendedPath: string): boolean {
  if (typeof window !== 'undefined') {
    let token = localStorage.getItem('swaddo_delivery_token');
    
    // Fallback to cookie
    if (!token && typeof document !== 'undefined') {
      const match = document.cookie.match(new RegExp('(^| )token=([^;]+)'));
      if (match) {
        token = match[2];
        localStorage.setItem('swaddo_delivery_token', token);
        Preferences.set({ key: 'swaddo_delivery_token', value: token });
      }
    }

    if (!token || token.startsWith('mock_')) {
      if (token) localStorage.removeItem('swaddo_delivery_token');
      localStorage.setItem('swaddo_redirect_to', intendedPath);
      router.push('/login');
      return false;
    }
    return true;
  }
  return false;
}
