export const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000').replace(
  /\/+$/,
  ''
);

export const APP_BASE_URL =
  typeof window !== 'undefined'
    ? ''
    : (process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3006').replace(/\/+$/, '');

export const GOOGLE_MAPS_JS_API_BASE = 'https://maps.googleapis.com/maps/api/js';
export const GOOGLE_MAPS_SEARCH_BASE = 'https://www.google.com/maps/search/';

export const TURNSTILE_SCRIPT_URL =
  'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
export const TURNSTILE_SITEVERIFY_URL =
  'https://challenges.cloudflare.com/turnstile/v0/siteverify';

export function googleMapsJsApiUrl(apiKey: string): string {
  return `${GOOGLE_MAPS_JS_API_BASE}?key=${encodeURIComponent(apiKey)}&libraries=places&language=en&region=PK`;
}

export function googleMapsSearchUrl(lat: number, lng: number): string {
  return `${GOOGLE_MAPS_SEARCH_BASE}?api=1&query=${lat},${lng}`;
}
