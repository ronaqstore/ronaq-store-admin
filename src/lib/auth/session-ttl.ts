export const SESSION_TTL_SECONDS = {
  default: 60 * 60 * 24,
  remember: 60 * 60 * 24 * 30
} as const;

export function sessionTtlSeconds(rememberMe: boolean): number {
  return rememberMe ? SESSION_TTL_SECONDS.remember : SESSION_TTL_SECONDS.default;
}
