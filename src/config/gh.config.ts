import type { GitHubAppStrategyOptions } from '@octokit/auth-oauth-device';

const DEFAULT_GH_CLIENT_ID = 'Iv23liIePcrOHZ5tdjx7';
const DEFAULT_GH_SERVICE_NAME = '@herodevs/cli';
const DEFAULT_GH_ACCESS_KEY = 'gh_access_token';
const DEFAULT_GH_REFRESH_KEY = 'gh_refresh_token';

export const GH_CLIENT_ID = process.env.GH_CLIENT_ID ?? DEFAULT_GH_CLIENT_ID;
export const GH_SERVICE_NAME = process.env.GH_SERVICE_NAME ?? DEFAULT_GH_SERVICE_NAME;
export const GH_ACCESS_KEY = process.env.GH_ACCESS_KEY ?? DEFAULT_GH_ACCESS_KEY;
export const GH_REFRESH_KEY = process.env.GH_REFRESH_KEY ?? DEFAULT_GH_REFRESH_KEY;

export const GH_APP_OAUTH_SETTINGS: Pick<GitHubAppStrategyOptions, 'clientType' | 'clientId'> = {
  clientType: 'github-app',
  clientId: GH_CLIENT_ID,
};
