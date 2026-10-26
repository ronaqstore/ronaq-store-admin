import { TURNSTILE_SITEVERIFY_URL } from '@/constants/api';
import { env } from '@/config/env';
import type { TurnstileSiteverifyResponse } from '@/types/turnstile';

export async function verifyTurnstileToken(token: string | undefined): Promise<boolean> {
  const secret = env.TURNSTILE_SECRET_KEY?.trim() ?? '';
  if (!secret) return true;

  const trimmed = token?.trim() ?? '';
  if (!trimmed) return false;

  try {
    const response = await fetch(TURNSTILE_SITEVERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        secret,
        response: trimmed
      })
    });
    const result = (await response.json()) as TurnstileSiteverifyResponse;
    return result.success === true;
  } catch {
    return false;
  }
}
