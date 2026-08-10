import { useEffect } from 'react';
import { requestNotificationPermission, onForegroundMessage } from '../lib/firebase';
import { mutate } from 'swr';
import { api } from '../lib/api';

import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { triggerHaptic } from '../lib/haptics';

export const useFCM = () => {
  useEffect(() => {
    const setupFCM = async () => {
      try {
        let token = null;
        if (Capacitor.isNativePlatform()) {
          const permStatus = await PushNotifications.requestPermissions();
          if (permStatus.receive === 'granted') {
            await PushNotifications.register();
            PushNotifications.addListener('registration', async (fcmToken) => {
              console.log('Native FCM Token:', fcmToken.value);
              const authToken = typeof window !== 'undefined' ? localStorage.getItem('swaddo_merchant_token') : null;
              if (authToken) {
                await api.post('/auth/fcm-token', { token: fcmToken.value }).catch(() => {});
              }
            });
            PushNotifications.addListener('pushNotificationReceived', (notification) => {
              triggerHaptic('success'); // Vibrate for new order
              mutate('/orders?limit=100');
              mutate('/stalls/merchant/stats');
              // REMOVED alert to prevent "undefined undefined"
            });
            return;
          }
        } else {
          token = await requestNotificationPermission();
        }

        if (token) {
          console.log('Web FCM Token:', token);
          const authToken = typeof window !== 'undefined' ? localStorage.getItem('swaddo_merchant_token') : null;
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
      mutate('/orders?limit=100');
      mutate('/stalls/merchant/stats');
      if (payload.notification) {
        if ('Notification' in window && Notification.permission === 'granted') {
           new Notification(payload.notification.title, { body: payload.notification.body });
        }
      }
    });

    const handleSWMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'BACKGROUND_NEW_ORDER') {
        console.log('Woken up by background SW message!');
        mutate('/orders?limit=100');
        mutate('/stalls/merchant/stats');
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
