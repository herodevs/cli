import crypto from 'node:crypto';
import http from 'node:http';
import { createInterface } from 'node:readline';
import { URL } from 'node:url';
import { Command } from '@oclif/core';
import { ensureUserSetup } from '../../api/user-setup.client.ts';
import { OAUTH_CALLBACK_ERROR_CODES } from '../../config/constants.ts';
import { persistTokenResponse } from '../../service/auth.svc.ts';
import { getClientId, getRealmUrl } from '../../service/auth-config.svc.ts';
import { debugLogger, getErrorMessage } from '../../service/log.svc.ts';
import type { TokenResponse } from '../../types/auth.ts';
import { openInBrowser } from '../../utils/open-in-browser.ts';

export default class AuthLogin extends Command {
  static description = 'OAuth CLI login';

  private server?: http.Server;
  private stopServerPromise?: Promise<void>;
  private readonly port = parseInt(process.env.OAUTH_CALLBACK_PORT || '4000', 10);
  private readonly redirectUri = process.env.OAUTH_CALLBACK_REDIRECT || `http://localhost:${this.port}/oauth2/callback`;
  private readonly realmUrl = getRealmUrl();
  private readonly clientId = getClientId();

  async run() {
    if (typeof (this.config as { runHook?: unknown }).runHook === 'function') {
      await this.parse(AuthLogin);
    }

    const codeVerifier = crypto.randomBytes(32).toString('base64url');
    const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');
    const state = crypto.randomBytes(16).toString('hex');

    const authUrl =
      `${this.realmUrl}/auth?` +
      `client_id=${this.clientId}` +
      `&response_type=code` +
      `&redirect_uri=${encodeURIComponent(this.redirectUri)}` +
      `&code_challenge=${codeChallenge}` +
      `&code_challenge_method=S256` +
      `&state=${state}`;

    const code = await this.startServerAndAwaitCode(authUrl, state);
    const token = await this.exchangeCodeForToken(code, codeVerifier);

    try {
      await persistTokenResponse(token);
    } catch (error) {
      this.warn(`Failed to store tokens securely: ${error instanceof Error ? error.message : error}`);
      return;
    }

    try {
      await ensureUserSetup({ preferOAuth: true });
    } catch (error) {
      this.error(`User setup failed. ${getErrorMessage(error)}`);
    }

    this.log('\nLogin completed successfully.');
  }

