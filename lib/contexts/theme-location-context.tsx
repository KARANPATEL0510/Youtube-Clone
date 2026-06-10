'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';

// ─── Constants ────────────────────────────────────────────────────────────────

/** Indian states considered "South India" for theming & OTP routing. */
export const SOUTH_INDIA_STATES = new Set([
  // Full state names (returned by geocoding APIs)
  'Tamil Nadu',
  'Kerala',
  'Karnataka',
  'Andhra Pradesh',
  'Telangana',
  // Common abbreviations / alternate spellings
  'TN',
  'KL',
  'KA',
  'AP',
  'TG',
  'tamil nadu',
  'kerala',
  'karnataka',
  'andhra pradesh',
  'telangana',
]);

/** IST offset from UTC in minutes */
const IST_OFFSET_MINUTES = 330;

/** Light-theme window: 10:00 AM – 12:00 PM IST */
const LIGHT_WINDOW_START_HOUR = 10;
const LIGHT_WINDOW_END_HOUR = 12;

// ─── Types ────────────────────────────────────────────────────────────────────

export type Theme = 'light' | 'dark';

interface ThemeLocationContextType {
  theme: Theme;
  isSouthIndia: boolean;
  locationLoading: boolean;
  locationError: string | null;
  detectedState: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Returns current hour (0–23) in IST, regardless of user's local timezone. */
function getISTHour(): number {
  const now = new Date();
  // Convert to IST
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60_000;
  const istMs = utcMs + IST_OFFSET_MINUTES * 60_000;
  return new Date(istMs).getHours();
}

/** True when current IST time is within 10:00–12:00 (exclusive of noon). */
function isInLightTimeWindow(): boolean {
  const hour = getISTHour();
  return hour >= LIGHT_WINDOW_START_HOUR && hour < LIGHT_WINDOW_END_HOUR;
}

/** Normalises a state string and checks if it belongs to South India. */
function checkSouthIndia(state: string): boolean {
  if (!state) return false;
  // Try exact set lookup first, then case-insensitive
  if (SOUTH_INDIA_STATES.has(state)) return true;
  const lower = state.trim().toLowerCase();
  return SOUTH_INDIA_STATES.has(lower);
}

// ─── IP-based geolocation (fallback) ─────────────────────────────────────────

interface IpApiResponse {
  status: string;
  regionName?: string;
  region?: string;
}

async function detectStateByIP(): Promise<string | null> {
  try {
    const res = await fetch('https://ip-api.com/json/?fields=status,regionName,region', {
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const data: IpApiResponse = await res.json();
    if (data.status === 'success') {
      return data.regionName || data.region || null;
    }
    return null;
  } catch {
    return null;
  }
}

// ─── GPS-based geolocation ────────────────────────────────────────────────────

interface NominatimResponse {
  address?: {
    state?: string;
    county?: string;
  };
}

async function detectStateByGPS(
  lat: number,
  lon: number
): Promise<string | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`;
    const res = await fetch(url, {
      headers: { 'Accept-Language': 'en' },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const data: NominatimResponse = await res.json();
    return data?.address?.state || null;
  } catch {
    return null;
  }
}

function requestGPSLocation(): Promise<GeolocationCoordinates | null> {
  return new Promise((resolve) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      resolve(null);
      return;
    }
    const timer = setTimeout(() => resolve(null), 7000);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        clearTimeout(timer);
        resolve(pos.coords);
      },
      () => {
        clearTimeout(timer);
        resolve(null);
      },
      { timeout: 6000, maximumAge: 300_000 }
    );
  });
}

// ─── Context ──────────────────────────────────────────────────────────────────

const ThemeLocationContext = createContext<ThemeLocationContextType>({
  theme: 'dark',
  isSouthIndia: false,
  locationLoading: true,
  locationError: null,
  detectedState: null,
});

export function ThemeLocationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSouthIndia, setIsSouthIndia] = useState(false);
  const [detectedState, setDetectedState] = useState<string | null>(null);
  const [locationLoading, setLocationLoading] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [theme, setTheme] = useState<Theme>('dark');

  const detectLocation = useCallback(async () => {
    setLocationLoading(true);
    setLocationError(null);

    try {
      let state: string | null = null;

      // 1. Try GPS + Nominatim reverse-geocode
      const coords = await requestGPSLocation();
      if (coords) {
        state = await detectStateByGPS(coords.latitude, coords.longitude);
      }

      // 2. Fallback to IP-based detection
      if (!state) {
        state = await detectStateByIP();
      }

      setDetectedState(state);

      const southIndia = state ? checkSouthIndia(state) : false;
      setIsSouthIndia(southIndia);

      // Compute theme: light only when South India AND time is 10–12 IST
      const inTimeWindow = isInLightTimeWindow();
      const resolvedTheme: Theme =
        southIndia && inTimeWindow ? 'light' : 'dark';
      setTheme(resolvedTheme);
    } catch (err) {
      setLocationError(
        err instanceof Error ? err.message : 'Location detection failed'
      );
      // Default to dark on error
      setTheme('dark');
    } finally {
      setLocationLoading(false);
    }
  }, []);

  // Apply / remove .dark class on <html>
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  const isSouthIndiaRef = React.useRef(isSouthIndia);
  useEffect(() => {
    isSouthIndiaRef.current = isSouthIndia;
  }, [isSouthIndia]);

  useEffect(() => {
    detectLocation();

    // Re-evaluate the time window every minute (handles crossing the 10/12 boundary)
    const intervalId = setInterval(() => {
      const inTimeWindow = isInLightTimeWindow();
      setTheme(isSouthIndiaRef.current && inTimeWindow ? 'light' : 'dark');
    }, 60_000);

    return () => clearInterval(intervalId);
  }, [detectLocation]);

  return (
    <ThemeLocationContext.Provider
      value={{ theme, isSouthIndia, locationLoading, locationError, detectedState }}
    >
      {children}
    </ThemeLocationContext.Provider>
  );
}

export function useThemeLocation() {
  const ctx = useContext(ThemeLocationContext);
  if (!ctx) {
    throw new Error(
      'useThemeLocation must be used within ThemeLocationProvider'
    );
  }
  return ctx;
}
