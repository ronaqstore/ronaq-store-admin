import type { OpeningHoursRange } from '@/types/store-settings';

const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const OPENING_HOUR_TIME_OPTIONS: string[] = Array.from({ length: 48 }, (_, i) => {
  const hours = Math.floor(i / 2);
  const minutes = i % 2 === 0 ? '00' : '30';
  return `${String(hours).padStart(2, '0')}:${minutes}`;
});

export function formatTimeOptionLabel(hhmm: string): string {
  if (!TIME_RE.test(hhmm)) return hhmm;
  const [hRaw, m] = hhmm.split(':');
  const h = Number(hRaw);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 || 12;
  return `${hour12}:${m} ${period}`;
}

export function composeOpeningHours(opens: string, closes: string): string | null {
  const open = opens.trim();
  const close = closes.trim();
  if (!open && !close) return null;
  if (!TIME_RE.test(open) || !TIME_RE.test(close)) return null;
  return `${open} – ${close}`;
}

export function parseOpeningHours(raw: string | null | undefined): OpeningHoursRange | null {
  if (!raw?.trim()) return null;
  const match = raw
    .trim()
    .match(/(\d{1,2}:\d{2})\s*(?:[–—−-]|\bto\b)\s*(\d{1,2}:\d{2})/i);
  if (!match?.[1] || !match[2]) return null;

  const opens = normalizeHhmm(match[1]);
  const closes = normalizeHhmm(match[2]);
  if (!opens || !closes) return null;
  return { opens, closes };
}

function normalizeHhmm(value: string): string | null {
  const [hRaw, mRaw] = value.split(':');
  const h = Number(hRaw);
  const m = Number(mRaw);
  if (!Number.isInteger(h) || !Number.isInteger(m) || h < 0 || h > 23 || m < 0 || m > 59) {
    return null;
  }
  const snapped = m < 15 ? 0 : m < 45 ? 30 : 0;
  const hours = m >= 45 ? (h + 1) % 24 : h;
  return `${String(hours).padStart(2, '0')}:${String(snapped).padStart(2, '0')}`;
}

export function isClosingAfterOpening(opens: string, closes: string): boolean {
  if (!TIME_RE.test(opens) || !TIME_RE.test(closes)) return false;
  return closes > opens;
}

export function formatOpeningHoursDisplay(raw: string | null | undefined): string | null {
  const parsed = parseOpeningHours(raw);
  if (!parsed) return raw?.trim() || null;
  return `${formatTimeOptionLabel(parsed.opens)} – ${formatTimeOptionLabel(parsed.closes)}`;
}
