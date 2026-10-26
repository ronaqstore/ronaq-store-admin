import { apiRequest } from '@/lib/api/client';
import { appFetch } from '@/lib/api/app-fetch';
import { uploadShopLogo } from '@/features/store-settings/api/service';
import type {
  RegisterValues,
  AuthResponseData,
  AuthMeResponse,
  SetupPasswordResult
} from '@/types/auth';

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

export async function fetchAuthMe(): Promise<AuthMeResponse> {
  return appFetch<AuthMeResponse>('/api/auth/me');
}

export async function setupPasswordWithToken(
  token: string,
  password: string
): Promise<SetupPasswordResult> {
  return apiRequest<SetupPasswordResult>('/auth/setup-password', {
    method: 'POST',
    body: JSON.stringify({ token, password })
  });
}
