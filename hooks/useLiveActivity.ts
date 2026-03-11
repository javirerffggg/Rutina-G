import { useEffect, useRef, useState } from 'react';

export interface LiveActivityState {
  active: boolean;
  restTimer: number | null;      // seconds remaining (null = not resting)
  restTotal: number;             // total rest duration for arc progress
  elapsedSeconds: number;        // session elapsed time
  exerciseName: string;          // current exercise label
  setsCompleted: number;
  setsTotal: number;
  sessionState: 'idle' | 'active' | 'finished';
}

const DEFAULT_STATE: LiveActivityState = {
  active: false,
  restTimer: null,
  restTotal: 90,
  elapsedSeconds: 0,
  exerciseName: '',
  setsCompleted: 0,
  setsTotal: 0,
  sessionState: 'idle',
};

// ── Screen Wake Lock ──────────────────────────────────────────────────────────
// Keeps the screen awake during an active workout session.
// Prefers the native WakeLock API (iOS 16.4+ PWA, Chrome 84+).
// Falls back to a silent looping video element for older iOS.

let wakeLockSentinel: any = null;
let wakeLockVideo: HTMLVideoElement | null = null;

const enableNoSleep = async () => {
  // WakeLock API path
  if ('wakeLock' in navigator) {
    try {
      wakeLockSentinel = await (navigator as any).wakeLock.request('screen');
      // Re-acquire if the page becomes visible again after losing the lock
      document.addEventListener('visibilitychange', async () => {
        if (document.visibilityState === 'visible' && wakeLockSentinel === null) {
          try { wakeLockSentinel = await (navigator as any).wakeLock.request('screen'); } catch (_) {}
        }
      }, { once: false });
      return;
    } catch (_) { /* fall through to video trick */ }
  }

  // Video trick fallback (iOS < 16.4)
  if (wakeLockVideo) return;
  wakeLockVideo = document.createElement('video');
  wakeLockVideo.setAttribute('playsinline', 'true');
  wakeLockVideo.setAttribute('muted', 'true');
  wakeLockVideo.setAttribute('loop', 'true');
  // 1×1 transparent mp4
  wakeLockVideo.src = 'data:video/mp4;base64,AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDEAAAAIZnJlZQAAA6dtZGF0AAACrgYF//+q3EXpvebZSLeWLNgg2SPu73gyNjQgLSBjb3JlIDE1NSByMjkxNyAwYTg0ZDk4IC0gSC4yNjQvTVBFRy00IEFWQyBjb2RlYyAtIENvcHlsZWZ0IDIwMDMtMjAxOCAtIGh0dHA6Ly93d3cudmlkZW9sYW4ub3JnL3gyNjQuaHRtbCAtIG9wdGlvbnM6IGNhYmFjPTEgcmVmPTMgZGVibG9jaz0xOjA6MCBhbmFseXNlPTB4MzoweDExMyBtZT1oZXggc3VibWU9NyBwc3k9MSBwc3lfcmQ9MS4wMDowLjAwIG1peGVkX3JlZj0xIG1lX3JhbmdlPTE2IGNocm9tYV9tZT0xIHRyZWxsaXM9MSA4eDhkY3Q9MSBjcW09MCBkZWFkem9uZT0yMSwxMSBmYXN0X3Bza2lwPTEgY2hyb21hX3FwX29mZnNldD0tMiB0aHJlYWRzPTMgbG9va2FoZWFkX3RocmVhZHM9MSBzbGljZWRfdGhyZWFkcz0wIG5yPTAgZGVjaW1hdGU9MSBpbnRlcmxhY2VkPTAgYmx1cmF5X2NvbXBhdD0wIGNvbnN0cmFpbmVkX2ludHJhPTAgYmZyYW1lcz0zIGJfcHlyYW1pZD0yIGJfYWRhcHQ9MSBiX2JpYXM9MCBkaXJlY3Q9MSB3ZWlnaHRiPTEgb3Blbl9nb3A9MCB3ZWlnaHRwPTIga2V5aW50PTI1MCBrZXlpbnRfbWluPTI1IHNjZW5lY3V0PTQwIGludHJhX3JlZnJlc2g9MCByY19sb29rYWhlYWQ9NDAgcmM9Y3JmIG1idHJlZT0xIGNyZj0yMy4wIHFjb21wPTAuNjAgcXBtaW49MCBxcG1heD02OSBxcHN0ZXA9NCBpcF9yYXRpbz0xLjQwIGFxPTE6MS4wMACAAAAPZWxpYnggABD/ynpgIhGd';
  try { await wakeLockVideo.play(); } catch (_) {}
  Object.assign(wakeLockVideo.style, {
    position: 'fixed', opacity: '0.001', width: '1px',
    height: '1px', pointerEvents: 'none', zIndex: '-1',
  });
  document.body.appendChild(wakeLockVideo);
};

