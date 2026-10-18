export * from '@/lib/money';
export * from '@/lib/dates';

export function formatLabel(value: string): string {
  return value.replaceAll('_', ' ').toLowerCase();
}

export function createClientRequestId(): string {
  return crypto.randomUUID();
}
