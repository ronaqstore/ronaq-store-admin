export const PLACEHOLDER_PRODUCT_IMAGE = '/placeholders/product.svg';
export const PLACEHOLDER_SHOP_LOGO = '/placeholders/shop-logo.svg';

export function productImageSrc(url?: string | null): string {
  return url?.trim() ? url : PLACEHOLDER_PRODUCT_IMAGE;
}

export function shopLogoSrc(url?: string | null): string {
  return url?.trim() ? url : PLACEHOLDER_SHOP_LOGO;
}
