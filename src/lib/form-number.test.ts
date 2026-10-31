import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeNumberInput } from './form-number.ts';

describe('sanitizeNumberInput', () => {
  it('returns empty string for empty input', () => {
    assert.equal(sanitizeNumberInput(''), '');
  });

  it('parses standard numbers', () => {
    assert.equal(sanitizeNumberInput('100'), '100');
    assert.equal(sanitizeNumberInput('0'), '0');
  });

  it('handles standard thousand-separator commas without wiping', () => {
    assert.equal(sanitizeNumberInput('1,000'), '1000');
    assert.equal(sanitizeNumberInput('50,000'), '50000');
    assert.equal(sanitizeNumberInput('1,500,000'), '1500000');
  });

  it('clamps to min and max options', () => {
    assert.equal(sanitizeNumberInput('50', { min: 100 }), '100');
    assert.equal(sanitizeNumberInput('500', { max: 200 }), '200');
  });

  it('returns empty string for genuinely invalid inputs', () => {
    assert.equal(sanitizeNumberInput('abc'), '');
    assert.equal(sanitizeNumberInput('invalid'), '');
  });
});
