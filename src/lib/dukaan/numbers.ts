export * from '@/lib/money';
export * from '@/lib/dates';

export function formatLabel(value: string): string {
  return value.replaceAll('_', ' ').toLowerCase();
}

export function createClientRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}
