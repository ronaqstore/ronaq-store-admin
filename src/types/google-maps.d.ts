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

interface GoogleMapsAutocomplete {
  addListener(eventName: string, handler: () => void): void;
  getPlace(): GoogleMapsPlaceResult;
}

interface GoogleMapsAutocompleteOptions {
  componentRestrictions?: { country: string | string[] };
  fields?: string[];
  types?: string[];
  bounds?: unknown;
  strictBounds?: boolean;
}

interface GoogleMapsNamespace {
  maps: {
    places: {
      Autocomplete: new (
        inputField: HTMLInputElement,
        opts?: GoogleMapsAutocompleteOptions
      ) => GoogleMapsAutocomplete;
    };
    event: {
      clearInstanceListeners: (instance: GoogleMapsAutocomplete) => void;
    };
    LatLngBounds: new (
      sw?: { lat: number; lng: number },
      ne?: { lat: number; lng: number }
    ) => unknown;
  };
}

interface Window {
  google?: GoogleMapsNamespace;
}
