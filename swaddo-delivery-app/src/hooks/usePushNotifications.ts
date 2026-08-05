import { useEffect } from 'react';
import { api } from '@/lib/api';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export const useWebPush = () => {
  useEffect(() => {
    let isMounted = true;

    const subscribeToPush = async () => {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.warn('Push messaging is not supported');
        return;
      }

      try {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          console.warn('Push notification permission denied');
          return;
        }

        const registration = await navigator.serviceWorker.ready;
        
        let subscription = await registration.pushManager.getSubscription();
        
        if (!subscription) {
          // Fetch the public VAPID key from backend
          const res = await api.get('/delivery/profile/vapid-key');
          const publicVapidKey = res.data.publicKey;
          
          if (!publicVapidKey) return;

          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
          });
        }

        if (isMounted) {
          console.log('Web Push Subscription successful:', subscription);
          // Send subscription to backend
          await api.post('/delivery/profile/fcm-token', { token: JSON.stringify(subscription) });
        }
      } catch (error) {
        console.error('Failed to subscribe to web push:', error);
      }
    };

    subscribeToPush();

    return () => {
      isMounted = false;
    };
  }, []);
};
