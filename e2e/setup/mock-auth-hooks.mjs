/**
 * ESM loader hooks that replace auth.svc.ts with a mock during E2E tests.
 * This avoids writing encrypted token files during E2E tests.
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
        export const AUTH_ERROR_MESSAGES = {
          UNAUTHENTICATED: 'Please log in to perform this action. To authenticate, please run an "auth login" command.',
          SESSION_EXPIRED: 'Your session has expired. To re-authenticate, please run an "auth login" command.',
          INVALID_TOKEN: 'Your session has expired. To re-authenticate, please run an "auth login" command.',
          FORBIDDEN: 'You do not have permission to perform this action.',
          NOT_LOGGED_IN_GENERIC: 'You are not logged in. Please run an "auth login" command to authenticate.',
        };
        export function persistTokenResponse() { return Promise.resolve(); }
        export function getAccessToken() { return Promise.resolve('test-token'); }
        export function requireAccessToken() { return Promise.resolve('test-token'); }
        export function logoutLocally() { return Promise.resolve(); }
        export function getTokenForScanWithSource() { return Promise.resolve({ token: 'test-token', source: 'oauth' }); }
        export function getTokenProvider() { return () => Promise.resolve('test-token'); }
        export function requireAccessTokenForScan() { return Promise.resolve('test-token'); }
      `,
    };
  }

  return nextLoad(url, context);
}
