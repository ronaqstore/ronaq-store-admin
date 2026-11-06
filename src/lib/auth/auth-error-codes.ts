export const AUTH_ERROR_CODES = {
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  SERVER_WAKING_UP: 'SERVER_WAKING_UP',
  RATE_LIMITED: 'RATE_LIMITED',
  SHOP_SUSPENDED: 'SHOP_SUSPENDED',
  ACCOUNT_SUSPENDED: 'ACCOUNT_SUSPENDED',
  ADMIN_DISABLED: 'ADMIN_DISABLED',
  TURNSTILE_FAILED: 'TURNSTILE_FAILED',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
} as const;

export type AuthFailureCode = (typeof AUTH_ERROR_CODES)[keyof typeof AUTH_ERROR_CODES];

export function resolveAuthErrorMessage(
  code: string | undefined | null,
  t: (key: string) => string,
  isPlatformAdmin = false
): string {
  switch (code) {
    case AUTH_ERROR_CODES.SERVER_WAKING_UP:
      return t('auth.serverWakingUp');
    case AUTH_ERROR_CODES.RATE_LIMITED:
      return t('auth.tooManyRequests');
    case AUTH_ERROR_CODES.SHOP_SUSPENDED:
      return t('auth.shopSuspended');
    case AUTH_ERROR_CODES.ACCOUNT_SUSPENDED:
      return t('auth.accountSuspended');
    case AUTH_ERROR_CODES.ADMIN_DISABLED:
      return t('auth.adminAccountDisabled');
    case AUTH_ERROR_CODES.TURNSTILE_FAILED:
      return t('auth.turnstileFailed');
    case AUTH_ERROR_CODES.VALIDATION_ERROR:
      return t('auth.phoneInvalid');
    case AUTH_ERROR_CODES.INVALID_CREDENTIALS:
    case 'credentials':
    case 'CredentialsSignin':
    default:
      return isPlatformAdmin ? t('auth.platformAdminError') : t('auth.invalidCredentials');
  }
}
