import { apiRequest } from '@/lib/api/client';
import { uploadShopLogo } from '@/features/store-settings/api/service';
import type { RegisterValues, AuthResponseData } from '@/types/auth';

export async function registerOwnerAccount(input: RegisterValues): Promise<AuthResponseData> {
  return apiRequest<AuthResponseData>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(input)
  });
}

export async function registerOwnerAccountWithOptionalLogo(
  input: RegisterValues,
  logoFile?: File | null
): Promise<AuthResponseData> {
  const auth = await registerOwnerAccount(input);
  if (logoFile && auth.accessToken) {
    await uploadShopLogo(logoFile, auth.accessToken);
  }
  return auth;
}
