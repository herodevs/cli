import crypto from 'node:crypto';
import http from 'node:http';
import { createInterface } from 'node:readline';
import { URL } from 'node:url';
import { Command } from '@oclif/core';
import { CLIENT_ID, REALM_URL } from '../../config/auth.config.ts';
import { persistTokenResponse } from '../../service/auth.svc.ts';
import type { TokenResponse } from '../../types/auth.ts';
import { openInBrowser } from '../../utils/open-in-browser.ts';

export default class AuthLogin extends Command {
  static description = 'OAuth CLI login';

  private server?: http.Server;
  private readonly port = parseInt(process.env.OAUTH_CALLBACK_PORT || '4000', 10);
  private readonly redirectUri = process.env.OAUTH_CALLBACK_REDIRECT || `http://localhost:${this.port}/oauth2/callback`;
  private readonly realmUrl = REALM_URL;
  private readonly clientId = CLIENT_ID;

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
    }
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

  private async stopServer() {
    if (this.server) {
      await new Promise<void>((resolve, reject) => this.server?.close((err) => (err ? reject(err) : resolve())));
      this.server = undefined;
    }
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
