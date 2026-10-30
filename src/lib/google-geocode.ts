import { env } from '@/config/env';
import { GOOGLE_GEOCODE_API_BASE } from '@/constants/api';
import { AppError } from '@/lib/errors';
import type {
  GeocodeAddressComponent,
  GeocodeApiResponse,
  GeocodeApiResult,
  GeocodePlace
} from '@/types/geocode';

export type { GeocodePlace } from '@/types/geocode';

export function getGoogleMapsApiKey(): string {
  return env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() ?? '';
}

function cityFromComponents(components: GeocodeAddressComponent[] | undefined): string | null {
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

function mapResult(result: GeocodeApiResult, index: number): GeocodePlace | null {
  const lat = result.geometry?.location?.lat;
  const lng = result.geometry?.location?.lng;
  const label = result.formatted_address?.trim();
  if (lat == null || lng == null || !Number.isFinite(lat) || !Number.isFinite(lng) || !label) {
    return null;
  }
  return {
    placeId: result.place_id?.trim() || `geocode-${index}-${lat},${lng}`,
    label,
    latitude: lat,
    longitude: lng,
    city: cityFromComponents(result.address_components)
  };
}

async function fetchGeocode(params: URLSearchParams): Promise<GeocodePlace[]> {
  const key = getGoogleMapsApiKey();
  if (!key) throw new AppError('Missing NEXT_PUBLIC_GOOGLE_MAPS_API_KEY');

  params.set('key', key);
  params.set('language', 'en');
  params.set('region', 'pk');

  const res = await fetch(`${GOOGLE_GEOCODE_API_BASE}?${params.toString()}`);
  if (!res.ok) throw new AppError(`Geocode HTTP ${res.status}`);

  const data = (await res.json()) as GeocodeApiResponse;
  if (data.status === 'ZERO_RESULTS') return [];
  if (data.status !== 'OK' || !data.results?.length) {
    throw new AppError(data.error_message || `Geocode ${data.status}`);
  }

  return data.results
    .map((result, index) => mapResult(result, index))
    .filter((place): place is GeocodePlace => place != null);
}

export function geocodeAddress(query: string): Promise<GeocodePlace[]> {
  const params = new URLSearchParams({
    address: query.trim(),
    components: 'country:PK'
  });
  return fetchGeocode(params);
}

export function reverseGeocode(lat: number, lng: number): Promise<GeocodePlace[]> {
  const params = new URLSearchParams({
    latlng: `${lat},${lng}`
  });
  return fetchGeocode(params);
}
