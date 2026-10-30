import { env } from '@/config/env';
import { whatsappReminderUrl } from '@/constants/api';
import type { WhatsAppSupportUrlParams } from '@/types/subscription';

export const DEFAULT_SUPPORT_WHATSAPP = '923001234567';

export function getSupportWhatsAppNumber(): string {
  const envVal = env.NEXT_PUBLIC_SUPPORT_WHATSAPP;
  if (envVal && envVal.trim()) {
    return envVal.trim().replace(/\D/g, '');
  }
  return DEFAULT_SUPPORT_WHATSAPP;
}

export function buildWhatsAppSupportUrl(params?: WhatsAppSupportUrlParams): string {
  const phone = getSupportWhatsAppNumber();
  let text = params?.message;
  if (!text) {
    if (params?.shopName) {
      text = `Assalam-o-Alaikum, I need support / subscription renewal for my shop "${params.shopName}".`;
    } else {
      text = 'Assalam-o-Alaikum, I need support / subscription renewal for my Ronaq Store account.';
    }
  }
  return whatsappReminderUrl(phone, text);
}

export function calculateSubscriptionDaysRemaining(
  endsAt: string | Date | null | undefined,
  currentDate = new Date()
): number | null {
  if (!endsAt) return null;
  const target = typeof endsAt === 'string' ? new Date(endsAt) : endsAt;
  if (!target || Number.isNaN(target.getTime())) return null;

  const targetUtc = Date.UTC(target.getUTCFullYear(), target.getUTCMonth(), target.getUTCDate());
  const currentUtc = Date.UTC(
    currentDate.getUTCFullYear(),
    currentDate.getUTCMonth(),
    currentDate.getUTCDate()
  );

  return Math.ceil((targetUtc - currentUtc) / (1000 * 60 * 60 * 24));
}

export function formatSubscriptionExpiryDate(
  endsAt: string | Date | null | undefined,
  locale = 'en-US'
): string {
  if (!endsAt) return '—';
  const d = typeof endsAt === 'string' ? new Date(endsAt) : endsAt;
  if (!d || Number.isNaN(d.getTime())) return '—';

  try {
    return new Intl.DateTimeFormat(locale, {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).format(d);
  } catch {
    return d.toISOString().slice(0, 10);
  }
}
