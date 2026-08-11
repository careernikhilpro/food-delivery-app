importScripts('https://www.gstatic.com/firebasejs/10.12.3/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.3/firebase-messaging-compat.js');

// IMPORTANT: These values need to be manually replaced by the user after Firebase setup
const firebaseConfig = {
  apiKey: "AIzaSyBM8cWMeSbfQR9vg4G3DAitKSn1ABifKY4",
  authDomain: "swaddo-pwa.firebaseapp.com",
  projectId: "swaddo-pwa",
  storageBucket: "swaddo-pwa.firebasestorage.app",
  messagingSenderId: "1083737771617",
  appId: "1:1083737771617:web:2319df7e88ab29481c2420",
  measurementId: "G-1W29CB12K2"
};

// Check if valid config before initializing to prevent crashes in local dev
if (firebaseConfig.apiKey !== "REPLACE_ME") {
  firebase.initializeApp(firebaseConfig);

  const messaging = firebase.messaging();

  messaging.onBackgroundMessage(function(payload) {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
    
    // Fallback to payload.data since we send data-only pushes for Android Doze wakeups
    const notificationTitle = payload.notification?.title || payload.data?.title || 'New Assignment';
    const notificationOptions = {
      body: payload.notification?.body || payload.data?.body || 'Open app to view details',
      icon: '/icon.192x192.png',
      vibrate: [500, 250, 500, 250, 500, 250, 500, 250, 500], // Intense vibration for new orders
      tag: 'swaddo-rider-new-order',
      renotify: true,
      requireInteraction: true,
      data: payload
      // Actions array removed as requested: rider must open the app to accept/reject
    };

    // Wake up any backgrounded tabs to fetch the new order and ring
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      for (var i = 0; i < clientList.length; i++) {
        var client = clientList[i];
        if ('postMessage' in client) {
           client.postMessage({ type: 'BACKGROUND_NEW_ORDER', payload: payload });
        }
      }
    });

    self.registration.showNotification(notificationTitle, notificationOptions);
  });

  self.addEventListener('notificationclick', function(event) {
    console.log('[firebase-messaging-sw.js] Notification click Received.', event);
    event.notification.close();

    const action = event.action;
    const payload = event.notification.data;

    event.waitUntil(
      self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
        for (var i = 0; i < clientList.length; i++) {
          var client = clientList[i];
          if ('focus' in client) {
            client.focus();
            if (action) {
              client.postMessage({ type: 'NOTIFICATION_ACTION', action: action, payload: payload });
            }
            return;
          }
        }
        if (self.clients.openWindow) {
          // If app was closed, open it. We pass the action in the URL so it can be handled on load
          let url = '/home';
          if (action && payload?.data?.orderId) {
             url = `/home?action=${action}&orderId=${payload.data.orderId}`;
          }
          return self.clients.openWindow(url);
        }
      })
    );
  });
}
