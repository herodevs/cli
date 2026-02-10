import { vi } from 'vitest';
import { ApiError } from '../../src/api/errors.ts';
import { completeUserSetup, ensureUserSetup, getUserSetupStatus } from '../../src/api/user-setup.client.ts';
import { FetchMock } from '../utils/mocks/fetch.mock.ts';

vi.mock('../../src/service/auth.svc.ts', () => ({
  requireAccessTokenForScan: vi.fn().mockResolvedValue('test-token'),
  requireAccessToken: vi.fn().mockResolvedValue('test-token'),
}));

describe('user-setup.client', () => {
  let fetchMock: FetchMock;

  beforeEach(() => {
    fetchMock = new FetchMock();
  });

  afterEach(() => {
    fetchMock.restore();
  });

  it('returns true when user setup is already complete', async () => {
    fetchMock.addGraphQL({ eol: { userSetupStatus: true } });

    await expect(getUserSetupStatus()).resolves.toBe(true);
  });

  it('completes user setup when status is false', async () => {
    fetchMock.addGraphQL({ eol: { userSetupStatus: false } }).addGraphQL({ eol: { completeUserSetup: true } });

    await expect(ensureUserSetup()).resolves.toBeUndefined();
    expect(fetchMock.getCalls()).toHaveLength(2);
  });

  it('throws when completeUserSetup mutation returns false', async () => {
    fetchMock.addGraphQL({ eol: { completeUserSetup: false } });

    await expect(completeUserSetup()).rejects.toThrow('Failed to complete user setup');
  });

  it('throws ApiError when GraphQL errors include an auth code', async () => {
    fetchMock.addGraphQL({ eol: { userSetupStatus: null } }, [
      { message: 'Not authenticated', extensions: { code: 'UNAUTHENTICATED' } },
    ]);

    await expect(getUserSetupStatus()).rejects.toBeInstanceOf(ApiError);
  });

  it('retries and asks to contact admin after repeated server errors', async () => {
    fetchMock
      .addGraphQL({ eol: { userSetupStatus: null } }, [
        { message: 'Internal server error', extensions: { code: 'INTERNAL_SERVER_ERROR' } },
      ])
      .addGraphQL({ eol: { userSetupStatus: null } }, [
        { message: 'Internal server error', extensions: { code: 'INTERNAL_SERVER_ERROR' } },
      ])
      .addGraphQL({ eol: { userSetupStatus: null } }, [
        { message: 'Internal server error', extensions: { code: 'INTERNAL_SERVER_ERROR' } },
      ]);

    await expect(ensureUserSetup()).rejects.toThrow('Internal server error');
    expect(fetchMock.getCalls()).toHaveLength(3);
  });
});
