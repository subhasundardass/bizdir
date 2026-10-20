import { useCallback, useEffect, useRef, useState } from 'react';

type Coordinates = { lat: number; lng: number };

export function useSearchLocation() {
  const [coordinates, setCoordinates] = useState<Coordinates>();
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'unavailable'>('idle');
  const mounted = useRef(false);
  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setStatus('unavailable');
      return;
    }
    setStatus('loading');
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        if (!mounted.current) return;
        setCoordinates({ lat: coords.latitude, lng: coords.longitude });
        setStatus('ready');
      },
      () => {
        if (mounted.current) setStatus('unavailable');
      },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 }
    );
  }, []);
  useEffect(() => {
    mounted.current = true;
    requestLocation();
    return () => {
      mounted.current = false;
    };
  }, [requestLocation]);
  return { coordinates, status, requestLocation };
}
