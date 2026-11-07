import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  extractRoleFromAccessToken,
  readAuthRole,
  readOptionalString,
  readRequiredString
} from './session-claims.ts';

describe('session-claims', () => {
  describe('readAuthRole', () => {
    it('accepts valid roles: OWNER, MANAGER, SALESMAN, SUPER_ADMIN, ADMIN', () => {
      assert.equal(readAuthRole('OWNER'), 'OWNER');
      assert.equal(readAuthRole('MANAGER'), 'MANAGER');
      assert.equal(readAuthRole('SALESMAN'), 'SALESMAN');
      assert.equal(readAuthRole('SUPER_ADMIN'), 'SUPER_ADMIN');
      assert.equal(readAuthRole('ADMIN'), 'ADMIN');
    });

    it('rejects invalid role strings', () => {
      assert.equal(readAuthRole('UNKNOWN'), undefined);
      assert.equal(readAuthRole('GUEST'), undefined);
      assert.equal(readAuthRole(''), undefined);
    });

    it('rejects non-string values gracefully', () => {
      assert.equal(readAuthRole(null), undefined);
      assert.equal(readAuthRole(undefined), undefined);
      assert.equal(readAuthRole(123), undefined);
      assert.equal(readAuthRole({}), undefined);
    });
  });

  describe('extractRoleFromAccessToken', () => {
    it('successfully extracts SALESMAN role from valid JWT payload', () => {
      const payload = Buffer.from(JSON.stringify({ role: 'SALESMAN', sub: 'u1' })).toString(
        'base64url'
      );
      const fakeJwt = `eyJhbGciOiJIUzI1NiJ9.${payload}.sig`;
      assert.equal(extractRoleFromAccessToken(fakeJwt), 'SALESMAN');
    });

    it('returns undefined for malformed JWT strings', () => {
      assert.equal(extractRoleFromAccessToken('not-a-jwt'), undefined);
      assert.equal(extractRoleFromAccessToken(''), undefined);
    });

    it('returns undefined if payload contains invalid or unknown role', () => {
      const payload = Buffer.from(JSON.stringify({ role: 'HACKER' })).toString('base64url');
      const fakeJwt = `header.${payload}.sig`;
      assert.equal(extractRoleFromAccessToken(fakeJwt), undefined);
    });

    it('returns undefined if payload is not valid JSON base64', () => {
      assert.equal(extractRoleFromAccessToken('header.invalid-base64-json.sig'), undefined);
    });
  });

  describe('readOptionalString', () => {
    it('returns string when valid string is passed', () => {
      assert.equal(readOptionalString('hello'), 'hello');
    });

    it('returns null for non-string values', () => {
      assert.equal(readOptionalString(null), null);
      assert.equal(readOptionalString(undefined), null);
      assert.equal(readOptionalString(123), null);
    });
  });

  describe('readRequiredString', () => {
    it('returns string when valid string is passed', () => {
      assert.equal(readRequiredString('token-123'), 'token-123');
    });

    it('returns empty string for non-string values', () => {
      assert.equal(readRequiredString(null), '');
      assert.equal(readRequiredString(undefined), '');
      assert.equal(readRequiredString(456), '');
    });
  });
});
