import React, { useEffect, useRef, useState } from 'react';
import { LocateFixed, MapPin, Square } from 'lucide-react';

type TrackerStatus = 'idle' | 'locating' | 'live' | 'error' | 'unsupported';

interface LocationFix {
  latitude: number;
  longitude: number;
  accuracy: number;
}

export const LiveGpsTracker: React.FC = () => {
  const watchId = useRef<number | null>(null);
  const [status, setStatus] = useState<TrackerStatus>('idle');
  const [location, setLocation] = useState<LocationFix | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const stopTracking = () => {
    if (watchId.current !== null && 'geolocation' in navigator) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
    setStatus('idle');
  };

  const startTracking = () => {
    if (!('geolocation' in navigator)) {
      setErrorMessage('Geolocation is not supported by this browser.');
      setStatus('unsupported');
      return;
    }

    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }

    setLocation(null);
    setErrorMessage('');
    setStatus('locating');
    watchId.current = navigator.geolocation.watchPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
        setStatus('live');
      },
      (error) => {
        setErrorMessage(error.message);
        setStatus('error');
        if (error.code === error.PERMISSION_DENIED && watchId.current !== null) {
          navigator.geolocation.clearWatch(watchId.current);
          watchId.current = null;
        }
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 }
    );
  };

  useEffect(() => () => {
    if (watchId.current !== null && 'geolocation' in navigator) {
      navigator.geolocation.clearWatch(watchId.current);
    }
  }, []);

  const isTracking = status === 'locating' || status === 'live';
  const label = status === 'live'
    ? 'GPS Live'
    : status === 'locating'
    ? 'Locating'
    : status === 'unsupported'
    ? 'GPS unavailable'
    : status === 'error'
    ? 'GPS retry'
    : 'Start GPS';
  const dotColor = status === 'live'
    ? 'bg-[#27A163]'
    : status === 'error' || status === 'unsupported'
    ? 'bg-[#C73E3A]'
    : status === 'locating'
    ? 'bg-[#E9A820]'
    : 'bg-[#8A9A90]';

  return (
    <div className="flex min-w-0 items-center gap-2">
      <button
        type="button"
        onClick={isTracking ? stopTracking : startTracking}
        aria-label={isTracking ? 'Stop live GPS tracking' : label}
        title={errorMessage || (location ? `Accuracy ±${Math.round(location.accuracy)} m` : label)}
        className="inline-flex shrink-0 items-center gap-1.5 rounded-[6px] border border-[#DDE9E0] bg-white px-2 py-1.5 text-[11px] font-medium text-[#0C3B2B] transition-colors hover:bg-[#F5FAF6] focus-visible:outline-2 focus-visible:outline-[#13724A] focus-visible:outline-offset-2"
      >
        {isTracking ? <Square className="h-3.5 w-3.5" /> : <LocateFixed className="h-4 w-4" />}
        <span className="hidden sm:inline">{label}</span>
        <span className={`h-2 w-2 rounded-full ${dotColor} ${isTracking ? 'animate-pulse' : ''}`} />
      </button>

      {location && (
        <span className="hidden min-w-0 truncate text-[10px] tabular-nums text-[#5B6B62] xl:inline" title={errorMessage}>
          <MapPin className="mr-1 inline h-3 w-3 text-[#27A163]" />
          {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
        </span>
      )}
    </div>
  );
};