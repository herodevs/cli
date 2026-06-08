const DEFAULT_KC_BASE = 'https://auth.herodevs.com/idp';
const DEFAULT_KC_REALM = 'universe';
const DEFAULT_CLIENT_ID = 'eol-ds';

export function getRealmUrl() {
  if (process.env.OAUTH_CONNECT_URL) {
    return process.env.OAUTH_CONNECT_URL;
  }
  const base = process.env.NES_KC_BASE || DEFAULT_KC_BASE;
  const realm = process.env.NES_KC_REALM || DEFAULT_KC_REALM;
  return `${base}/realms/${realm}/protocol/openid-connect`;
}

export function getClientId() {
  return process.env.OAUTH_CLIENT_ID || DEFAULT_CLIENT_ID;
}
