export function formatUnitImeiLabel(imei1: string, imei2?: string | null): string {
  return imei2?.trim() ? `${imei1} · ${imei2.trim()}` : imei1;
}
