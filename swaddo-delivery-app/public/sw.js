self.addEventListener('push', function (event) {
  if (event.data) {
    try {
      const data = event.data.json();
      
      const options = {
        body: data.body,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        vibrate: [200, 100, 200, 100, 200, 100, 200],
        data: data.data,
        actions: [
          {
            action: 'open',
            title: 'Open App'
          }
        ],
        requireInteraction: true // Keeps the notification on screen until the user dismisses it
      };

      event.waitUntil(
        self.registration.showNotification(data.title || 'New Order!', options)
      );

      // Tell all open app tabs to play the ringtone!
      event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
          for (let client of windowClients) {
            client.postMessage({ type: 'NEW_ORDER_PUSH', data: data.data });
          }
        })
      );
    } catch (e) {
      console.error('Error parsing push data', e);
    }
  }
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();

  const urlToOpen = new URL('/', self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      let matchingClient = null;

      for (let i = 0; i < windowClients.length; i++) {
        const windowClient = windowClients[i];
        if (windowClient.url === urlToOpen) {
          matchingClient = windowClient;
          break;
        }
      }

      if (matchingClient) {
        // If app is already open, focus it and trigger an internal event
        matchingClient.postMessage({ type: 'PUSH_CLICKED', data: event.notification.data });
        return matchingClient.focus();
      } else {
        // If app is closed, open a new window
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
