import { env } from '@/config/env';
import { GOOGLE_GEOCODE_API_BASE } from '@/constants/api';

type GeocodeAddressComponent = {
  long_name: string;
  short_name: string;
  types: string[];
};

type GeocodeApiResult = {
  place_id?: string;
  formatted_address?: string;
  address_components?: GeocodeAddressComponent[];
  geometry?: { location?: { lat: number; lng: number } };
};

type GeocodeApiResponse = {
  status: string;
  error_message?: string;
  results?: GeocodeApiResult[];
};

export type GeocodePlace = {
  placeId: string;
  label: string;
  latitude: number;
  longitude: number;
  city: string | null;
};

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
  if (!key) throw new Error('Missing NEXT_PUBLIC_GOOGLE_MAPS_API_KEY');

  params.set('key', key);
  params.set('language', 'en');
  params.set('region', 'pk');

  const res = await fetch(`${GOOGLE_GEOCODE_API_BASE}?${params.toString()}`);
  if (!res.ok) throw new Error(`Geocode HTTP ${res.status}`);

  const data = (await res.json()) as GeocodeApiResponse;
  if (data.status === 'ZERO_RESULTS') return [];
  if (data.status !== 'OK' || !data.results?.length) {
    throw new Error(data.error_message || `Geocode ${data.status}`);
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
