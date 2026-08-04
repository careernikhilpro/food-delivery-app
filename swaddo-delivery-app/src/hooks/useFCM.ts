import { useEffect } from 'react';
import { requestNotificationPermission, onForegroundMessage } from '../lib/firebase';
import { api } from '../lib/api';

export const useFCM = () => {
  useEffect(() => {
    const setupFCM = async () => {
      try {
        const token = await requestNotificationPermission();
        if (token) {
          console.log('FCM Token generated:', token);
          // Send to backend only if authenticated
          const authToken = typeof window !== 'undefined' ? localStorage.getItem('swaddo_delivery_token') : null;
          if (authToken) {
            await api.post('/auth/fcm-token', { token }).catch(() => {});
          }
        }
      } catch (err) {
        console.error('Failed to setup FCM:', err);
      }
    };

    setupFCM();

    onForegroundMessage((payload) => {
      console.log('Foreground push notification received:', payload);
      // Fire an event that the Home component can listen to
      if (payload.data) {
        window.dispatchEvent(new CustomEvent('swaddo_new_job', { detail: payload.data }));
      }
      if (payload.notification) {
        if ('Notification' in window && Notification.permission === 'granted') {
           new Notification(payload.notification.title, { body: payload.notification.body });
        } else {
           alert(`${payload.notification.title}\n${payload.notification.body}`);
        }
      }
    });

    const handleSWMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'BACKGROUND_NEW_ORDER') {
        console.log('Woken up by background SW message!', event.data.payload);
        if (event.data.payload?.data) {
          window.dispatchEvent(new CustomEvent('swaddo_new_job', { detail: event.data.payload.data }));
        }
      }
    };

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleSWMessage);
    }

    return () => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleSWMessage);
      }
    };
  }, []);
};
