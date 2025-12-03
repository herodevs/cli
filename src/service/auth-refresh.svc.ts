import type { TokenResponse } from '../types/auth.ts';
import { getClientId, getRealmUrl } from './auth-config.svc.ts';

interface AuthOptions {
  clientId?: string;
  realmUrl?: string;
}

export async function refreshTokens(refreshToken: string, options: AuthOptions = {}): Promise<TokenResponse> {
  const clientId = options.clientId ?? getClientId();
  const realmUrl = options.realmUrl ?? getRealmUrl();
  const tokenUrl = `${realmUrl}/token`;

  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: clientId,
    refresh_token: refreshToken,
  });

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Token refresh failed: ${response.status} ${response.statusText}\n${text}`);
  }

  return response.json() as Promise<TokenResponse>;
}

export async function logoutFromProvider(refreshToken: string | undefined, options: AuthOptions = {}) {
  if (!refreshToken) {
    return;
  }

  const clientId = options.clientId ?? getClientId();
  const realmUrl = options.realmUrl ?? getRealmUrl();
  const logoutUrl = `${realmUrl}/logout`;

  const body = new URLSearchParams({
    client_id: clientId,
    refresh_token: refreshToken,
  });

  const response = await fetch(logoutUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!response.ok) {
    const text = await response.text();
    if (response.status === 400 && text.includes('invalid_grant')) {
      return;
    }

    throw new Error(`Logout failed: ${response.status} ${response.statusText}\n${text}`);
  }
}
