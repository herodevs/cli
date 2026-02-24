import sinon from 'sinon';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Hoisted so the mock is registered before any module loads (avoids real machineIdSync on Windows CI)
const mockNodeMachineId = vi.hoisted(() => ({ machineIdSync: vi.fn(() => 'test-machine-id') }));
vi.mock('node-machine-id', () => ({ __esModule: true, default: mockNodeMachineId }));

describe('analytics.svc', () => {
  const mockAmplitude = {
    init: sinon.spy(),
    setOptOut: sinon.spy(),
    identify: sinon.spy(),
    track: sinon.spy(),
    Identify: sinon.stub().callsFake(() => ({
      set: sinon.stub().returnsThis(),
    })),
    Types: { LogLevel: { None: 0 } },
  };
  const mockConfig = {
    analyticsUrl: 'https://test-analytics.com',
    ciTokenFromEnv: undefined as string | undefined,
  };
  const mockAuthTokenService = { getStoredTokens: sinon.stub().resolves(undefined) };
  let originalEnv: typeof process.env;

  const createAccessToken = (payload: Record<string, unknown>) => {
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
    return `${header}.${body}.sig`;
  };

  async function setupModule() {
    vi.resetModules();
    vi.doMock('@amplitude/analytics-node', () => ({
      __esModule: true,
      init: mockAmplitude.init,
      setOptOut: mockAmplitude.setOptOut,
      identify: mockAmplitude.identify,
      track: mockAmplitude.track,
      Identify: mockAmplitude.Identify,
      Types: mockAmplitude.Types,
    }));
    vi.doMock('../../src/config/constants.ts', () => ({
      __esModule: true,
      config: { ...mockConfig },
    }));
    vi.doMock('../../src/service/auth-token.svc.ts', () => ({
      __esModule: true,
      getStoredTokens: mockAuthTokenService.getStoredTokens,
    }));

    return import('../../src/service/analytics.svc.ts');
  }

  beforeEach(() => {
    originalEnv = { ...process.env };
  });

  afterEach(() => {
    process.env = originalEnv;
    mockAmplitude.init.resetHistory();
    mockAmplitude.setOptOut.resetHistory();
    mockAmplitude.identify.resetHistory();
    mockAmplitude.track.resetHistory();
    mockNodeMachineId.machineIdSync.mockClear();
    mockAmplitude.Identify.resetHistory();
    mockAuthTokenService.getStoredTokens.resetHistory();
    mockAuthTokenService.getStoredTokens.resolves(undefined);
    mockConfig.ciTokenFromEnv = undefined;
  });

  describe('initializeAnalytics', () => {
    it('should call amplitude init with correct parameters', async () => {
      const mod = await setupModule();
      await mod.initializeAnalytics();

      expect(mockAmplitude.init.calledOnce).toBe(true);
      const initCall = mockAmplitude.init.getCall(0);
      expect(initCall.args[0]).toBe('0');
      expect(initCall.args[1]).toEqual({
        flushQueueSize: 2,
        flushIntervalMillis: 250,
        logLevel: 0,
        serverUrl: 'https://test-analytics.com',
      });
    });

    it('should call setOptOut with true when TRACKING_OPT_OUT is true', async () => {
      process.env.TRACKING_OPT_OUT = 'true';

      const mod = await setupModule();
      await mod.initializeAnalytics();

      expect(mockAmplitude.setOptOut.calledOnce).toBe(true);
      expect(mockAmplitude.setOptOut.getCall(0).args[0]).toBe(true);
    });

    it('should call setOptOut with false when TRACKING_OPT_OUT is not true', async () => {
      process.env.TRACKING_OPT_OUT = 'false';

      const mod = await setupModule();
      await mod.initializeAnalytics();

      expect(mockAmplitude.setOptOut.calledOnce).toBe(true);
      expect(mockAmplitude.setOptOut.getCall(0).args[0]).toBe(false);
    });

    it('should call identify with runtime metadata when no stored token exists', async () => {
      const mod = await setupModule();
      await mod.initializeAnalytics();

      expect(mockAmplitude.identify.calledOnce).toBe(true);
      const identifyCall = mockAmplitude.identify.getCall(0);
      const metadata = identifyCall.args[1];

      expect(metadata.device_id).toBe('test-machine-id');
      expect(typeof metadata.platform).toBe('string');
      expect(typeof metadata.os_name).toBe('string');
      expect(typeof metadata.os_version).toBe('string');
      expect(typeof metadata.session_id).toBe('number');
      expect(typeof metadata.app_version).toBe('string');
    });

    it('should emit only one identify when stored token has identity claims', async () => {
      mockAuthTokenService.getStoredTokens.resolves({
        accessToken: createAccessToken({
          sub: 'user-1',
          email: 'dev@herodevs.com',
          company: 'HeroDevs',
          role: 'Software Engineer',
        }),
      });
      const mod = await setupModule();
      await mod.initializeAnalytics();

      expect(mockAmplitude.identify.calledOnce).toBe(true);
      expect(mockAmplitude.track.calledOnce).toBe(true);
      expect(mockAmplitude.track.getCall(0).args[0]).toBe('Identify Call');

      const metadata = mockAmplitude.identify.getCall(0).args[1];
      expect(metadata.user_id).toBe('user-1');
      expect(typeof metadata.platform).toBe('string');
      expect(typeof metadata.os_name).toBe('string');
      expect(typeof metadata.os_version).toBe('string');
      expect(typeof metadata.app_version).toBe('string');
    });

    it('should use env CI token identity when stored token is unavailable', async () => {
      mockConfig.ciTokenFromEnv = createAccessToken({
        sub: 'env-user-1',
        email: 'env@herodevs.com',
        company: 'HeroDevs',
        role: 'Platform Engineer',
      });

      const mod = await setupModule();
      await mod.initializeAnalytics();

      expect(mockAmplitude.identify.calledOnce).toBe(true);
      expect(mockAmplitude.track.calledOnce).toBe(true);
      expect(mockAmplitude.track.getCall(0).args[0]).toBe('Identify Call');
      expect(mockAmplitude.identify.getCall(0).args[1].user_id).toBe('env-user-1');
      expect(mockAmplitude.track.getCall(0).args[2].user_id).toBe('env-user-1');
    });

    it('should handle case when npm_package_version is undefined', async () => {
      process.env.npm_package_version = undefined;

      const mod = await setupModule();
      await mod.initializeAnalytics();

      const identifyCall = mockAmplitude.identify.getCall(0);
      const metadata = identifyCall.args[1];
      expect(metadata.app_version).toBe('unknown');

      const getProperties = sinon.stub().callsFake((context) => {
        expect(context.cli_version).toBe('unknown');
        return {};
      });

      mod.track('test-event', getProperties);
      expect(getProperties.calledOnce).toBe(true);
    });

    it('should await identity refresh during initialization', async () => {
      let resolveTokens: (value: unknown) => void = () => {};
      mockAuthTokenService.getStoredTokens.returns(
        new Promise((resolve) => {
          resolveTokens = resolve;
        }),
      );
      const mod = await setupModule();

      let settled = false;
      const pendingInitialize = mod.initializeAnalytics().then(() => {
        settled = true;
      });

      await Promise.resolve();
      expect(settled).toBe(false);

      resolveTokens(undefined);
      await pendingInitialize;
      expect(settled).toBe(true);
    });

    it('should not throw when amplitude init fails', async () => {
      const originalInit = mockAmplitude.init;
      mockAmplitude.init = sinon.stub().throws(new Error('init-failed'));

      try {
        const mod = await setupModule();
        await expect(mod.initializeAnalytics()).resolves.toBeUndefined();
      } finally {
        mockAmplitude.init = originalInit;
      }
    });
  });

  describe('track', () => {
    it('should call amplitude track with event name and no properties when getProperties is undefined', async () => {
      const mod = await setupModule();
      mod.track('test-event');

      expect(mockAmplitude.track.calledOnce).toBe(true);
      const trackCall = mockAmplitude.track.getCall(0);
      expect(trackCall.args[0]).toBe('test-event');
      expect(trackCall.args[1]).toEqual({ source: 'cli' });
      expect(typeof trackCall.args[2].device_id).toBe('string');
      expect(typeof trackCall.args[2].session_id).toBe('number');
    });

    it('should call amplitude track with event name and properties when getProperties returns data', async () => {
      const mod = await setupModule();
      const testProperties = { eol_true_count: 5 };
      const getProperties = sinon.stub().returns(testProperties);

      mod.track('test-event', getProperties);

      expect(mockAmplitude.track.calledOnce).toBe(true);
      const trackCall = mockAmplitude.track.getCall(0);
      expect(trackCall.args[0]).toBe('test-event');
      expect(trackCall.args[1]).toEqual({ source: 'cli', ...testProperties });
      expect(typeof trackCall.args[2].device_id).toBe('string');
      expect(typeof trackCall.args[2].session_id).toBe('number');
    });

    it('should merge properties into analyticsContext when getProperties returns data', async () => {
      const mod = await setupModule();
      const firstProperties = { eol_true_count: 3 };
      const secondProperties = { eol_unknown_count: 2 };

      mod.track('test-event-1', () => firstProperties);

      const getSecondProperties = sinon.stub().callsFake((context) => {
        expect(context.eol_true_count).toBe(3);
        return secondProperties;
      });

      mod.track('test-event-2', getSecondProperties);

      expect(getSecondProperties.calledOnce).toBe(true);
      expect(mockAmplitude.track.calledTwice).toBe(true);
    });

    it('should preserve existing analyticsContext when getProperties returns undefined', async () => {
      const mod = await setupModule();
      const initialProperties = { eol_true_count: 5 };

      mod.track('test-event-1', () => initialProperties);

      const getUndefinedProperties = sinon.stub().callsFake((context) => {
        expect(context.eol_true_count).toBe(5);
        return undefined;
      });

      mod.track('test-event-2', getUndefinedProperties);

      expect(getUndefinedProperties.calledOnce).toBe(true);
      expect(mockAmplitude.track.calledTwice).toBe(true);

      // Second track call should include source only.
      const secondTrackCall = mockAmplitude.track.getCall(1);
      expect(secondTrackCall.args[1]).toEqual({ source: 'cli' });
    });

    it('should pass correct device_id and session_id to amplitude track', async () => {
      const mod = await setupModule();
      mod.track('test-event');

      expect(mockAmplitude.track.calledOnce).toBe(true);
      const trackCall = mockAmplitude.track.getCall(0);
      const eventOptions = trackCall.args[2];

      expect(eventOptions.device_id).toBe('test-machine-id');
      expect(typeof eventOptions.session_id).toBe('number');
      expect(eventOptions.session_id).toBeGreaterThan(0);
    });

    it('should include user_id in event options after identity refresh', async () => {
      const mod = await setupModule();
      mockAuthTokenService.getStoredTokens.resolves({
        accessToken: createAccessToken({
          sub: 'user-123',
          email: 'dev@herodevs.com',
          company: 'HeroDevs',
          role: 'Software Engineer',
        }),
      });

      await mod.refreshIdentityFromStoredToken();
      mod.track('test-event');

      expect(mockAmplitude.track.callCount).toBe(2);
      const trackCall = mockAmplitude.track.getCall(1);
      expect(trackCall.args[2].user_id).toBe('user-123');
    });

    it('should not throw when amplitude track throws synchronously', async () => {
      const originalTrack = mockAmplitude.track;
      mockAmplitude.track = sinon.stub().throws(new Error('sync-track-failed'));

      try {
        const mod = await setupModule();
        await expect(mod.track('test-event').promise).resolves.toBeUndefined();
      } finally {
        mockAmplitude.track = originalTrack;
      }
    });

    it('should not reject when amplitude track promise fails asynchronously', async () => {
      const originalTrack = mockAmplitude.track;
      mockAmplitude.track = sinon.stub().callsFake(() => ({
        promise: Promise.resolve().then(() => {
          throw new Error('async-track-failed');
        }),
      }));

      try {
        const mod = await setupModule();
        await expect(mod.track('test-event').promise).resolves.toBeUndefined();
      } finally {
        mockAmplitude.track = originalTrack;
      }
    });
  });

  describe('refreshIdentityFromStoredToken', () => {
    it('should set identity user properties and emit Identify Call with source cli', async () => {
      const mod = await setupModule();
      mockAuthTokenService.getStoredTokens.resolves({
        accessToken: createAccessToken({
          sub: 'user-1',
          email: 'dev@herodevs.com',
          company: 'HeroDevs',
          role: 'Software Engineer',
        }),
      });

      await mod.refreshIdentityFromStoredToken();

      expect(mockAmplitude.identify.calledOnce).toBe(true);
      expect(mockAmplitude.track.calledOnce).toBe(true);
      const identifyBuilder = mockAmplitude.Identify.getCall(0).returnValue as { set: sinon.SinonStub };
      expect(identifyBuilder.set.calledWith('email', 'dev@herodevs.com')).toBe(true);
      expect(identifyBuilder.set.calledWith('organization_name', 'HeroDevs')).toBe(true);
      expect(identifyBuilder.set.calledWith('role', 'Software Engineer')).toBe(true);
      expect(identifyBuilder.set.calledWith('user_id', 'user-1')).toBe(true);

      const identifyEventCall = mockAmplitude.track.getCall(0);
      expect(identifyEventCall.args[0]).toBe('Identify Call');
      expect(identifyEventCall.args[1]).toEqual({ source: 'cli' });
      expect(identifyEventCall.args[2].user_id).toBe('user-1');
    });

    it('should ignore non-canonical claim aliases for identity mapping', async () => {
      const mod = await setupModule();
      mockAuthTokenService.getStoredTokens.resolves({
        accessToken: createAccessToken({
          user_id: 'legacy-user-id',
          organization_name: 'Legacy Org',
          role_other: 'Legacy Role',
        }),
      });

      await mod.refreshIdentityFromStoredToken();

      expect(mockAmplitude.identify.called).toBe(false);
      expect(mockAmplitude.track.called).toBe(false);
    });

    it('should skip identify when access token payload is malformed', async () => {
      const mod = await setupModule();
      mockAuthTokenService.getStoredTokens.resolves({
        accessToken: 'not-a-jwt',
      });

      await mod.refreshIdentityFromStoredToken();

      expect(mockAmplitude.identify.called).toBe(false);
      expect(mockAmplitude.track.called).toBe(false);
    });

    it('should fall back to env CI token when stored token payload is malformed', async () => {
      mockConfig.ciTokenFromEnv = createAccessToken({
        sub: 'env-fallback-user',
        email: 'env-fallback@herodevs.com',
        company: 'HeroDevs',
        role: 'Engineer',
      });
      const mod = await setupModule();
      mockAuthTokenService.getStoredTokens.resolves({
        accessToken: 'not-a-jwt',
      });

      await mod.refreshIdentityFromStoredToken();

      expect(mockAmplitude.identify.calledOnce).toBe(true);
      expect(mockAmplitude.track.calledOnce).toBe(true);
      expect(mockAmplitude.identify.getCall(0).args[1].user_id).toBe('env-fallback-user');
    });

    it('should prefer stored token identity over env CI token identity', async () => {
      mockConfig.ciTokenFromEnv = createAccessToken({
        sub: 'env-user',
        email: 'env@herodevs.com',
      });
      const mod = await setupModule();
      mockAuthTokenService.getStoredTokens.resolves({
        accessToken: createAccessToken({
          sub: 'stored-user',
          email: 'stored@herodevs.com',
          company: 'HeroDevs',
        }),
      });

      await mod.refreshIdentityFromStoredToken();

      expect(mockAmplitude.identify.calledOnce).toBe(true);
      expect(mockAmplitude.track.calledOnce).toBe(true);
      expect(mockAmplitude.identify.getCall(0).args[1].user_id).toBe('stored-user');
      expect(mockAmplitude.track.getCall(0).args[2].user_id).toBe('stored-user');
    });

    it('should clear cached identity when no claims are available', async () => {
      const mod = await setupModule();
      mockAuthTokenService.getStoredTokens.resolves({
        accessToken: createAccessToken({
          sub: 'user-1',
          email: 'dev@herodevs.com',
          company: 'HeroDevs',
          role: 'Software Engineer',
        }),
      });

      await mod.refreshIdentityFromStoredToken();
      mod.track('authenticated-event');
      expect(mockAmplitude.track.getCall(1).args[2].user_id).toBe('user-1');

      mockAuthTokenService.getStoredTokens.resolves(undefined);
      await mod.refreshIdentityFromStoredToken();

      mod.track('after-identity-clear');
      expect(mockAmplitude.track.getCall(2).args[2].user_id).toBeUndefined();
    });

    it('should return false when token lookup fails', async () => {
      const mod = await setupModule();
      mockAuthTokenService.getStoredTokens.rejects(new Error('token-lookup-failed'));

      await expect(mod.refreshIdentityFromStoredToken()).resolves.toBe(false);
    });
  });

  describe('Module Initialization', () => {
    it('should initialize device_id using NodeMachineId.machineIdSync', async () => {
      await setupModule();

      expect(mockNodeMachineId.machineIdSync).toHaveBeenCalledTimes(1);
      expect(mockNodeMachineId.machineIdSync).toHaveBeenCalledWith(true);
    });

    it('should initialize started_at as a Date object', async () => {
      const beforeImport = Date.now();
      const mod = await setupModule();
      await mod.initializeAnalytics();
      mod.track('test-event');
      const afterImport = Date.now();

      const trackCall = mockAmplitude.track.getCall(0);
      const sessionId = trackCall.args[2].session_id;

      expect(sessionId).toBeGreaterThanOrEqual(beforeImport);
      expect(sessionId).toBeLessThanOrEqual(afterImport);
    });

    it('should initialize session_id as timestamp from started_at', async () => {
      const mod = await setupModule();
      await mod.initializeAnalytics();
      mod.track('test-event');

      const trackCall = mockAmplitude.track.getCall(0);
      const sessionId = trackCall.args[2].session_id;

      // Session ID should be a valid timestamp
      expect(typeof sessionId).toBe('number');
      expect(sessionId).toBeGreaterThan(0);
      expect(sessionId).toBeLessThanOrEqual(Date.now());
    });

    it('should initialize defaultAnalyticsContext with correct locale', async () => {
      const mod = await setupModule();

      const getProperties = sinon.stub().callsFake((context) => {
        expect(typeof context.locale).toBe('string');
        expect(context.locale.length).toBeGreaterThan(0);
        return {};
      });

      mod.track('test-event', getProperties);
      expect(getProperties.calledOnce).toBe(true);
    });

    it('should initialize defaultAnalyticsContext with correct OS platform', async () => {
      const mod = await setupModule();

      const getProperties = sinon.stub().callsFake((context) => {
        expect(typeof context.os_platform).toBe('string');
        expect(
          ['darwin', 'linux', 'win32', 'freebsd', 'openbsd', 'android', 'aix', 'sunos'].includes(context.os_platform),
        ).toBe(true);
        return {};
      });

      mod.track('test-event', getProperties);
      expect(getProperties.calledOnce).toBe(true);
    });

    it('should initialize defaultAnalyticsContext with CLI version from npm_package_version or unknown', async () => {
      const mod = await setupModule();

      const getProperties = sinon.stub().callsFake((context) => {
        expect(typeof context.cli_version).toBe('string');
        expect(context.cli_version.length).toBeGreaterThan(0);
        return {};
      });

      mod.track('test-event', getProperties);
      expect(getProperties.calledOnce).toBe(true);
    });

    it('should initialize analyticsContext equal to defaultAnalyticsContext', async () => {
      const mod = await setupModule();

      const getProperties = sinon.stub().callsFake((context) => {
        expect(typeof context.locale).toBe('string');
        expect(typeof context.os_platform).toBe('string');
        expect(typeof context.os_release).toBe('string');
        expect(typeof context.cli_version).toBe('string');
        expect(context.started_at instanceof Date).toBe(true);
        return {};
      });

      mod.track('test-event', getProperties);
      expect(getProperties.calledOnce).toBe(true);
    });

    it('should fallback to random device_id when machine id lookup fails', async () => {
      mockNodeMachineId.machineIdSync.mockImplementationOnce(() => {
        throw new Error('machine-id-failed');
      });

      const mod = await setupModule();
      mod.track('test-event');
      const eventOptions = mockAmplitude.track.getCall(0).args[2];

      expect(typeof eventOptions.device_id).toBe('string');
      expect(eventOptions.device_id.length).toBeGreaterThan(0);
      expect(eventOptions.device_id).not.toBe('test-machine-id');
    });
  });
});
