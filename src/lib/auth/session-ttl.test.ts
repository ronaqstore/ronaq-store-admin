import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { SESSION_TTL_SECONDS, sessionTtlSeconds } from './session-ttl.ts';

describe('sessionTtlSeconds', () => {
  it('uses 24 hours when rememberMe is off', () => {
    assert.equal(sessionTtlSeconds(false), SESSION_TTL_SECONDS.default);
    assert.equal(sessionTtlSeconds(false), 60 * 60 * 24);
  });

  it('uses 30 days when rememberMe is on', () => {
    assert.equal(sessionTtlSeconds(true), SESSION_TTL_SECONDS.remember);
    assert.equal(sessionTtlSeconds(true), 60 * 60 * 24 * 30);
  });
});
