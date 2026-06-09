const DEFAULT_REALM_URL = 'https://auth.herodevs.com/idp/realms/universe/protocol/openid-connect';
const DEFAULT_CLIENT_ID = 'eol-ds';

export function getRealmUrl() {
  return process.env.OAUTH_CONNECT_URL || DEFAULT_REALM_URL;
}

export function getClientId() {
  return process.env.OAUTH_CLIENT_ID || DEFAULT_CLIENT_ID;
}
