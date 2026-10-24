export interface MarketplaceHubOption {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
}

export interface MarketplaceCityOption {
  id: string;
  name: string;
}

export interface MarketplaceCityComboboxProps {
  id?: string;
  value: string;
  onChange: (city: string) => void;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}
