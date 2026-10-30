export type GeocodeAddressComponent = {
  long_name: string;
  short_name: string;
  types: string[];
};

export type GeocodeApiResult = {
  place_id?: string;
  formatted_address?: string;
  address_components?: GeocodeAddressComponent[];
  geometry?: { location?: { lat: number; lng: number } };
};

export type GeocodeApiResponse = {
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
