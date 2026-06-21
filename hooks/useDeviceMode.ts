import { useState, useEffect } from 'react';

export type DeviceMode = 'mobile' | 'desktop';

export function useDeviceMode(): DeviceMode {
  const [mode, setMode] = useState<DeviceMode>(
    () => (typeof window !== 'undefined' && window.innerWidth >= 1024 ? 'desktop' : 'mobile')
  );

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const handler = (e: MediaQueryListEvent) =>
      setMode(e.matches ? 'desktop' : 'mobile');
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return mode;
}
