import sinon from 'sinon';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('analytics.svc', () => {
  const mockAmplitude = {
    init: sinon.spy(),
    setOptOut: sinon.spy(),
    identify: sinon.spy(),
    track: sinon.spy(),
    Identify: sinon.stub().returns({}),
    Types: { LogLevel: { None: 0 } },
  };
  const mockNodeMachineId = { machineIdSync: sinon.stub().returns('test-machine-id') };
  let originalEnv: typeof process.env;

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
    vi.doMock('node-machine-id', () => ({
      __esModule: true,
      default: mockNodeMachineId,
    }));
    vi.doMock('../../src/config/constants.ts', () => ({
      __esModule: true,
      config: { analyticsUrl: 'https://test-analytics.com' },
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
    mockNodeMachineId.machineIdSync.resetHistory();
  });

  describe('initializeAnalytics', () => {
    it('should call amplitude init with correct parameters', async () => {
      const mod = await setupModule();
      mod.initializeAnalytics();

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
      mod.initializeAnalytics();

      expect(mockAmplitude.setOptOut.calledOnce).toBe(true);
      expect(mockAmplitude.setOptOut.getCall(0).args[0]).toBe(true);
    });

    it('should call setOptOut with false when TRACKING_OPT_OUT is not true', async () => {
      process.env.TRACKING_OPT_OUT = 'false';

      const mod = await setupModule();
      mod.initializeAnalytics();

      expect(mockAmplitude.setOptOut.calledOnce).toBe(true);
      expect(mockAmplitude.setOptOut.getCall(0).args[0]).toBe(false);
    });

    it('should call identify with correct user properties', async () => {
      const mod = await setupModule();
      mod.initializeAnalytics();

      expect(mockAmplitude.identify.calledOnce).toBe(true);
      const identifyCall = mockAmplitude.identify.getCall(0);

      const userProperties = identifyCall.args[1];
      expect(userProperties.device_id).toBe('test-machine-id');
      expect(typeof userProperties.session_id).toBe('number');
      expect(typeof userProperties.platform).toBe('string');
      expect(typeof userProperties.os_name).toBe('string');
      expect(typeof userProperties.os_version).toBe('string');
      expect(typeof userProperties.app_version).toBe('string');
    });

    it('should handle case when npm_package_version is undefined', async () => {
      process.env.npm_package_version = undefined;

      const mod = await setupModule();
      mod.initializeAnalytics();

      const identifyCall = mockAmplitude.identify.getCall(0);
      const userProperties = identifyCall.args[1];
      expect(userProperties.app_version).toBe('unknown');
    });
  });

  describe('track', () => {
    it('should call amplitude track with event name and no properties when getProperties is undefined', async () => {
      const mod = await setupModule();
      mod.track('test-event');

      expect(mockAmplitude.track.calledOnce).toBe(true);
      const trackCall = mockAmplitude.track.getCall(0);
      expect(trackCall.args[0]).toBe('test-event');
      expect(trackCall.args[1]).toBeUndefined();
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
      expect(trackCall.args[1]).toEqual(testProperties);
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

      // Second track call should have undefined properties
      const secondTrackCall = mockAmplitude.track.getCall(1);
      expect(secondTrackCall.args[1]).toBeUndefined();
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
  });

  describe('Module Initialization', () => {
    it('should initialize device_id using NodeMachineId.machineIdSync', async () => {
      await setupModule();

      expect(mockNodeMachineId.machineIdSync.calledOnce).toBe(true);
      expect(mockNodeMachineId.machineIdSync.getCall(0).args[0]).toBe(true);
    });

    it('should initialize started_at as a Date object', async () => {
      const beforeImport = Date.now();
      const mod = await setupModule();
      const afterImport = Date.now();

      mod.initializeAnalytics();

      const identifyCall = mockAmplitude.identify.getCall(0);
      const sessionId = identifyCall.args[1].session_id;

      expect(sessionId).toBeGreaterThanOrEqual(beforeImport);
      expect(sessionId).toBeLessThanOrEqual(afterImport);
    });

    it('should initialize session_id as timestamp from started_at', async () => {
      const mod = await setupModule();
      mod.initializeAnalytics();

      const identifyCall = mockAmplitude.identify.getCall(0);
      const sessionId = identifyCall.args[1].session_id;

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
  });
});
