/**
 * Result of sanitizing raw barcode text for IMEI fields.
 */
export type SanitizeImeiResult =
  | { success: true; imei: string }
  | { success: false; error: 'empty_scan' | 'too_short' | 'invalid_format'; raw: string };

/**
 * Sanitizes and extracts a strictly valid 15-digit IMEI from raw scanned barcode or QR code strings.
 * Handles common dirty scanner prefixes (e.g., "IMEI:", "IMEI1:", "S/N:"), hyphens, and whitespace.
 */
export function sanitizeImei(raw: unknown): SanitizeImeiResult {
  if (typeof raw !== 'string') {
    return { success: false, error: 'empty_scan', raw: '' };
  }

  const trimmed = raw.trim();
  if (!trimmed) {
    return { success: false, error: 'empty_scan', raw: '' };
  }

  // 1. Direct 15 digits
  if (/^\d{15}$/.test(trimmed)) {
    return { success: true, imei: trimmed };
  }

  // 2. Strip whitespace and non-digit characters except commas/colons (for compound barcodes)
  const noSeparators = trimmed.replace(/[\s\-_]/g, '');
  if (/^\d{15}$/.test(noSeparators)) {
    return { success: true, imei: noSeparators };
  }

  // 3. Match explicit 15-digit word boundary (e.g. "IMEI1: 351234567890123", "IMEI 351234567890123")
  const matches = trimmed.match(/\b\d{15}\b/g);
  if (matches && matches.length > 0) {
    return { success: true, imei: matches[0] };
  }

  // 4. If digits only without any formatting
  const digitsOnly = trimmed.replace(/\D/g, '');
  if (digitsOnly.length === 15) {
    return { success: true, imei: digitsOnly };
  }

  // If 16 digits (IMEISV where the 16th digit is software version), extract the 15-digit base IMEI
  if (digitsOnly.length === 16) {
    return { success: true, imei: digitsOnly.slice(0, 15) };
  }

  if (digitsOnly.length < 15) {
    return { success: false, error: 'too_short', raw: trimmed };
  }

  return { success: false, error: 'invalid_format', raw: trimmed };
}
