import { vi } from 'vitest';

vi.mock('../../src/service/auth.svc.ts', () => ({
  requireAccessToken: vi.fn(() => Promise.resolve('access-token')),
}));

vi.mock('../../src/config/constants.ts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/config/constants.ts')>();
  return {
    ...actual,
    config: {
      ...actual.config,
      graphqlHost: 'https://gateway.test',
      graphqlPath: '/graphql',
    },
  };
});

import {
  exchangeCITokenForAccess,
  getOrgAccessTokensUnauthenticated,
  provisionCIToken,
} from '../../src/api/ci-token.client.ts';
import { FetchMock } from '../utils/mocks/fetch.mock.ts';

const mockHeaders = {
  get: () => 'application/json',
};

function mockGraphQLResponse(data: {
  iamV2?: {
    access?: {
      getOrgAccessTokens?: { accessToken?: string; refreshToken?: string };
    };
  };
}) {
  const payload = { data };
  return {
    ok: true,
    status: 200,
    headers: mockHeaders,
    async json() {
      return payload;
    },
    async text() {
      return JSON.stringify(payload);
    },
  } as unknown as Response;
}

function mockGraphQLErrorResponse(message: string) {
  const payload = { errors: [{ message }] };
  return {
    ok: true,
    status: 200,
    headers: mockHeaders,
    async json() {
      return payload;
    },
    async text() {
      return JSON.stringify(payload);
    },
  } as unknown as Response;
}

function mockErrorResponse(status: number, body: string) {
  return {
    ok: false,
    status,
    headers: mockHeaders,
    async text() {
      return body;
    },
    async json() {
      try {
        return JSON.parse(body);
      } catch {
        return {};
      }
    },
  } as unknown as Response;
}

describe('ci-token.client', () => {
  let fetchMock: FetchMock;

  beforeEach(() => {
    fetchMock = new FetchMock();
  });

  afterEach(() => {
    fetchMock.restore();
  });

  it('returns refresh_token on success', async () => {
    fetchMock.push(
      mockGraphQLResponse({
        iamV2: {
          access: {
            getOrgAccessTokens: {
              accessToken: 'new-access',
              refreshToken: 'ci-refresh-token-123',
            },
          },
        },
      }),
    );

    const result = await provisionCIToken({ orgId: 42 });
    expect(result).toEqual({ refresh_token: 'ci-refresh-token-123', access_token: 'new-access' });

    const calls = fetchMock.getCalls();
    expect(calls).toHaveLength(1);
    expect(calls[0].input).toContain('graphql');
    const headers = calls[0].init?.headers as Headers | undefined;
    expect(headers?.get?.('Authorization')).toBe('Bearer access-token');
    expect(headers?.get?.('Content-Type')).toBe('application/json');
    const body = JSON.parse((calls[0].init?.body as string) ?? '{}');
    expect(body.variables).toEqual({
      input: { orgId: 42 },
    });
  });

  it('passes previousToken when provided', async () => {
    fetchMock.push(
      mockGraphQLResponse({
        iamV2: {
          access: {
            getOrgAccessTokens: {
              accessToken: 'a',
              refreshToken: 'r',
            },
          },
        },
      }),
    );

    await provisionCIToken({
      previousToken: 'old-refresh',
    });

    const body = JSON.parse((fetchMock.getCalls()[0].init?.body as string) ?? '{}');
    expect(body.variables.input).toEqual({
      previousToken: 'old-refresh',
    });
  });

  it('throws when response is not ok', async () => {
    fetchMock.push(mockErrorResponse(401, 'Unauthorized'));
    fetchMock.push(mockErrorResponse(401, 'Unauthorized')); // retry consumes second mock

    await expect(provisionCIToken({ orgId: 1 })).rejects.toThrow(/401/);
  });

  it('throws when GraphQL returns errors', async () => {
    fetchMock.push(mockGraphQLErrorResponse('Not authorized'));

    await expect(provisionCIToken({ orgId: 1 })).rejects.toThrow(/Not authorized/);
  });

  it('throws when response body is missing refreshToken', async () => {
    fetchMock.push(mockGraphQLResponse({}));

    await expect(provisionCIToken({ orgId: 1 })).rejects.toThrow(/missing refreshToken/);
  });

  it('throws when refreshToken is empty string', async () => {
    fetchMock.push(
      mockGraphQLResponse({
        iamV2: {
          access: {
            getOrgAccessTokens: {
              accessToken: 'a',
              refreshToken: '   ',
            },
          },
        },
      }),
    );

    await expect(provisionCIToken({ orgId: 1 })).rejects.toThrow(/missing refreshToken/);
  });

  it('throws when neither orgId nor previousToken provided', async () => {
    await expect(provisionCIToken()).rejects.toThrow(/Either orgId or previousToken is required/);
  });

  describe('getOrgAccessTokensUnauthenticated', () => {
    it('calls IAM with previousToken, without Bearer header', async () => {
      fetchMock.push(
        mockGraphQLResponse({
          iamV2: {
            access: {
              getOrgAccessTokens: {
                accessToken: 'new-access-from-refresh',
                refreshToken: 'new-refresh',
              },
            },
          },
        }),
      );

      const result = await getOrgAccessTokensUnauthenticated({
        previousToken: 'stored-ci-refresh-token',
      });
      expect(result.accessToken).toBe('new-access-from-refresh');
      expect(result.refreshToken).toBe('new-refresh');

      const calls = fetchMock.getCalls();
      expect(calls).toHaveLength(1);
      const headers = calls[0].init?.headers as Record<string, string> | Headers | undefined;
      const authHeader =
        headers && typeof (headers as Headers).get === 'function'
          ? (headers as Headers).get('Authorization')
          : (headers as Record<string, string>)?.Authorization;
      expect(authHeader).toBeFalsy();
      const body = JSON.parse((calls[0].init?.body as string) ?? '{}');
      expect(body.variables.input).toEqual({
        previousToken: 'stored-ci-refresh-token',
      });
    });

    it('throws when GraphQL returns errors', async () => {
      fetchMock.push(mockGraphQLErrorResponse('Invalid refresh token'));

      await expect(getOrgAccessTokensUnauthenticated({ previousToken: 'bad-token' })).rejects.toThrow(
        /Invalid refresh token/,
      );
    });

    it('throws when response is not ok', async () => {
      fetchMock.push(mockErrorResponse(500, 'Internal Server Error'));

      await expect(getOrgAccessTokensUnauthenticated({ previousToken: 'token' })).rejects.toThrow(/500/);
    });
  });

  describe('exchangeCITokenForAccess', () => {
    it('calls IAM with previousToken, returns access and refresh token', async () => {
      fetchMock.push(
        mockGraphQLResponse({
          iamV2: {
            access: {
              getOrgAccessTokens: {
                accessToken: 'exchanged-access',
                refreshToken: 'exchanged-refresh',
              },
            },
          },
        }),
      );

      const result = await exchangeCITokenForAccess({
        refreshToken: 'ci-refresh',
      });
      expect(result.accessToken).toBe('exchanged-access');
      expect(result.refreshToken).toBe('exchanged-refresh');

      const body = JSON.parse((fetchMock.getCalls()[0].init?.body as string) ?? '{}');
      expect(body.variables.input).toEqual({
        previousToken: 'ci-refresh',
      });
    });
  });
});
