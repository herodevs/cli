import { config } from '../../config/constants.ts';
import { requireAccessToken } from '../auth.svc.ts';

const graphqlUrl = `${config.graphqlHost}${config.graphqlPath}`;
const NPM_REGISTRY_TOKEN_PROVIDER = 'NES Access Token Provider';
const REGISTRY_TOKEN_OVERRIDE_ENV = 'HD_INSTALL_NPM_REGISTRY_AUTH_TOKEN';

type GraphQLResponse<T> = {
  data?: T;
  errors?: Array<{ message?: string }>;
};

type AccessGroupsResponse = {
  licensing?: {
    groups?: {
      search?: {
        results?: Array<{
          access?: {
            packages?: unknown[];
            subscriptions?: unknown[];
          };
          id?: number;
          name?: string;
          tokens?: Array<{ integrationName?: string }>;
        }>;
      };
    };
  };
};

type PrincipalResponse = {
  iam?: {
    principal?: {
      tenant?: number;
    };
  };
};

const principalQuery = `
query InstallRegistryPrincipal {
  iam {
    principal {
      tenant
    }
  }
}
`;

const accessGroupsQuery = `
query InstallRegistryAccessGroups($input: LicensingAccessGroupsSearchInput!) {
  licensing {
    groups {
      search(input: $input) {
        results {
          id
          name
          tokens {
            integrationName
          }
          access {
            subscriptions { label }
            packages { id }
          }
        }
      }
    }
  }
}
`;

/**
 * Attempts to derive the credential the NES npm registry expects.
 *
 * `hd auth login` stores an OAuth token that is valid for HeroDevs APIs, but the package
 * registry authorizes package downloads with an opaque licensing access-group credential.
 * The current licensing API exposes existing registry credentials only as masks and newly issued
 * access-group tokens are not accepted by the npm registry, so login alone cannot produce a usable
 * registry secret.
 */
export async function getNesRegistryAuthToken(): Promise<string> {
  const apiToken = await requireAccessToken();
  const orgId = await getPrincipalTenantId(apiToken);
  const hasAccessGroup = await hasRegistryAccessGroup(apiToken, orgId);
  if (!hasAccessGroup) {
    throw new Error(
      `No NES registry access group was found for your account. Set ${REGISTRY_TOKEN_OVERRIDE_ENV} for dev/local registry testing, or ask your organization admin to grant NES package access.`,
    );
  }

  throw new Error(
    `Your account has NES registry access, but hd auth login does not expose the registry credential. Set ${REGISTRY_TOKEN_OVERRIDE_ENV} for this install run.`,
  );
}

async function getPrincipalTenantId(authToken: string): Promise<number> {
  const data = await callGraphQL<PrincipalResponse>(authToken, principalQuery, {});
  const tenantId = data.iam?.principal?.tenant;
  if (typeof tenantId !== 'number') {
    throw new Error('NES registry auth principal did not include a tenant ID');
  }
  return tenantId;
}

async function hasRegistryAccessGroup(authToken: string, orgId: number): Promise<boolean> {
  const data = await callGraphQL<AccessGroupsResponse>(authToken, accessGroupsQuery, {
    input: { orgIn: [orgId] },
  });

  const groups = data.licensing?.groups?.search?.results ?? [];
  for (const group of groups) {
    if (typeof group.id !== 'number') {
      continue;
    }

    const packageCount = group.access?.packages?.length ?? 0;
    const subscriptionCount = group.access?.subscriptions?.length ?? 0;
    if (packageCount === 0 && subscriptionCount === 0) {
      continue;
    }

    if ((group.tokens ?? []).some((candidate) => candidate.integrationName === NPM_REGISTRY_TOKEN_PROVIDER)) {
      return true;
    }
  }

  return false;
}

async function callGraphQL<T>(authToken: string, query: string, variables: Record<string, unknown>): Promise<T> {
  const response = await fetch(graphqlUrl, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${authToken}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new Error(`NES registry auth request failed: ${response.status}`);
  }

  const payload = (await response.json()) as GraphQLResponse<T>;
  if (payload.errors?.length) {
    const message = payload.errors[0]?.message ?? 'NES registry auth request failed';
    throw new Error(message);
  }

  if (!payload.data) {
    throw new Error('NES registry auth request returned no data');
  }

  return payload.data;
}
