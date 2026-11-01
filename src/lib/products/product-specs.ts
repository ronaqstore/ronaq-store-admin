import type { ProductDTO } from '@/lib/api/types';

export function formatPtaStatus(status?: string | null): string | null {
  if (!status) return null;
  switch (status.toUpperCase()) {
    case 'PTA_APPROVED':
      return 'PTA Approved';
    case 'NON_PTA':
      return 'Non PTA';
    case 'JV':
      return 'JV';
    case 'BYPASS':
      return 'Bypass';
    case 'MDM_BYPASS':
      return 'MDM Bypass';
    default:
      return status.replaceAll('_', ' ');
  }
}

export function formatAuthenticity(authenticity?: string | null): string | null {
  if (!authenticity) return null;
  switch (authenticity.toUpperCase()) {
    case 'ORIGINAL':
      return 'Original';
    case 'COPY':
      return 'Copy';
    default:
      return authenticity;
  }
}

export function getProductSpecBadges(product?: Partial<ProductDTO> | null): string[] {
  if (!product) return [];

  const badges: string[] = [];

  const ram = product.ram?.trim();
  const storage = product.storage?.trim();
  if (ram && storage) {
    badges.push(`${ram} / ${storage}`);
  } else if (storage) {
    badges.push(storage);
  } else if (ram) {
    badges.push(`${ram} RAM`);
  }

  if (product.color?.trim()) {
    badges.push(product.color.trim());
  }

  const pta = formatPtaStatus(product.ptaStatus);
  if (pta) {
    badges.push(pta);
  }

  const auth = formatAuthenticity(product.authenticity);
  if (auth) {
    badges.push(auth);
  }

  return badges;
}
