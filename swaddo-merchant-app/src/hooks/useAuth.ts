import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Preferences } from '@capacitor/preferences';

export function useAuth() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let token = localStorage.getItem('swaddo_merchant_token');
    
    // Fallback to cookie if localStorage was cleared (e.g., PWA force-close bug)
    if (!token && typeof document !== 'undefined') {
      const match = document.cookie.match(new RegExp('(^| )token=([^;]+)'));
      if (match) {
        token = match[2];
        localStorage.setItem('swaddo_merchant_token', token);
        Preferences.set({ key: 'swaddo_merchant_token', value: token });
      }
    }

    if (!token || token.startsWith('mock_')) {
      if (token) {
        localStorage.removeItem('swaddo_merchant_token');
        Preferences.remove({ key: 'swaddo_merchant_token' });
      }
      localStorage.setItem('swaddo_redirect_to', pathname);
      router.push('/login');
    } else {
      // Always sync to Capacitor Storage to ensure native code has access
      Preferences.set({ key: 'swaddo_merchant_token', value: token });
    }
  }, [router, pathname]);
}

export function requireAuth(router: any, intendedPath: string): boolean {
  if (typeof window !== 'undefined') {
    let token = localStorage.getItem('swaddo_merchant_token');
    
    // Fallback to cookie
    if (!token && typeof document !== 'undefined') {
      const match = document.cookie.match(new RegExp('(^| )token=([^;]+)'));
      if (match) {
        token = match[2];
        localStorage.setItem('swaddo_merchant_token', token);
        Preferences.set({ key: 'swaddo_merchant_token', value: token });
      }
    }

    if (!token || token.startsWith('mock_')) {
      if (token) {
        localStorage.removeItem('swaddo_merchant_token');
        Preferences.remove({ key: 'swaddo_merchant_token' });
      }
      localStorage.setItem('swaddo_redirect_to', intendedPath);
      router.push('/login');
      return false;
    }
    return true;
  }
  return false;
}
