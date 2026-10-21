interface GoogleMapsLatLng {
  lat(): number;
  lng(): number;
}

interface GoogleMapsPlaceResult {
  formatted_address?: string;
  name?: string;
  geometry?: { location?: GoogleMapsLatLng };
  address_components?: Array<{
    long_name: string;
    short_name: string;
    types: string[];
  }>;
}

interface GoogleMapsAutocompletePrediction {
  description: string;
  place_id: string;
  structured_formatting?: {
    main_text: string;
    secondary_text?: string;
  };
}

interface GoogleMapsAutocompleteService {
  getPlacePredictions(
    request: {
      input: string;
      componentRestrictions?: { country: string | string[] };
      bounds?: unknown;
    },
    callback: (
      predictions: GoogleMapsAutocompletePrediction[] | null,
      status: string
    ) => void
  ): void;
}

interface GoogleMapsPlacesService {
  getDetails(
    request: { placeId: string; fields: string[] },
    callback: (place: GoogleMapsPlaceResult | null, status: string) => void
  ): void;
}

interface GoogleMapsGeocoderResult {
  formatted_address?: string;
}

interface GoogleMapsGeocoder {
  geocode(
    request: { location: { lat: number; lng: number } },
    callback: (
      results: GoogleMapsGeocoderResult[] | null,
      status: string
    ) => void
  ): void;
}

interface GoogleMapsNamespace {
  maps: {
    places: {
      AutocompleteService: new () => GoogleMapsAutocompleteService;
      PlacesService: new (attrContainer: HTMLDivElement) => GoogleMapsPlacesService;
      PlacesServiceStatus: { OK: string };
      AutocompleteSessionToken?: new () => unknown;
    };
    Geocoder: new () => GoogleMapsGeocoder;
    LatLngBounds: new (
      sw?: { lat: number; lng: number },
      ne?: { lat: number; lng: number }
    ) => unknown;
  };
}

interface Window {
  google?: GoogleMapsNamespace;
}
