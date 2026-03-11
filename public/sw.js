// ─── Service Worker — Rutina-G ────────────────────────────────────────────────
// Handles background rest timer so countdown continues even when app is hidden.

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

// Active timer state
let restTimerInterval = null;
let restEndsAt = 0; // absolute epoch ms

const clearRestTimer = () => {
  if (restTimerInterval) { clearInterval(restTimerInterval); restTimerInterval = null; }
};

const broadcastToClients = async (msg) => {
  const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
  clients.forEach(c => c.postMessage(msg));
};

self.addEventListener('message', (event) => {
  const data = event.data;
  if (!data) return;

  // ── Start a new background rest timer ──────────────────────────────────────
  if (data.type === 'START_REST_TIMER') {
    clearRestTimer();
    const { seconds } = data;
    restEndsAt = Date.now() + seconds * 1000;

    restTimerInterval = setInterval(async () => {
      const remaining = Math.max(0, Math.round((restEndsAt - Date.now()) / 1000));
      // Broadcast tick to all open clients so they can sync their UI
      await broadcastToClients({ type: 'REST_TIMER_TICK', remaining });

      if (remaining <= 0) {
        clearRestTimer();
        // Fire notification
        self.registration.showNotification('¡Descanso terminado!', {
          body: 'Prepárate para la siguiente serie 💪',
          icon: '/icons/icon-192.png',
          badge: '/icons/icon-96.png',
          tag: 'rest-timer',
          renotify: true,
          silent: false,
          vibrate: [200, 100, 200, 100, 400],
          data: { url: '/' },
          actions: [
            { action: 'open', title: 'Abrir app' }
          ]
        });
      }
    }, 1000);
  }

  // ── Cancel rest timer (set completed early) ─────────────────────────────────
  if (data.type === 'CANCEL_REST_TIMER') {
    clearRestTimer();
  }

  // ── Legacy: one-shot notification (keep for backwards compat) ───────────────
  if (data.type === 'SCHEDULE_NOTIFICATION') {
    const { title, options, delay } = data;
    setTimeout(() => self.registration.showNotification(title, options), delay);
  }
});

// ── Notification click: focus or open the app ───────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
      const existing = clients.find(c => c.url.includes(self.location.origin));
      if (existing) { existing.focus(); existing.navigate(targetUrl); }
      else self.clients.openWindow(targetUrl);
    })
  );
});
