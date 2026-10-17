export function isPreviewableImageSrc(src?: string | null): src is string {
  const value = src?.trim();
  if (!value) return false;
  if (value.includes('/placeholders/')) return false;
  return true;
}
