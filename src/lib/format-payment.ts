import { PAYMENT_METHOD_OPTIONS } from '@/lib/dukaan/payment-methods';

export function formatPaymentMethod(method?: string | null, notes?: string | null): string {
  const match = notes?.match(/\[Method:\s*([^\]]+)\]/i);
  if (match?.[1]) return match[1].trim();

  if (!method) return 'Cash';
  const upper = method.toUpperCase();
  const known = PAYMENT_METHOD_OPTIONS.find((opt) => opt.value === upper);
  if (known) return known.label;
  if (upper === 'BANK_TRANSFER') return 'Bank Transfer';
  return method.charAt(0).toUpperCase() + method.slice(1).toLowerCase();
}
