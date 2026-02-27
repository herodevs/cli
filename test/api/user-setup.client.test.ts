import { vi } from 'vitest';
import { ApiError } from '../../src/api/errors.ts';
import { completeUserSetup, ensureUserSetup, getUserSetupStatus } from '../../src/api/user-setup.client.ts';
import { FetchMock } from '../utils/mocks/fetch.mock.ts';

vi.mock('../../src/service/auth.svc.ts', () => ({
  getTokenProvider: vi.fn(() => vi.fn().mockResolvedValue('test-token')),
}));

describe('user-setup.client', () => {
  let fetchMock: FetchMock;

  beforeEach(() => {
    fetchMock = new FetchMock();
  });

  afterEach(() => {
    fetchMock.restore();
  });

  it('returns isComplete and orgId when user setup is already complete', async () => {
    fetchMock.addGraphQL({ eol: { userSetupStatus: { isComplete: true, orgId: 42 } } });

    await expect(getUserSetupStatus()).resolves.toEqual({ isComplete: true, orgId: 42 });
  });

  it('uses OAuth when preferOAuth true', async () => {
    fetchMock.addGraphQL({ eol: { userSetupStatus: { isComplete: true, orgId: 99 } } });

    await expect(getUserSetupStatus({ preferOAuth: true })).resolves.toEqual({
      isComplete: true,
      orgId: 99,
    });
  });

  it('completes user setup when status is false and returns orgId', async () => {
    fetchMock
      .addGraphQL({ eol: { userSetupStatus: { isComplete: false } } })
      .addGraphQL({ eol: { completeUserSetup: { isComplete: true, orgId: 42 } } });

    await expect(ensureUserSetup()).resolves.toBe(42);
    expect(fetchMock.getCalls()).toHaveLength(2);
  });

  it('throws when completeUserSetup mutation returns isComplete false', async () => {
    fetchMock.addGraphQL({ eol: { completeUserSetup: { isComplete: false } } });

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

    await expect(ensureUserSetup()).rejects.toThrow('Please contact support@herodevs.com.');
    expect(fetchMock.getCalls()).toHaveLength(3);
  });
});
