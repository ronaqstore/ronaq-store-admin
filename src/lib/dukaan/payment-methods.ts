import type {
  PaymentMethodOption,
  PaymentMethodSelectOption,
  StoredPaymentMethod
} from '@/types/payment';

export type { StoredPaymentMethod };

export const PAYMENT_METHOD_VALUES = [
  'CASH',
  'JAZZCASH',
  'EASYPAISA',
  'BANK'
] as const satisfies readonly PaymentMethodOption[];

export const PAYMENT_METHOD_OPTIONS: PaymentMethodSelectOption[] = [
  { value: 'CASH', label: 'Cash' },
  { value: 'JAZZCASH', label: 'JazzCash' },
  { value: 'EASYPAISA', label: 'EasyPaisa' },
  { value: 'BANK', label: 'Bank Transfer' }
];

export function isStoredPaymentMethod(value: unknown): value is StoredPaymentMethod {
  return (
    typeof value === 'string' &&
    (PAYMENT_METHOD_VALUES as readonly string[]).includes(value)
  );
}

export function parsePaymentMethodFilter(value: unknown): StoredPaymentMethod | undefined {
  if (Array.isArray(value)) {
    return value.find((item) => isStoredPaymentMethod(item));
  }
  if (typeof value === 'string') {
    const first = value.split(',')[0]?.trim();
    return isStoredPaymentMethod(first) ? first : undefined;
  }
  return undefined;
}
