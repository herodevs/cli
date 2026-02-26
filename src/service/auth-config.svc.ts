const DEFAULT_REALM_URL = 'https://idp.prod.apps.herodevs.io/realms/universe/protocol/openid-connect';
const DEFAULT_CLIENT_ID = 'eol-ds';
const DEFAULT_SERVICE_NAME = '@herodevs/cli';
const DEFAULT_ACCESS_KEY = 'access-token';
const DEFAULT_REFRESH_KEY = 'refresh-token';

export function getRealmUrl() {
  return process.env.OAUTH_CONNECT_URL || DEFAULT_REALM_URL;
}

export function getClientId() {
  return process.env.OAUTH_CLIENT_ID || DEFAULT_CLIENT_ID;
}

export function getTokenServiceName() {
  return process.env.HD_AUTH_SERVICE_NAME || DEFAULT_SERVICE_NAME;
}

export function getAccessTokenKey() {
  return process.env.HD_AUTH_ACCESS_KEY || DEFAULT_ACCESS_KEY;
}

export function getRefreshTokenKey() {
  return process.env.HD_AUTH_REFRESH_KEY || DEFAULT_REFRESH_KEY;
}
