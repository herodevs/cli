/**
 * ESM loader hooks that replace auth.svc.ts with a mock during E2E tests.
 * This avoids hitting the system keyring (unavailable in CI).
 */
export async function load(url, context, nextLoad) {
  if (url.endsWith('/service/auth.svc.ts') || url.endsWith('/service/auth.svc.js')) {
    return {
      format: 'module',
      shortCircuit: true,
      source: `
        export class AuthError extends Error {
          constructor(message, code) {
            super(message);
            this.name = 'AuthError';
            this.code = code;
          }
        }
        export function persistTokenResponse() { return Promise.resolve(); }
        export function getAccessToken() { return Promise.resolve('test-token'); }
        export function requireAccessToken() { return Promise.resolve('test-token'); }
        export function logoutLocally() { return Promise.resolve(); }
        export function requireAccessTokenForScan() { return Promise.resolve('test-token'); }
      `,
    };
  }

  return nextLoad(url, context);
}
