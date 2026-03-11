import { useEffect, useRef } from 'react';

/**
 * Prevents the screen from sleeping while `active` is true.
 * Uses the Screen Wake Lock API (supported in iOS 16.4+ PWA and modern Android).
 * Falls back silently on unsupported browsers.
 */
export const useNoSleep = (active: boolean) => {
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  const acquire = async () => {
    if (!('wakeLock' in navigator)) return;
    try {
      wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
    } catch {
      // Permission denied or not supported — fail silently
    }
  };

  const release = async () => {
    if (wakeLockRef.current) {
      try { await wakeLockRef.current.release(); } catch { /* ignore */ }
      wakeLockRef.current = null;
    }
  };

  useEffect(() => {
    if (active) {
      acquire();
    } else {
      release();
    }
    return () => { release(); };
  }, [active]);

  // Re-acquire after page visibility change (iOS releases wake lock on background)
  useEffect(() => {
    const handleVisibility = () => {
      if (active && document.visibilityState === 'visible') acquire();
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [active]);
};
