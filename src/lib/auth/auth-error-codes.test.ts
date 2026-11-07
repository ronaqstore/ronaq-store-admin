import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { AUTH_ERROR_CODES, resolveAuthErrorMessage } from './auth-error-codes.ts';

describe('auth-error-codes', () => {
  const fakeTranslate = (key: string) => `[translated:${key}]`;

  it('maps SERVER_WAKING_UP to serverWakingUp key', () => {
    assert.equal(
      resolveAuthErrorMessage(AUTH_ERROR_CODES.SERVER_WAKING_UP, fakeTranslate),
      '[translated:auth.serverWakingUp]'
    );
  });

  it('maps RATE_LIMITED to tooManyRequests key', () => {
    assert.equal(
      resolveAuthErrorMessage(AUTH_ERROR_CODES.RATE_LIMITED, fakeTranslate),
      '[translated:auth.tooManyRequests]'
    );
  });

  it('maps SHOP_SUSPENDED to shopSuspended key', () => {
    assert.equal(
      resolveAuthErrorMessage(AUTH_ERROR_CODES.SHOP_SUSPENDED, fakeTranslate),
      '[translated:auth.shopSuspended]'
    );
  });

  it('maps ACCOUNT_SUSPENDED to accountSuspended key', () => {
    assert.equal(
      resolveAuthErrorMessage(AUTH_ERROR_CODES.ACCOUNT_SUSPENDED, fakeTranslate),
      '[translated:auth.accountSuspended]'
    );
  });

  it('maps ADMIN_DISABLED to adminAccountDisabled key', () => {
    assert.equal(
      resolveAuthErrorMessage(AUTH_ERROR_CODES.ADMIN_DISABLED, fakeTranslate),
      '[translated:auth.adminAccountDisabled]'
    );
  });

  it('maps TURNSTILE_FAILED to turnstileFailed key', () => {
    assert.equal(
      resolveAuthErrorMessage(AUTH_ERROR_CODES.TURNSTILE_FAILED, fakeTranslate),
      '[translated:auth.turnstileFailed]'
    );
  });

  it('maps VALIDATION_ERROR to phoneInvalid key', () => {
    assert.equal(
      resolveAuthErrorMessage(AUTH_ERROR_CODES.VALIDATION_ERROR, fakeTranslate),
      '[translated:auth.phoneInvalid]'
    );
  });

  it('falls back to invalidCredentials for shop owner when code is invalid, empty, or unknown', () => {
    assert.equal(
      resolveAuthErrorMessage(AUTH_ERROR_CODES.INVALID_CREDENTIALS, fakeTranslate, false),
      '[translated:auth.invalidCredentials]'
    );
    assert.equal(
      resolveAuthErrorMessage('credentials', fakeTranslate, false),
      '[translated:auth.invalidCredentials]'
    );
    assert.equal(
      resolveAuthErrorMessage('CredentialsSignin', fakeTranslate, false),
      '[translated:auth.invalidCredentials]'
    );
    assert.equal(
      resolveAuthErrorMessage(null, fakeTranslate, false),
      '[translated:auth.invalidCredentials]'
    );
    assert.equal(
      resolveAuthErrorMessage(undefined, fakeTranslate, false),
      '[translated:auth.invalidCredentials]'
    );
    assert.equal(
      resolveAuthErrorMessage('SOME_RANDOM_CODE', fakeTranslate, false),
      '[translated:auth.invalidCredentials]'
    );
  });

  it('falls back to platformAdminError when isPlatformAdmin is true and code is credentials/unknown', () => {
    assert.equal(
      resolveAuthErrorMessage(AUTH_ERROR_CODES.INVALID_CREDENTIALS, fakeTranslate, true),
      '[translated:auth.platformAdminError]'
    );
    assert.equal(
      resolveAuthErrorMessage('credentials', fakeTranslate, true),
      '[translated:auth.platformAdminError]'
    );
    assert.equal(
      resolveAuthErrorMessage(null, fakeTranslate, true),
      '[translated:auth.platformAdminError]'
    );
  });
});
