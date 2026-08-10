import axios from 'axios';
import { Preferences } from '@capacitor/preferences';

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'https://food-delivery-app-wfv0.onrender.com/api',
});

api.interceptors.request.use((config) => {
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

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.message === 'Network Error') {
      console.warn("Backend API is currently unreachable (Network Error). Suppressing to prevent app crash.");
      return Promise.resolve({ data: { success: false, data: null, message: "Network Error" } });
    }

    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('swaddo_delivery_token');
        Preferences.remove({ key: 'swaddo_delivery_token' });
        localStorage.removeItem('swaddo_delivery_phone');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);