const disableNoSleep = () => {
  if (wakeLockSentinel) {
    try { wakeLockSentinel.release(); } catch (_) {}
    wakeLockSentinel = null;
  }
  if (wakeLockVideo) {
    wakeLockVideo.pause();
    wakeLockVideo.remove();
    wakeLockVideo = null;
  }
};

// ── Live Activity event bus ───────────────────────────────────────────────────
const LIVE_ACTIVITY_EVENT = 'live-activity-update';

/** Called from Workout.tsx to push state patches to the pill */
export const dispatchLiveActivity = (patch: Partial<LiveActivityState>) => {
  window.dispatchEvent(new CustomEvent(LIVE_ACTIVITY_EVENT, { detail: patch }));
};

export const useLiveActivity = () => {
  const [state, setState] = useState<LiveActivityState>(DEFAULT_STATE);

  // Listen to dispatched patches
  useEffect(() => {
    const handler = (e: Event) => {
      const patch = (e as CustomEvent<Partial<LiveActivityState>>).detail;
      setState(prev => ({ ...prev, ...patch }));

      // Drive NoSleep from session state changes
      if (patch.sessionState === 'active') enableNoSleep();
      if (patch.sessionState === 'finished' || patch.sessionState === 'idle') disableNoSleep();
    };
    window.addEventListener(LIVE_ACTIVITY_EVENT, handler);
    return () => window.removeEventListener(LIVE_ACTIVITY_EVENT, handler);
  }, []);

  // Sync SW background ticks into state
  useEffect(() => {
    const onSWMessage = (e: MessageEvent) => {
      if (e.data?.type === 'REST_TIMER_TICK') {
        const remaining: number | null = e.data.remaining;
        setState(prev => ({ ...prev, restTimer: remaining }));
      }
    };
    navigator.serviceWorker?.addEventListener('message', onSWMessage);
    return () => navigator.serviceWorker?.removeEventListener('message', onSWMessage);
  }, []);

  // Listen to Layout dismiss/addRest events and relay to SW
  useEffect(() => {
    const onDismiss = () => {
      setState(prev => ({ ...prev, restTimer: null }));
      navigator.serviceWorker?.controller?.postMessage({ type: 'CANCEL_REST_TIMER' });
    };
    const onAdd = () => {
      setState(prev => ({
        ...prev,
        restTimer: prev.restTimer !== null ? prev.restTimer + 30 : 30,
        restTotal: prev.restTotal + 30,
      }));
      navigator.serviceWorker?.controller?.postMessage({ type: 'ADD_REST_SECONDS', seconds: 30 });
    };
    window.addEventListener('live-activity-dismiss-rest', onDismiss);
    window.addEventListener('live-activity-add-rest', onAdd);
    return () => {
      window.removeEventListener('live-activity-dismiss-rest', onDismiss);
      window.removeEventListener('live-activity-add-rest', onAdd);
    };
  }, []);

  return state;
};
