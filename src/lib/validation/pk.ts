import { normalizePhone } from '@/lib/auth/phone';
import { INPUT_LIMITS } from '@/lib/input-limits';

export function isValidPkMobileNumber(phone: string): boolean {
  const trimmed = phone.trim();
  if (!trimmed) return false;
  return /^03\d{9}$/.test(normalizePhone(trimmed));
}

export function isOptionalPkMobile(phone: string): boolean {
  const trimmed = phone.trim();
  if (!trimmed) return true;
  return isValidPkMobileNumber(trimmed);
}

export function isValidPkCnic(cnic: string): boolean {
  const digits = cnic.replace(/\D/g, '');
  if (!/^\d{13}$/.test(digits)) return false;
  if (/^0{13}$/.test(digits)) return false;
  const areaFirst = Number(digits[0]);
  return areaFirst >= 1 && areaFirst <= 7;
}

export function isOptionalPkCnic(cnic: string): boolean {
  const trimmed = cnic.trim();
  if (!trimmed) return true;
  return isValidPkCnic(trimmed);
}

export function sanitizePkMobileInput(value: string): string {
  return value.replace(/\D/g, '').slice(0, INPUT_LIMITS.phonePk);
}

export function sanitizePkCnicInput(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, INPUT_LIMITS.cnicDigits);
  if (digits.length <= 5) return digits;
  if (digits.length <= 12) return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12)}`;
}

export function formatPkCnic(cnic: string | null | undefined): string {
  const trimmed = cnic?.trim();
  if (!trimmed) return '';
  const digits = trimmed.replace(/\D/g, '');
  if (digits.length !== 13) return trimmed;
  return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12)}`;
}
