import { vi } from 'vitest';

vi.mock('@napi-rs/keyring', () => {
  const store = new Map<string, string>();
  const setPasswordMock = vi.fn(async (service: string, account: string, password: string) => {
    store.set(`${service}:${account}`, password);
  });
  const getPasswordMock = vi.fn(async (service: string, account: string) => store.get(`${service}:${account}`) ?? null);
  const deletePasswordMock = vi.fn(async (service: string, account: string) => {
    store.delete(`${service}:${account}`);
    return true;
  });

  class AsyncEntry {
    service: string;
    username: string;
    constructor(service: string, username: string) {
      this.service = service;
      this.username = username;
    }

    async setPassword(password: string) {
      return setPasswordMock(this.service, this.username, password);
    }

    async getPassword() {
      return getPasswordMock(this.service, this.username);
    }

    async deletePassword() {
      return deletePasswordMock(this.service, this.username);
    }
  }

  return {
    __esModule: true,
    AsyncEntry,
    __store: store,
    __mocks: { setPasswordMock, getPasswordMock, deletePasswordMock },
  };
});

// @ts-expect-error - __mocks is exposed only via the test double above
import { __mocks as keyringMocks } from '@napi-rs/keyring';
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
    expect(keyringMocks.deletePasswordMock).toHaveBeenCalled();
  });

  it('computes access token expiry from JWT payload', () => {
    const futureToken = createTokenWithExp(120);
    const pastToken = createTokenWithExp(-120);

    expect(isAccessTokenExpired(futureToken)).toBe(false);
    expect(isAccessTokenExpired(pastToken)).toBe(true);
    expect(isAccessTokenExpired('invalid-token')).toBe(true);
  });
});
