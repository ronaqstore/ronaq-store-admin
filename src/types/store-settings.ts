export interface StoreSettingsDTO {
  shopId: string;
  slug: string;
  isEnabled: boolean;
  displayName: string;
  about?: string | null;
  logoUrl?: string | null;
  bannerUrl?: string | null;
  whatsappNumber?: string | null;
  phoneNumber?: string | null;
  address?: string | null;
  city?: string | null;
  googleMapsUrl?: string | null;
  openingHours?: string | null;
  facebookUrl?: string | null;
  instagramUrl?: string | null;
  showExactStock: boolean;
}

export interface UpdateStoreSettingsInput {
  isEnabled?: boolean;
  displayName?: string;
  about?: string | null;
  whatsappNumber?: string | null;
  phoneNumber?: string | null;
  address?: string | null;
  city?: string | null;
  googleMapsUrl?: string | null;
  openingHours?: string | null;
  facebookUrl?: string | null;
  instagramUrl?: string | null;
  showExactStock?: boolean;
}

export interface EditStoreProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: StoreSettingsDTO;
}

export interface EditStoreProfileDialogBodyProps {
  onOpenChange: (open: boolean) => void;
  settings: StoreSettingsDTO;
}

export interface StoreProfileDetailRow {
  label: string;
  value: string;
}
