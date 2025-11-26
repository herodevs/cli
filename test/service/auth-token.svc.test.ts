import { vi } from 'vitest';

vi.mock('keytar', () => {
  const store = new Map<string, string>();

  return {
    __esModule: true,
    default: {
      setPassword: vi.fn(async (service: string, account: string, password: string) => {
        store.set(`${service}:${account}`, password);
      }),
      getPassword: vi.fn(async (service: string, account: string) => store.get(`${service}:${account}`) ?? null),
      deletePassword: vi.fn(async (service: string, account: string) => {
        store.delete(`${service}:${account}`);
        return true;
      }),
      __store: store,
    },
  };
});

import keytar from 'keytar';
import {
  clearStoredTokens,
  getStoredTokens,
  isAccessTokenExpired,
  saveTokens,
} from '../../src/service/auth-token.svc.ts';
import { createTokenWithExp } from '../utils/token.ts';

describe('auth-token.svc', () => {
  beforeEach(async () => {
    await clearStoredTokens();
  });

  it('saves and retrieves access and refresh tokens', async () => {
    await saveTokens({ accessToken: 'access-1', refreshToken: 'refresh-1' });

    const tokens = await getStoredTokens();
    expect(tokens?.accessToken).toBe('access-1');
    expect(tokens?.refreshToken).toBe('refresh-1');
  });

  it('clears stored tokens', async () => {
    await saveTokens({ accessToken: 'access-2', refreshToken: 'refresh-2' });
    await clearStoredTokens();

    const tokens = await getStoredTokens();
    expect(tokens).toBeUndefined();
  });

  it('returns undefined when nothing is stored', async () => {
    const tokens = await getStoredTokens();
    expect(tokens).toBeUndefined();
  });

  it('removes stored refresh token when not provided', async () => {
    await saveTokens({ accessToken: 'access-3', refreshToken: 'refresh-3' });
    await saveTokens({ accessToken: 'access-4' });

    const tokens = await getStoredTokens();
    expect(tokens?.accessToken).toBe('access-4');
    expect(tokens?.refreshToken).toBeUndefined();
    const mockedKeytar = keytar as unknown as { deletePassword: ReturnType<typeof vi.fn> };
    expect(mockedKeytar.deletePassword).toHaveBeenCalled();
  });

  it('computes access token expiry from JWT payload', () => {
    const futureToken = createTokenWithExp(120);
    const pastToken = createTokenWithExp(-120);

    expect(isAccessTokenExpired(futureToken)).toBe(false);
    expect(isAccessTokenExpired(pastToken)).toBe(true);
    expect(isAccessTokenExpired('invalid-token')).toBe(true);
  });
});
