self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SCHEDULE_NOTIFICATION') {
    const { title, options, delay } = event.data;
    
    // Note: setTimeout in Service Workers is not guaranteed to fire exactly on time 
    // if the SW is terminated by the browser to save battery.
    // However, it's more reliable than the main thread when the app is backgrounded.
    setTimeout(() => {
      self.registration.showNotification(title, options);
    }, delay);
  }
});
