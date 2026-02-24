import type { Config } from '@oclif/core';
import { type Mock, type MockedFunction, vi } from 'vitest';
import { ensureUserSetup } from '../../../src/api/user-setup.client.ts';
import AuthLogin from '../../../src/commands/auth/login.ts';
import { persistTokenResponse } from '../../../src/service/auth.svc.ts';
import { openInBrowser } from '../../../src/utils/open-in-browser.ts';

type ServerRequest = { url?: string };
type ServerResponse = { writeHead: Mock; end: Mock };
type ServerHandler = (req: ServerRequest, res: ServerResponse) => void;

interface ServerStub {
  handler: ServerHandler;
  listen: MockedFunction<(port: number, cb?: () => void) => ServerStub>;
  close: MockedFunction<(cb?: (err?: Error) => void) => ServerStub>;
  on: MockedFunction<(event: string, cb: (err: Error) => void) => ServerStub>;
  triggerRequest: (url?: string) => { writeHead: Mock; end: Mock };
  emitError: (error: Error) => void;
}

const serverInstances: ServerStub[] = [];

class ServerNotRunningError extends Error implements NodeJS.ErrnoException {
  code = 'ERR_SERVER_NOT_RUNNING';

  constructor() {
    super('Server is not running.');
    this.name = 'ServerNotRunningError';
  }
}

const createServerStub = (handler: ServerHandler): ServerStub => {
  let errorListener: ((error: Error) => void) | undefined;
  let closed = false;
  const stub: ServerStub = {
    handler,
    listen: vi.fn((_port: number, cb?: () => void) => {
      if (cb) {
        setImmediate(cb);
      }

      return stub;
    }),
    close: vi.fn((cb?: (err?: Error) => void) => {
      const closeError = closed ? new ServerNotRunningError() : undefined;
      closed = true;
      setImmediate(() => cb?.(closeError));
      return stub;
    }),
    on: vi.fn((event: string, cb: (err: Error) => void) => {
      if (event === 'error') {
        errorListener = cb;
      }

      return stub;
    }),
    triggerRequest: (url?: string) => {
      const res = {
        writeHead: vi.fn(),
        end: vi.fn(),
      };

      stub.handler({ url } as ServerRequest, res as ServerResponse);
      return res;
    },
    emitError: (error: Error) => {
      errorListener?.(error);
    },
  };

  return stub;
};

vi.mock('http', () => ({
  __esModule: true,
  default: {
    createServer: vi.fn((handler: ServerHandler) => {
      const server = createServerStub(handler);
      serverInstances.push(server);
      return server;
    }),
  },
}));

vi.mock('../../../src/api/user-setup.client.ts', () => ({
  __esModule: true,
  ensureUserSetup: vi.fn(),
}));

vi.mock('../../../src/config/constants.ts', async (importOriginal) => importOriginal());

vi.mock('../../../src/utils/open-in-browser.ts', () => ({
  __esModule: true,
  openInBrowser: vi.fn(),
}));

const questionMock = vi.fn<(question: string, callback: (answer: string) => void) => void>();
const closeMock = vi.fn<() => void>();

vi.mock('node:readline', () => ({
  __esModule: true,
  createInterface: vi.fn(() => ({
    question: questionMock,
    close: closeMock,
  })),
}));

vi.mock('../../../src/service/auth.svc.ts', () => ({
  __esModule: true,
  persistTokenResponse: vi.fn().mockResolvedValue(undefined),
}));

const openMock = vi.mocked(openInBrowser) as MockedFunction<typeof openInBrowser>;
const persistTokenResponseMock = vi.mocked(persistTokenResponse);
const ensureUserSetupMock = vi.mocked(ensureUserSetup);

const flushAsync = () => new Promise((resolve) => setImmediate(resolve));

const getLatestServer = () => {
  const server = serverInstances.at(-1);
  if (!server) {
    throw new Error('HTTP server stub was not initialized');
  }

  return server;
};

const sendCallbackThroughStub = (params: Record<string, string | undefined>) => {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) {
      search.append(key, value);
    }
  }

  const query = search.toString();
  const path = `/oauth2/callback${query ? `?${query}` : ''}`;
  return getLatestServer().triggerRequest(path);
};

const createCommand = (port: number) => {
  process.env.OAUTH_CALLBACK_PORT = `${port}`;
  const mockConfig = {} as Config;
  return new AuthLogin([], mockConfig);
};

