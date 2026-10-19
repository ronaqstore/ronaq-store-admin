export function isAppleBrandName(brandName: string | null | undefined): boolean {
  return (brandName ?? '').trim().toLowerCase() === 'apple';
}
