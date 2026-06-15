import { type Mock, vi } from 'vitest';

vi.mock('../../../src/service/auth.svc.ts', () => ({
  __esModule: true,
  requireAccessToken: vi.fn(),
}));

import { requireAccessToken } from '../../../src/service/auth.svc.ts';
import { getNesRegistryAuthToken } from '../../../src/service/install/registry-auth.svc.ts';

describe('install registry auth service', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.resetAllMocks();
    (requireAccessToken as Mock).mockResolvedValue('api-token');
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('throws when registry access exists but no registry credential can be derived from login', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(createPrincipalResponse(1000))
      .mockResolvedValueOnce(
        createGraphQLResponse({
          licensing: {
            groups: {
              search: {
                results: [
                  {
                    id: 11,
                    name: 'wrong integration',
                    tokens: [{ integrationName: 'Other' }],
                    access: { packages: [{ id: 1 }], subscriptions: [] },
                  },
                  {
                    id: 12,
                    name: 'nes',
                    tokens: [{ integrationName: 'NES Access Token Provider' }],
                    access: { packages: [{ id: 1 }], subscriptions: [] },
                  },
                ],
              },
            },
          },
        }),
      );
    globalThis.fetch = fetchMock;

    await expect(getNesRegistryAuthToken()).rejects.toThrow(/does not expose the registry credential/);

    expect(requireAccessToken).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const searchBody = JSON.parse(fetchMock.mock.calls[1][1].body as string);
    expect(searchBody.variables).toEqual({ input: { orgIn: [1000] } });
  });

  it('throws when no licensing access group is available', async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValueOnce(createPrincipalResponse(1000))
      .mockResolvedValueOnce(
        createGraphQLResponse({
          licensing: {
            groups: {
              search: {
                results: [],
              },
            },
          },
        }),
      );

    await expect(getNesRegistryAuthToken()).rejects.toThrow(/No NES registry access group/);
  });

  it('throws when NES access groups do not have a token provider', async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValueOnce(createPrincipalResponse(1000))
      .mockResolvedValueOnce(
        createGraphQLResponse({
          licensing: {
            groups: {
              search: {
                results: [
                  {
                    id: 12,
                    tokens: [{ integrationName: 'Other' }],
                    access: { packages: [{ id: 1 }], subscriptions: [] },
                  },
                ],
              },
            },
          },
        }),
      );

    await expect(getNesRegistryAuthToken()).rejects.toThrow(/No NES registry access group/);
  });
});

function createPrincipalResponse(tenant: number): Response {
  return createGraphQLResponse({
    iam: {
      principal: {
        tenant,
      },
    },
  });
}

function createGraphQLResponse(data: unknown): Response {
  return {
    ok: true,
    status: 200,
    async json() {
      return { data };
    },
  } as Response;
}