describe('AuthLogin', () => {
  beforeEach(() => {
    questionMock.mockImplementation((_q, cb) => cb(''));
    closeMock.mockClear();
    openMock.mockResolvedValue(undefined);
    ensureUserSetupMock.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.clearAllMocks();
    delete process.env.OAUTH_CALLBACK_PORT;
    serverInstances.length = 0;
    persistTokenResponseMock.mockClear();
  });

  describe('startServerAndAwaitCode', () => {
    const authUrl = 'https://login.example/auth';
    const basePort = 4900;

    it('resolves with the authorization code when the callback is valid', async () => {
      const command = createCommand(basePort);
      const state = 'expected-state';
      const pendingCode = (
        command as unknown as { startServerAndAwaitCode: (url: string, state: string) => Promise<string> }
      ).startServerAndAwaitCode(authUrl, state);
      const server = getLatestServer();

      await flushAsync();
      sendCallbackThroughStub({ code: 'test-code', state });

      await expect(pendingCode).resolves.toBe('test-code');
      expect(questionMock).toHaveBeenCalledWith(expect.stringContaining(authUrl), expect.any(Function));
      expect(closeMock).toHaveBeenCalledTimes(1);
      expect(openMock).toHaveBeenCalledWith(authUrl);
      expect(server.close).toHaveBeenCalledTimes(1);
    });

    it('rejects when the callback is missing the state parameter', async () => {
      const command = createCommand(basePort + 1);
      const pendingCode = (
        command as unknown as { startServerAndAwaitCode: (url: string, state: string) => Promise<string> }
      ).startServerAndAwaitCode(authUrl, 'expected-state');
      const server = getLatestServer();

      await flushAsync();
      sendCallbackThroughStub({ code: 'test-code', state: undefined });

      await expect(pendingCode).rejects.toThrow('Missing state parameter in callback');
      expect(server.close).toHaveBeenCalledTimes(1);
    });

    it('rejects when the callback state does not match', async () => {
      const command = createCommand(basePort + 2);
      const pendingCode = (
        command as unknown as { startServerAndAwaitCode: (url: string, state: string) => Promise<string> }
      ).startServerAndAwaitCode(authUrl, 'expected-state');
      const server = getLatestServer();

      await flushAsync();
      sendCallbackThroughStub({ code: 'test-code', state: 'different' });

      await expect(pendingCode).rejects.toThrow('State verification failed');
      expect(server.close).toHaveBeenCalledTimes(1);
    });

    it('rejects with guidance when callback returns already_logged_in', async () => {
      const command = createCommand(basePort + 3);
      const pendingCode = (
        command as unknown as { startServerAndAwaitCode: (url: string, state: string) => Promise<string> }
      ).startServerAndAwaitCode(authUrl, 'expected-state');
      const server = getLatestServer();

      await flushAsync();
      const response = sendCallbackThroughStub({ error: 'already_logged_in', state: 'expected-state' });

      expect(response.writeHead).toHaveBeenCalledWith(400, { 'Content-Type': 'text/plain' });
      expect(response.end).toHaveBeenCalledWith(
        "You're already signed in. We'll continue for you. Return to the terminal.",
      );
      await expect(pendingCode).rejects.toThrow(`You're already signed in. Run "hd auth login" again to continue.`);
      expect(server.close).toHaveBeenCalledTimes(1);
    });

    it('rejects when callback returns a generic OAuth error', async () => {
      const command = createCommand(basePort + 4);
      const pendingCode = (
        command as unknown as { startServerAndAwaitCode: (url: string, state: string) => Promise<string> }
      ).startServerAndAwaitCode(authUrl, 'expected-state');
      const server = getLatestServer();

      await flushAsync();
      const response = sendCallbackThroughStub({
        error: 'access_denied',
        error_description: 'User denied access',
        state: 'expected-state',
      });

      expect(response.writeHead).toHaveBeenCalledWith(400, { 'Content-Type': 'text/plain' });
      expect(response.end).toHaveBeenCalledWith("We couldn't complete sign-in. Return to the terminal and try again.");
      await expect(pendingCode).rejects.toThrow(`We couldn't complete sign-in. Please run "hd auth login" again.`);
      expect(server.close).toHaveBeenCalledTimes(1);
    });

    it('rejects with guidance when callback returns different_user_authenticated', async () => {
      const command = createCommand(basePort + 5);
      const pendingCode = (
        command as unknown as { startServerAndAwaitCode: (url: string, state: string) => Promise<string> }
      ).startServerAndAwaitCode(authUrl, 'expected-state');
      const server = getLatestServer();

      await flushAsync();
      const response = sendCallbackThroughStub({ error: 'different_user_authenticated', state: 'expected-state' });

      expect(response.writeHead).toHaveBeenCalledWith(400, { 'Content-Type': 'text/plain' });
      expect(response.end).toHaveBeenCalledWith(
        "You're signed in with a different account than this sign-in attempt. Return to the terminal.",
      );
      await expect(pendingCode).rejects.toThrow(
        `You're signed in with a different account than this sign-in attempt. ` +
          `Choose another account, or reset this sign-in session and try again. ` +
          `If needed, run "hd auth logout" and then "hd auth login".`,
      );
      expect(server.close).toHaveBeenCalledTimes(1);
    });

    it('rejects when the callback omits the authorization code', async () => {
      const command = createCommand(basePort + 6);
      const pendingCode = (
        command as unknown as { startServerAndAwaitCode: (url: string, state: string) => Promise<string> }
      ).startServerAndAwaitCode(authUrl, 'expected-state');
      const server = getLatestServer();

      await flushAsync();
      sendCallbackThroughStub({ state: 'expected-state' });

      await expect(pendingCode).rejects.toThrow('No code returned from Keycloak');
      expect(server.close).toHaveBeenCalledTimes(1);
    });

    it('rejects when the callback URL is invalid', async () => {
      const command = createCommand(basePort + 7);
      const pendingCode = (
        command as unknown as { startServerAndAwaitCode: (url: string, state: string) => Promise<string> }
      ).startServerAndAwaitCode(authUrl, 'expected-state');
      const server = getLatestServer();

      await flushAsync();
      const response = server.triggerRequest('http://%');

      expect(response.writeHead).toHaveBeenCalledWith(400, { 'Content-Type': 'text/plain' });
      expect(response.end).toHaveBeenCalledWith('Invalid callback URL');
      await expect(pendingCode).rejects.toThrow('Invalid callback URL');
      expect(server.close).toHaveBeenCalledTimes(1);
    });

    it('returns a 400 response when the incoming request is missing a URL', async () => {
      const command = createCommand(basePort + 8);
      const pendingCode = (
        command as unknown as { startServerAndAwaitCode: (url: string, state: string) => Promise<string> }
      ).startServerAndAwaitCode(authUrl, 'expected-state');
      const server = getLatestServer();

      await flushAsync();
      const response = server.triggerRequest(undefined);

      expect(response.writeHead).toHaveBeenCalledWith(400);
      expect(response.end).toHaveBeenCalledWith('Invalid request');

      const shutdownError = new Error('test shutdown');
      server.emitError(shutdownError);
      await expect(pendingCode).rejects.toBe(shutdownError);
      expect(server.close).toHaveBeenCalledTimes(1);
    });

    it('responds with not found for unrelated paths', async () => {
      const command = createCommand(basePort + 9);
      const pendingCode = (
        command as unknown as { startServerAndAwaitCode: (url: string, state: string) => Promise<string> }
      ).startServerAndAwaitCode(authUrl, 'expected-state');
      const server = getLatestServer();

      await flushAsync();
      const response = server.triggerRequest('/not-supported');

      expect(response.writeHead).toHaveBeenCalledWith(404);
      expect(response.end).toHaveBeenCalledWith();

      const shutdownError = new Error('not found handled');
      server.emitError(shutdownError);
      await expect(pendingCode).rejects.toBe(shutdownError);
      expect(server.close).toHaveBeenCalledTimes(1);
    });

    it('rejects when the local HTTP server emits an error', async () => {
      const command = createCommand(basePort + 10);
      const pendingCode = (
        command as unknown as { startServerAndAwaitCode: (url: string, state: string) => Promise<string> }
      ).startServerAndAwaitCode(authUrl, 'expected-state');
      const server = getLatestServer();

      await flushAsync();
      const error = new Error('listener failed');
      server.emitError(error);

      await expect(pendingCode).rejects.toBe(error);
      expect(server.close).toHaveBeenCalledTimes(1);
    });

    it('warns and allows manual navigation when browser launch fails', async () => {
      openMock.mockRejectedValueOnce(new Error('browser unavailable'));
      const command = createCommand(basePort + 11);
      const warnSpy = vi
        .spyOn(command as unknown as { warn: (...args: unknown[]) => unknown }, 'warn')
        .mockImplementation(() => {});
      const state = 'expected-state';

      try {
        const pendingCode = (
          command as unknown as { startServerAndAwaitCode: (url: string, state: string) => Promise<string> }
        ).startServerAndAwaitCode(authUrl, state);
        const server = getLatestServer();

        await flushAsync();

        expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Failed to open browser automatically'));

        sendCallbackThroughStub({ code: 'manual-code', state });
        await expect(pendingCode).resolves.toBe('manual-code');
        expect(server.close).toHaveBeenCalledTimes(1);
      } finally {
        warnSpy.mockRestore();
      }
    });

    it('deduplicates shutdown when callback success and server error race', async () => {
      const command = createCommand(basePort + 12);
      const state = 'expected-state';
      const pendingCode = (
        command as unknown as { startServerAndAwaitCode: (url: string, state: string) => Promise<string> }
      ).startServerAndAwaitCode(authUrl, state);
      const server = getLatestServer();
      const warnSpy = vi
        .spyOn(command as unknown as { warn: (...args: unknown[]) => unknown }, 'warn')
        .mockImplementation(() => {});

      try {
        await flushAsync();
        sendCallbackThroughStub({ code: 'race-code', state });
        server.emitError(new Error('late listener error'));

        await expect(pendingCode).resolves.toBe('race-code');
        expect(server.close).toHaveBeenCalledTimes(1);
        expect(warnSpy).not.toHaveBeenCalledWith(expect.stringContaining('Failed to stop local OAuth callback server'));
      } finally {
        warnSpy.mockRestore();
      }
    });
  });

  describe('exchangeCodeForToken', () => {
    it('posts the authorization code and returns the parsed token response', async () => {
      const command = createCommand(5000);
      const mockResponse = { access_token: 'abc123' };
      const jsonMock = vi.fn().mockResolvedValue(mockResponse);
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: true,
        json: jsonMock,
      } as unknown as Response);

      try {
        const token = await (
          command as unknown as { exchangeCodeForToken: (code: string, verifier: string) => Promise<unknown> }
        ).exchangeCodeForToken('code-123', 'verifier-456');

        expect(fetchSpy).toHaveBeenCalledTimes(1);
        const [url, options] = fetchSpy.mock.calls[0];
        expect(url).toMatch(/\/token$/);
        expect(options).toMatchObject({
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        });
        expect(options?.body).toContain('code=code-123');
        expect(options?.body).toContain('code_verifier=verifier-456');
        expect(options?.body).toContain('grant_type=authorization_code');
        expect(token).toEqual(mockResponse);
      } finally {
        fetchSpy.mockRestore();
      }
    });

    it('throws an error that includes the response body when the exchange fails', async () => {
      const command = createCommand(5001);
      const textMock = vi.fn().mockResolvedValue('error-details');
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Server Error',
        text: textMock,
      } as unknown as Response);

      try {
        await expect(
          (
            command as unknown as { exchangeCodeForToken: (code: string, verifier: string) => Promise<unknown> }
          ).exchangeCodeForToken('code-123', 'verifier-456'),
        ).rejects.toThrow('Token exchange failed: 500 Server Error');
        expect(textMock).toHaveBeenCalled();
      } finally {
        fetchSpy.mockRestore();
      }
    });
  });

  describe('run', () => {
    it('stores tokens after successful authentication', async () => {
      const command = createCommand(6000);
      const tokenResponse = { access_token: 'access', refresh_token: 'refresh' };
      const commandWithInternals = command as unknown as {
        startServerAndAwaitCode: (...args: unknown[]) => Promise<string>;
        exchangeCodeForToken: (...args: unknown[]) => Promise<unknown>;
      };
      vi.spyOn(commandWithInternals, 'startServerAndAwaitCode').mockResolvedValue('code-123');
      vi.spyOn(commandWithInternals, 'exchangeCodeForToken').mockResolvedValue(tokenResponse);

      await command.run();

      expect(persistTokenResponseMock).toHaveBeenCalledWith(tokenResponse);
      expect(ensureUserSetupMock).toHaveBeenCalledTimes(1);
      expect(ensureUserSetupMock).toHaveBeenCalledWith({ preferOAuth: true });
    });

    it('runs user setup after login', async () => {
      const command = createCommand(6001);
      const tokenResponse = { access_token: 'access', refresh_token: 'refresh' };
      const commandWithInternals = command as unknown as {
        startServerAndAwaitCode: (...args: unknown[]) => Promise<string>;
        exchangeCodeForToken: (...args: unknown[]) => Promise<unknown>;
      };
      vi.spyOn(commandWithInternals, 'startServerAndAwaitCode').mockResolvedValue('code-123');
      vi.spyOn(commandWithInternals, 'exchangeCodeForToken').mockResolvedValue(tokenResponse);

      await command.run();

      expect(ensureUserSetupMock).toHaveBeenCalledTimes(1);
      expect(ensureUserSetupMock).toHaveBeenCalledWith({ preferOAuth: true });
    });

    it('fails login when user setup fails', async () => {
      ensureUserSetupMock.mockRejectedValueOnce(new Error('setup failed'));
      const command = createCommand(6002);
      const tokenResponse = { access_token: 'access', refresh_token: 'refresh' };
      const commandWithInternals = command as unknown as {
        startServerAndAwaitCode: (...args: unknown[]) => Promise<string>;
        exchangeCodeForToken: (...args: unknown[]) => Promise<unknown>;
      };
      vi.spyOn(commandWithInternals, 'startServerAndAwaitCode').mockResolvedValue('code-123');
      vi.spyOn(commandWithInternals, 'exchangeCodeForToken').mockResolvedValue(tokenResponse);

      await expect(command.run()).rejects.toThrow('User setup failed');
    });
  });
});
