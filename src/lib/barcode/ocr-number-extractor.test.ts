import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { extractImeiCandidates, isLuhnValid } from './ocr-number-extractor.ts';

describe('OCR Number Extractor', () => {
  describe('isLuhnValid', () => {
    it('returns true for mathematically valid Luhn IMEIs', () => {
      // 356938035643809 is a valid Luhn IMEI
      assert.equal(isLuhnValid('356938035643809'), true);
      assert.equal(isLuhnValid('356938035643803'), false); // invalid check digit
    });

    it('rejects strings that are not exactly 15 digits', () => {
      assert.equal(isLuhnValid(''), false);
      assert.equal(isLuhnValid('12345'), false);
      assert.equal(isLuhnValid('3569380356438090'), false); // 16 digits
      assert.equal(isLuhnValid('35693803564380A'), false); // contains letter
    });
  });

  describe('extractImeiCandidates', () => {
    it('happy path: extracts a clean 15-digit IMEI from simple text', () => {
      const candidates = extractImeiCandidates('356938035643809');
      assert.equal(candidates.length, 1);
      assert.equal(candidates[0].imei, '356938035643809');
      assert.equal(candidates[0].isLuhnValid, true);
      assert.equal(candidates[0].label, 'IMEI 1');
    });

    it('adversarial case 1: parses dual IMEIs from phone screen text (*#06#) with labels and SV version', () => {
      const screenText = `
        Device info
        IMEI 1
        356938035643809 / 01
        IMEI 2
        356938035643811
        Serial Number
        R58M123456
      `;

      const candidates = extractImeiCandidates(screenText);
      assert.equal(candidates.length, 2);
      assert.equal(candidates[0].imei, '356938035643809');
      assert.equal(candidates[0].label, 'IMEI 1');
      assert.equal(candidates[1].imei, '356938035643811');
      assert.equal(candidates[1].label, 'IMEI 2');
    });

    it('adversarial case 2: handles space-separated and hyphenated digits on paper or notebook', () => {
      const notebookText = 'Customer note: 356938-03-564380-9 received for repair';
      const candidates = extractImeiCandidates(notebookText);
      assert.equal(candidates.length, 1);
      assert.equal(candidates[0].imei, '356938035643809');
      assert.equal(candidates[0].isLuhnValid, true);
    });

    it('adversarial case 3: flags invalid Luhn checksum for handwriting errors without crashing', () => {
      // Last digit 3 instead of 9
      const textWithTypo = 'IMEI: 356938035643803';
      const candidates = extractImeiCandidates(textWithTypo);
      assert.equal(candidates.length, 1);
      assert.equal(candidates[0].imei, '356938035643803');
      assert.equal(candidates[0].isLuhnValid, false);
    });

    it('adversarial case 4: safely returns empty array on empty, noisy, or non-string inputs', () => {
      assert.deepEqual(extractImeiCandidates(''), []);
      assert.deepEqual(extractImeiCandidates('   '), []);
      assert.deepEqual(extractImeiCandidates(null), []);
      assert.deepEqual(extractImeiCandidates(undefined), []);
      assert.deepEqual(extractImeiCandidates('Random words with 12345 and no 15 digit number'), []);
    });
  });
});
