/** Same label format as stock-adjust IMEI picker: `imei1 · imei2` when both exist. */
export function formatUnitImeiLabel(imei1: string, imei2?: string | null): string {
  return imei2?.trim() ? `${imei1} · ${imei2.trim()}` : imei1;
}
