import { Entry } from '@napi-rs/keyring';
import { createOAuthDeviceAuth, type GitHubAppStrategyOptions } from '@octokit/auth-oauth-device';
import { GH_ACCESS_KEY, GH_APP_OAUTH_SETTINGS, GH_REFRESH_KEY, GH_SERVICE_NAME } from '../config/gh.config.js';

const accessTokenEntry = new Entry(GH_SERVICE_NAME, GH_ACCESS_KEY);
const refreshTokenEntry = new Entry(GH_SERVICE_NAME, GH_REFRESH_KEY);

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
