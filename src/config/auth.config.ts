const DEFAULT_REALM_URL = 'https://idp.prod.apps.herodevs.io/realms/universe/protocol/openid-connect';
const DEFAULT_CLIENT_ID = 'default-public';
const DEFAULT_SERVICE_NAME = '@herodevs/cli';
const DEFAULT_ACCESS_KEY = 'access-token';
const DEFAULT_REFRESH_KEY = 'refresh-token';

export const REALM_URL = process.env.OAUTH_CONNECT_URL || DEFAULT_REALM_URL;
export const CLIENT_ID = process.env.OAUTH_CLIENT_ID || DEFAULT_CLIENT_ID;
export const SERVICE_NAME = process.env.HD_AUTH_SERVICE_NAME || DEFAULT_SERVICE_NAME;
export const ACCESS_KEY = process.env.HD_AUTH_ACCESS_KEY || DEFAULT_ACCESS_KEY;
export const REFRESH_KEY = process.env.HD_AUTH_REFRESH_KEY || DEFAULT_REFRESH_KEY;
