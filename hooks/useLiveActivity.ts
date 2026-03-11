import { useEffect, useRef, useState, useCallback } from 'react';

export interface LiveActivityState {
  active: boolean;
  restTimer: number | null;      // seconds remaining
  restTotal: number;             // total rest duration for arc
  elapsedSeconds: number;        // session elapsed
  exerciseName: string;
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

// NoSleep: keeps screen awake via a looping invisible video trick
let wakeLockVideo: HTMLVideoElement | null = null;
const enableNoSleep = () => {
  if (wakeLockVideo) return;
  try {
    // Prefer WakeLock API (Chrome 84+, iOS 16.4+ in PWA)
    if ('wakeLock' in navigator) {
      (navigator as any).wakeLock.request('screen').catch(() => {});
      return;
    }
    // Fallback: silent looping video (iOS < 16.4)
    wakeLockVideo = document.createElement('video');
    wakeLockVideo.setAttribute('playsinline', 'true');
    wakeLockVideo.setAttribute('muted', 'true');
    wakeLockVideo.setAttribute('loop', 'true');
    // 1x1 transparent mp4 data URI
    wakeLockVideo.src = 'data:video/mp4;base64,AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDEAAAAIZnJlZQAAA6dtZGF0AAACrgYF//+q3EXpvebZSLeWLNgg2SPu73gyNjQgLSBjb3JlIDE1NSByMjkxNyAwYTg0ZDk4IC0gSC4yNjQvTVBFRy00IEFWQyBjb2RlYyAtIENvcHlsZWZ0IDIwMDMtMjAxOCAtIGh0dHA6Ly93d3cudmlkZW9sYW4ub3JnL3gyNjQuaHRtbCAtIG9wdGlvbnM6IGNhYmFjPTEgcmVmPTMgZGVibG9jaz0xOjA6MCBhbmFseXNlPTB4MzoweDExMyBtZT1oZXggc3VibWU9NyBwc3k9MSBwc3lfcmQ9MS4wMDowLjAwIG1peGVkX3JlZj0xIG1lX3JhbmdlPTE2IGNocm9tYV9tZT0xIHRyZWxsaXM9MSA4eDhkY3Q9MSBjcW09MCBkZWFkem9uZT0yMSwxMSBmYXN0X3Bza2lwPTEgY2hyb21hX3FwX29mZnNldD0tMiB0aHJlYWRzPTMgbG9va2FoZWFkX3RocmVhZHM9MSBzbGljZWRfdGhyZWFkcz0wIG5yPTAgZGVjaW1hdGU9MSBpbnRlcmxhY2VkPTAgYmx1cmF5X2NvbXBhdD0wIGNvbnN0cmFpbmVkX2ludHJhPTAgYmZyYW1lcz0zIGJfcHlyYW1pZD0yIGJfYWRhcHQ9MSBiX2JpYXM9MCBkaXJlY3Q9MSB3ZWlnaHRiPTEgb3Blbl9nb3A9MCB3ZWlnaHRwPTIga2V5aW50PTI1MCBrZXlpbnRfbWluPTI1IHNjZW5lY3V0PTQwIGludHJhX3JlZnJlc2g9MCByY19sb29rYWhlYWQ9NDAgcmM9Y3JmIG1idHJlZT0xIGNyZj0yMy4wIHFjb21wPTAuNjAgcXBtaW49MCBxcG1heD02OSBxcHN0ZXA9NCBpcF9yYXRpbz0xLjQwIGFxPTE6MS4wMACAAAAPZWxpYnggABD/ynpgIhGd';    wakeLockVideo.play().catch(() => {});
    document.body.appendChild(wakeLockVideo);
    wakeLockVideo.style.position = 'fixed';
    wakeLockVideo.style.opacity = '0.001';
    wakeLockVideo.style.width = '1px';
    wakeLockVideo.style.height = '1px';
    wakeLockVideo.style.pointerEvents = 'none';
    wakeLockVideo.style.zIndex = '-1';
  } catch (_) {}
};

const disableNoSleep = () => {
  if (wakeLockVideo) {
    wakeLockVideo.pause();
    wakeLockVideo.remove();
    wakeLockVideo = null;
  }
};

const LIVE_ACTIVITY_EVENT = 'live-activity-update';

// Broadcast helpers — Workout.tsx dispatches these
export const dispatchLiveActivity = (patch: Partial<LiveActivityState>) => {
  window.dispatchEvent(new CustomEvent(LIVE_ACTIVITY_EVENT, { detail: patch }));
};

export const useLiveActivity = () => {
  const [state, setState] = useState<LiveActivityState>(DEFAULT_STATE);

  useEffect(() => {
    const handler = (e: Event) => {
      const patch = (e as CustomEvent<Partial<LiveActivityState>>).detail;
      setState(prev => ({ ...prev, ...patch }));

      // NoSleep management
      if (patch.sessionState === 'active') enableNoSleep();
      if (patch.sessionState === 'finished' || patch.sessionState === 'idle') disableNoSleep();
    };
    window.addEventListener(LIVE_ACTIVITY_EVENT, handler);
    return () => window.removeEventListener(LIVE_ACTIVITY_EVENT, handler);
  }, []);

  // Sync SW ticks back into state
  useEffect(() => {
    const onSWMessage = (e: MessageEvent) => {
      if (e.data?.type === 'REST_TIMER_TICK') {
        setState(prev => ({ ...prev, restTimer: e.data.remaining }));
      }
    };
    navigator.serviceWorker?.addEventListener('message', onSWMessage);
    return () => navigator.serviceWorker?.removeEventListener('message', onSWMessage);
  }, []);

  return state;
};
