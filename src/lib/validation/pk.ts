import { normalizePhone } from '@/lib/auth/phone';

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
