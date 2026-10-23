export function safeJoinMessages(value: unknown, separator = ' '): string {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) {
    return value
      .map((item) => (item == null ? '' : String(item)))
      .filter(Boolean)
      .join(separator);
  }
  return '';
}