  private startServerAndAwaitCode(authUrl: string, expectedState: string): Promise<string> {
    return new Promise((resolve, reject) => {
      this.server = http.createServer((req, res) => {
        if (!req.url) {
          res.writeHead(400);
          res.end('Invalid request');
          return;
        }

        let parsedUrl: URL;
        try {
          parsedUrl = new URL(req.url, `http://localhost:${this.port}`);
        } catch {
          res.writeHead(400, { 'Content-Type': 'text/plain' });
          res.end('Invalid callback URL');
          this.stopServer();
          reject(new Error('Invalid callback URL'));
          return;
        }

        if (parsedUrl.pathname === '/oauth2/callback') {
          const code = parsedUrl.searchParams.get('code');
          const state = parsedUrl.searchParams.get('state');
          const oauthError = parsedUrl.searchParams.get('error');
          const oauthErrorDescription = parsedUrl.searchParams.get('error_description');

          if (!state) {
            res.writeHead(400, { 'Content-Type': 'text/plain' });
            res.end('Missing state parameter.');
            this.stopServer();
            return reject(new Error('Missing state parameter in callback'));
          }

          if (state !== expectedState) {
            res.writeHead(400, { 'Content-Type': 'text/plain' });
            res.end('State verification failed. Please restart the login flow.');
            this.stopServer();
            return reject(new Error('State verification failed'));
          }

          if (oauthError) {
            const isAlreadyLoggedIn = oauthError === OAUTH_CALLBACK_ERROR_CODES.ALREADY_LOGGED_IN;
            const isDifferentUserAuthenticated = oauthError === OAUTH_CALLBACK_ERROR_CODES.DIFFERENT_USER_AUTHENTICATED;
            debugLogger(
              'OAuth callback returned error: %s (%s)',
              oauthError,
              oauthErrorDescription ?? 'no description',
            );
            let browserMessage: string;
            let cliErrorMessage: string;

            if (isAlreadyLoggedIn) {
              browserMessage = "You're already signed in. We'll continue for you. Return to the terminal.";
              cliErrorMessage = `You're already signed in. Run "hd auth login" again to continue.`;
            } else if (isDifferentUserAuthenticated) {
              browserMessage =
                "You're signed in with a different account than this sign-in attempt. Return to the terminal.";
              cliErrorMessage =
                `You're signed in with a different account than this sign-in attempt. ` +
                `Choose another account, or reset this sign-in session and try again. ` +
                `If needed, run "hd auth logout" and then "hd auth login".`;
            } else {
              browserMessage = "We couldn't complete sign-in. Return to the terminal and try again.";
              cliErrorMessage = `We couldn't complete sign-in. Please run "hd auth login" again.`;
            }

            res.writeHead(400, { 'Content-Type': 'text/plain' });
            res.end(browserMessage);
            this.stopServer();
            return reject(new Error(cliErrorMessage));
          }

          if (code) {
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end('Login successful. You can close this window.');
            this.stopServer();
            resolve(code);
          } else {
            res.writeHead(400, { 'Content-Type': 'text/plain' });
            res.end('No authorization code returned. Please try again.');
            this.stopServer();
            reject(new Error('No code returned from Keycloak'));
          }
        } else {
          res.writeHead(404);
          res.end();
        }
      });

      this.server.listen(this.port, async () => {
        await new Promise<void>((resolve) => {
          const rl = createInterface({ input: process.stdin, output: process.stdout });
          rl.question(`Press Enter to navigate to: ${authUrl}\n`, () => {
            rl.close();
            resolve();
          });
        });

        try {
          await openInBrowser(authUrl);
        } catch (err) {
          this.warn(
            `Failed to open browser automatically. Please open this URL manually:\n${authUrl}\n${err instanceof Error ? err.message : err}`,
          );
        }
      });

      this.server.on('error', (err) => {
        this.stopServer();
        reject(err);
      });
    });
  }

  private stopServer(): Promise<void> {
    if (this.stopServerPromise) {
      return this.stopServerPromise;
    }

    const server = this.server;
    this.server = undefined;

    if (!server) {
      return Promise.resolve();
    }

    const stopPromise = new Promise<void>((resolve) => {
      const timeoutMs = 1000;
      let settled = false;
      let timeout: ReturnType<typeof setTimeout> | undefined;

      const complete = (err?: Error) => {
        if (settled) {
          return;
        }

        settled = true;
        if (timeout) {
          clearTimeout(timeout);
          timeout = undefined;
        }

        const code = (err as NodeJS.ErrnoException | undefined)?.code;
        if (err && code !== 'ERR_SERVER_NOT_RUNNING') {
          this.warn('Failed to stop local OAuth callback server.');
          debugLogger('Failed to stop local OAuth callback server: %s', getErrorMessage(err));
        }

        resolve();
      };

      timeout = setTimeout(() => {
        debugLogger('Timed out while stopping local OAuth callback server after %dms', timeoutMs);
        complete();
      }, timeoutMs);

      try {
        server.close((err) => complete(err));
      } catch (err) {
        complete(err as Error);
      }
    }).finally(() => {
      this.stopServerPromise = undefined;
    });

    this.stopServerPromise = stopPromise;
    return stopPromise;
  }

  private async exchangeCodeForToken(code: string, codeVerifier: string): Promise<TokenResponse> {
    const tokenUrl = `${this.realmUrl}/token`;

    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      code_verifier: codeVerifier,
      code,
    });

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Token exchange failed: ${response.status} ${response.statusText}\n${text}`);
    }

    return response.json() as Promise<TokenResponse>;
  }
}
