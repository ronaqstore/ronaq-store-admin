import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { isJwtExpiredOrInvalid } from './force-sign-out.ts';

function makeToken(exp: number): string {
  const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ exp })).toString('base64url');
  return `${header}.${payload}.sig`;
}

describe('isJwtExpiredOrInvalid', () => {
  it('treats missing or malformed tokens as invalid', () => {
    assert.equal(isJwtExpiredOrInvalid(null), true);
    assert.equal(isJwtExpiredOrInvalid(''), true);
    assert.equal(isJwtExpiredOrInvalid('not-a-jwt'), true);
  });

  it('detects an expired token', () => {
    assert.equal(isJwtExpiredOrInvalid(makeToken(Math.floor(Date.now() / 1000) - 10)), true);
  });

  it('accepts a still-valid token', () => {
    assert.equal(isJwtExpiredOrInvalid(makeToken(Math.floor(Date.now() / 1000) + 3600)), false);
  });
});
