import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { sanitizeImei } from './imei-sanitizer.ts';

describe('sanitizeImei', () => {
  describe('Happy Paths', () => {
    it('accepts clean 15-digit IMEI strings', () => {
      const result = sanitizeImei('354892091234567');
      assert.equal(result.success, true);
      if (result.success) {
        assert.equal(result.imei, '354892091234567');
      }
    });

    it('extracts pure digits from hyphenated or space-separated IMEIs', () => {
      const result = sanitizeImei('354892-09-123456-7');
      assert.equal(result.success, true);
      if (result.success) {
        assert.equal(result.imei, '354892091234567');
      }
    });

    it('strips common box labels like IMEI: or IMEI1:', () => {
      const result1 = sanitizeImei('IMEI: 354892091234567');
      assert.equal(result1.success, true);
      if (result1.success) {
        assert.equal(result1.imei, '354892091234567');
      }

      const result2 = sanitizeImei('IMEI1: 864501051234567');
      assert.equal(result2.success, true);
      if (result2.success) {
        assert.equal(result2.imei, '864501051234567');
      }
    });

    it('extracts 15 digits from 16-digit IMEISV barcodes', () => {
      const result = sanitizeImei('3548920912345678');
      assert.equal(result.success, true);
      if (result.success) {
        assert.equal(result.imei, '354892091234567');
      }
    });
  });

  describe('Negative & Adversarial Paths', () => {
    it('Negative 1: returns empty_scan for empty, whitespace, or invalid types', () => {
      assert.deepEqual(sanitizeImei(''), { success: false, error: 'empty_scan', raw: '' });
      assert.deepEqual(sanitizeImei('   '), { success: false, error: 'empty_scan', raw: '' });
      assert.deepEqual(sanitizeImei(null), { success: false, error: 'empty_scan', raw: '' });
      assert.deepEqual(sanitizeImei(undefined), { success: false, error: 'empty_scan', raw: '' });
    });

    it('Negative 2: rejects barcodes with fewer than 15 digits', () => {
      const result = sanitizeImei('1234567890');
      assert.equal(result.success, false);
      if (!result.success) {
        assert.equal(result.error, 'too_short');
      }
    });

    it('Negative 3: rejects barcodes containing non-digit noise without 15 digits', () => {
      const result = sanitizeImei('SN:ABCDEF12345');
      assert.equal(result.success, false);
      if (!result.success) {
        assert.equal(result.error, 'too_short');
      }
    });

    it('Negative 4: rejects arbitrary text without 15 consecutive or total digits', () => {
      const result = sanitizeImei('INVALID_PHONE_BARCODE_HERE');
      assert.equal(result.success, false);
      if (!result.success) {
        assert.equal(result.error, 'too_short');
      }
    });
  });
});
