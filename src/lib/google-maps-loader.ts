import { env } from '@/config/env';
import { googleMapsJsApiUrl } from '@/constants/api';

let mapsLoadPromise: Promise<GoogleMapsNamespace> | null = null;

export function getGoogleMapsApiKey(): string {
  return env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() ?? '';
}

export function loadGoogleMapsPlaces(): Promise<GoogleMapsNamespace> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Google Maps is browser-only'));
  }
  if (window.google?.maps?.places) {
    return Promise.resolve(window.google);
  }
  if (mapsLoadPromise) return mapsLoadPromise;

  const key = getGoogleMapsApiKey();
  if (!key) {
    return Promise.reject(new Error('Missing NEXT_PUBLIC_GOOGLE_MAPS_API_KEY'));
  }

  mapsLoadPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-ronaq-google-maps="1"]'
    );
    if (existing) {
      existing.addEventListener('load', () => {
        if (window.google?.maps?.places) resolve(window.google);
        else reject(new Error('Google Maps failed to load'));
      });
      existing.addEventListener('error', () =>
        reject(new Error('Google Maps failed to load'))
      );
      return;
    }

    const script = document.createElement('script');
    script.dataset.ronaqGoogleMaps = '1';
    script.async = true;
    script.defer = true;
    script.src = googleMapsJsApiUrl(key);
    script.onload = () => {
      if (window.google?.maps?.places) resolve(window.google);
      else reject(new Error('Google Maps Places unavailable'));
    };
    script.onerror = () => reject(new Error('Google Maps failed to load'));
    document.head.appendChild(script);
  });

  return mapsLoadPromise;
}

export function cityFromPlaceComponents(
  components: GoogleMapsPlaceResult['address_components']
): string | null {
  if (!components?.length) return null;
  const byType = (type: string) =>
    components.find((c) => c.types.includes(type))?.long_name?.trim() || null;

  return (
    byType('locality') ||
    byType('administrative_area_level_2') ||
    byType('administrative_area_level_3') ||
    byType('sublocality') ||
    byType('sublocality_level_1') ||
    null
  );
}
