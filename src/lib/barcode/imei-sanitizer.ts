import type { SanitizeBarcodeResult, SanitizeImeiResult } from '@/types/barcode';

export function sanitizeImei(raw: unknown): SanitizeImeiResult {
  if (typeof raw !== 'string') {
    return { success: false, error: 'empty_scan', raw: '' };
  }

  const trimmed = raw.trim();
  if (!trimmed) {
    return { success: false, error: 'empty_scan', raw: '' };
  }

  if (/^\d{15}$/.test(trimmed)) {
    return { success: true, imei: trimmed };
  }

  const noSeparators = trimmed.replace(/[\s\-_]/g, '');
  if (/^\d{15}$/.test(noSeparators)) {
    return { success: true, imei: noSeparators };
  }

  const matches = trimmed.match(/\b\d{15}\b/g);
  if (matches && matches.length > 0) {
    return { success: true, imei: matches[0] };
  }

  const digitsOnly = trimmed.replace(/\D/g, '');
  if (digitsOnly.length === 15) {
    return { success: true, imei: digitsOnly };
  }

  if (digitsOnly.length === 16) {
    return { success: true, imei: digitsOnly.slice(0, 15) };
  }

  if (digitsOnly.length < 15) {
    return { success: false, error: 'too_short', raw: trimmed };
  }

  return { success: false, error: 'invalid_format', raw: trimmed };
}

export function sanitizeBarcode(raw: unknown, maxLength = 100): SanitizeBarcodeResult {
  if (typeof raw !== 'string') {
    return { success: false, error: 'empty_scan', raw: '' };
  }

  const cleaned = raw
    .split('')
    .filter((ch) => ch.charCodeAt(0) >= 32 && ch.charCodeAt(0) !== 127)
    .join('')
    .trim();
  if (!cleaned) {
    return { success: false, error: 'empty_scan', raw: '' };
  }

  return { success: true, barcode: cleaned.slice(0, maxLength) };
}
