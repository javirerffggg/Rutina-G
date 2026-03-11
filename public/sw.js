// ─── Service Worker — Rutina-G ────────────────────────────────────────────────
// Handles background rest timer + rich push notification when done.

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

// Active timer state
let restTimerInterval = null;
let restEndsAt = 0;
let currentExerciseName = '';

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

  // ── Start / restart rest timer ──────────────────────────────────────────────
  if (data.type === 'START_REST_TIMER') {
    clearRestTimer();
    const { seconds, exerciseName } = data;
    restEndsAt = Date.now() + seconds * 1000;
    currentExerciseName = exerciseName || '';

    restTimerInterval = setInterval(async () => {
      const remaining = Math.max(0, Math.round((restEndsAt - Date.now()) / 1000));
      await broadcastToClients({ type: 'REST_TIMER_TICK', remaining });

      if (remaining <= 0) {
        clearRestTimer();
        const notifOptions = {
          body: currentExerciseName
            ? `Siguiente: ${currentExerciseName} 💪`
            : 'Prepárate para la siguiente serie 💪',
          icon: '/icons/icon-192.png',
          badge: '/icons/icon-96.png',
          tag: 'rest-timer',
          renotify: true,
          silent: false,
          vibrate: [200, 100, 200, 100, 400],
          data: { url: '/' },
          actions: [
            { action: 'open',   title: '💪 Volver al entreno' },
            { action: 'skip',   title: '⏭ Saltar' }
          ]
        };
        self.registration.showNotification('¡Descanso terminado!', notifOptions);
      }
    }, 1000);
  }

  // ── Add seconds ─────────────────────────────────────────────────────────────
  if (data.type === 'ADD_REST_SECONDS') {
    restEndsAt += (data.seconds || 30) * 1000;
  }

  // ── Cancel ──────────────────────────────────────────────────────────────────
  if (data.type === 'CANCEL_REST_TIMER') {
    clearRestTimer();
    broadcastToClients({ type: 'REST_TIMER_TICK', remaining: null });
  }

  // ── Legacy (keep for back-compat) ────────────────────────────────────────────
  if (data.type === 'SCHEDULE_NOTIFICATION') {
    const { title, options, delay } = data;
    setTimeout(() => self.registration.showNotification(title, options), delay);
  }
});

// ── Notification click ────────────────────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const action    = event.action;
  const targetUrl = event.notification.data?.url || '/';

  // 'skip' action: just close the notification, timer already done
  if (action === 'skip') return;

  // 'open' action or tap: bring app to foreground
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
      const existing = clients.find(c => c.url.includes(self.location.origin));
      if (existing) { existing.focus(); existing.navigate(targetUrl); }
      else self.clients.openWindow(targetUrl);
    })
  );
});
