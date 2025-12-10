import { Entry } from '@napi-rs/keyring';
import { createOAuthDeviceAuth, type GitHubAppStrategyOptions } from '@octokit/auth-oauth-device';
import {
  GH_ACCESS_KEY,
  GH_API_BASE_URL,
  GH_API_VERSION,
  GH_APP_OAUTH_SETTINGS,
  GH_REFRESH_KEY,
  GH_REPOS_PER_PAGE,
  GH_SERVICE_NAME,
} from '../config/gh.config.js';
import type { Repo } from '../types/gh/repo.js';

const accessTokenEntry = new Entry(GH_SERVICE_NAME, GH_ACCESS_KEY);
const refreshTokenEntry = new Entry(GH_SERVICE_NAME, GH_REFRESH_KEY);

const ghFetch = async <T>(endpoint: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE', body?: unknown) => {
  const response = await fetch(`${GH_API_BASE_URL}${endpoint}`, {
    method,
    headers: {
      Accept: 'application/vnd.github+json',
      ...(accessTokenEntry.getPassword() ? { Authorization: `Bearer ${accessTokenEntry.getPassword()}` } : {}),
      'X-GitHub-Api-Version': GH_API_VERSION,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  if (!response.ok) {
    switch (response.status) {
      case 401:
        throw new Error(
          `Unauthorized access to ${GH_API_BASE_URL}${endpoint}. Please authorize the CLI running the gh authorize command`,
        );
      case 403:
        throw new Error(`Forbidden access to ${GH_API_BASE_URL}${endpoint}`);
    }
    throw new Error(`An error occurred while fetching [${endpoint}]`);
  }
  return (await response.json()) as unknown as T;
};

export const userAccessToken = () => accessTokenEntry.getPassword();
export const userRefreshToken = () => refreshTokenEntry.getPassword();

export const userLogout = () => {
  accessTokenEntry.deletePassword();
  refreshTokenEntry.deletePassword();
};

export const authenticateWithDeviceFlow = async (onVerification: GitHubAppStrategyOptions['onVerification']) => {
  const auth = createOAuthDeviceAuth({
    ...GH_APP_OAUTH_SETTINGS,
    onVerification,
  });

  try {
    const authResponse = await auth({
      type: 'oauth',
    });
    if ('refreshToken' in authResponse) {
      refreshTokenEntry.setPassword(authResponse.refreshToken);
    }
    accessTokenEntry.setPassword(authResponse.token);
  } catch (_err) {
    throw new Error(`An error occurred while trying to authorize with GitHub`);
  }
};

export const getUserRepositories = async (page: number = 1, per_page: number = GH_REPOS_PER_PAGE) => {
  return await ghFetch<Repo[]>(`user/repos?per_page=${per_page}&page=${page}`, 'GET');
};
