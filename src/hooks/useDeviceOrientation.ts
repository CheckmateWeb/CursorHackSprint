import { useCallback, useEffect, useState } from 'react';

export interface DeviceOrientationState {
  alpha: number;
  beta: number;
  gamma: number;
  supported: boolean;
  permission: 'granted' | 'denied' | 'prompt' | 'unknown';
}

const defaultOrientation: DeviceOrientationState = {
  alpha: 0,
  beta: 0,
  gamma: 0,
  supported: false,
  permission: 'unknown',
};

export function useDeviceOrientation(enabled: boolean) {
  const [orientation, setOrientation] = useState<DeviceOrientationState>(defaultOrientation);
  const [mouseFallback, setMouseFallback] = useState({ x: 0, y: 0 });

  const requestPermission = useCallback(async (): Promise<boolean> => {
    const DOE = DeviceOrientationEvent as typeof DeviceOrientationEvent & {
      requestPermission?: () => Promise<'granted' | 'denied'>;
    };
    if (typeof DOE.requestPermission === 'function') {
      try {
        const result = await DOE.requestPermission();
        const granted = result === 'granted';
        setOrientation((o) => ({ ...o, permission: granted ? 'granted' : 'denied' }));
        return granted;
      } catch {
        setOrientation((o) => ({ ...o, permission: 'denied' }));
        return false;
      }
    }
    setOrientation((o) => ({ ...o, permission: 'granted' }));
    return true;
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const supported =
      typeof window !== 'undefined' &&
      ('DeviceOrientationEvent' in window || 'ondeviceorientation' in window);

    setOrientation((o) => ({ ...o, supported }));

    const onOrient = (e: DeviceOrientationEvent) => {
      if (e.alpha == null || e.beta == null || e.gamma == null) return;
      setOrientation((o) => ({
        ...o,
        alpha: e.alpha ?? 0,
        beta: e.beta ?? 0,
        gamma: e.gamma ?? 0,
        supported: true,
        permission: o.permission === 'unknown' ? 'granted' : o.permission,
      }));
    };

    window.addEventListener('deviceorientation', onOrient, true);
    return () => window.removeEventListener('deviceorientation', onOrient, true);
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    const onMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 60;
      const y = (e.clientY / window.innerHeight - 0.5) * 40;
      setMouseFallback({ x, y });
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, [enabled]);

  return { orientation, mouseFallback, requestPermission };
}
