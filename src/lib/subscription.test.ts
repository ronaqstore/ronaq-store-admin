import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateSubscriptionDaysRemaining,
  buildWhatsAppSupportUrl,
  formatSubscriptionExpiryDate
} from './subscription.ts';

describe('calculateSubscriptionDaysRemaining', () => {
  it('returns null for null or invalid date', () => {
    assert.equal(calculateSubscriptionDaysRemaining(null), null);
    assert.equal(calculateSubscriptionDaysRemaining(undefined), null);
    assert.equal(calculateSubscriptionDaysRemaining('invalid-date'), null);
  });

  it('calculates exact UTC calendar day difference', () => {
    const now = new Date('2026-10-30T10:00:00.000Z');

    // Same day
    assert.equal(calculateSubscriptionDaysRemaining('2026-10-30T18:00:00.000Z', now), 0);

    // 1 day remaining (tomorrow)
    assert.equal(calculateSubscriptionDaysRemaining('2026-10-31T05:00:00.000Z', now), 1);

    // 7 days remaining
    assert.equal(calculateSubscriptionDaysRemaining('2026-11-06T12:00:00.000Z', now), 7);

    // 30 days remaining
    assert.equal(calculateSubscriptionDaysRemaining('2026-11-29T10:00:00.000Z', now), 30);

    // Yesterday (expired)
    assert.equal(calculateSubscriptionDaysRemaining('2026-10-29T23:59:59.000Z', now), -1);
  });
});

describe('buildWhatsAppSupportUrl', () => {
  it('generates valid WhatsApp URL with default number', () => {
    const url = buildWhatsAppSupportUrl({ shopName: 'Al-Madina Mobile' });
    assert.ok(url.startsWith('https://wa.me/923001234567?text='));
    assert.ok(url.includes('Al-Madina%20Mobile'));
  });
});

describe('formatSubscriptionExpiryDate', () => {
  it('formats date correctly', () => {
    const formatted = formatSubscriptionExpiryDate('2026-11-30T00:00:00.000Z', 'en-US');
    assert.ok(formatted.includes('Nov') && formatted.includes('2026'));
  });

  it('handles invalid input gracefully', () => {
    assert.equal(formatSubscriptionExpiryDate(null), '—');
    assert.equal(formatSubscriptionExpiryDate('bad-date'), '—');
  });
});
