import assert from 'node:assert';
import { type TestContext, afterEach, beforeEach, describe, it, mock } from 'node:test';
import sinon from 'sinon';

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

  function setupModule(t: TestContext) {
    t.mock.module('@amplitude/analytics-node', { namedExports: mockAmplitude });
    t.mock.module('node-machine-id', { defaultExport: mockNodeMachineId });
    t.mock.module('../../src/config/constants.ts', {
      namedExports: { config: { analyticsUrl: 'https://test-analytics.com' } },
    });

    return import(import.meta.resolve(`../../src/service/analytics.svc.ts?${Math.random().toFixed(4)}`));
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
    it('should call amplitude init with correct parameters', async (t) => {
      const mod = await setupModule(t);
      mod.initializeAnalytics();

      assert(mockAmplitude.init.calledOnce);
      const initCall = mockAmplitude.init.getCall(0);
      assert.strictEqual(initCall.args[0], '0');
      assert.deepStrictEqual(initCall.args[1], {
        flushQueueSize: 2,
        flushIntervalMillis: 250,
        logLevel: 0,
        serverUrl: 'https://test-analytics.com',
      });
    });

    it('should call setOptOut with true when TRACKING_OPT_OUT is true', async (t) => {
      process.env.TRACKING_OPT_OUT = 'true';

      const mod = await setupModule(t);
      mod.initializeAnalytics();

      assert(mockAmplitude.setOptOut.calledOnce);
      assert.strictEqual(mockAmplitude.setOptOut.getCall(0).args[0], true);
    });

    it('should call setOptOut with false when TRACKING_OPT_OUT is not true', async (t) => {
      process.env.TRACKING_OPT_OUT = 'false';

      const mod = await setupModule(t);
      mod.initializeAnalytics();

      assert(mockAmplitude.setOptOut.calledOnce);
      assert.strictEqual(mockAmplitude.setOptOut.getCall(0).args[0], false);
    });

    it('should call identify with correct user properties', async (t) => {
      const mod = await setupModule(t);
      mod.initializeAnalytics();

      assert(mockAmplitude.identify.calledOnce);
      const identifyCall = mockAmplitude.identify.getCall(0);

      const userProperties = identifyCall.args[1];
      assert.strictEqual(userProperties.device_id, 'test-machine-id');
      assert(typeof userProperties.session_id === 'number');
      assert(typeof userProperties.platform === 'string');
      assert(typeof userProperties.os_name === 'string');
      assert(typeof userProperties.os_version === 'string');
      assert(typeof userProperties.app_version === 'string');
    });

    it('should handle case when npm_package_version is undefined', async (t) => {
      process.env.npm_package_version = undefined;

      const mod = await setupModule(t);
      mod.initializeAnalytics();

      const identifyCall = mockAmplitude.identify.getCall(0);
      const userProperties = identifyCall.args[1];
      assert.strictEqual(userProperties.app_version, 'unknown');
    });
  });

  describe('track', () => {
    it('should call amplitude track with event name and no properties when getProperties is undefined', async (t) => {
      const mod = await setupModule(t);
      mod.track('test-event');

      assert(mockAmplitude.track.calledOnce);
      const trackCall = mockAmplitude.track.getCall(0);
      assert.strictEqual(trackCall.args[0], 'test-event');
      assert.strictEqual(trackCall.args[1], undefined);
      assert(typeof trackCall.args[2].device_id === 'string');
      assert(typeof trackCall.args[2].session_id === 'number');
    });

    it('should call amplitude track with event name and properties when getProperties returns data', async (t) => {
      const mod = await setupModule(t);
      const testProperties = { scan_location: '/test/path', eol_true_count: 5 };
      const getProperties = sinon.stub().returns(testProperties);

      mod.track('test-event', getProperties);

      assert(mockAmplitude.track.calledOnce);
      const trackCall = mockAmplitude.track.getCall(0);
      assert.strictEqual(trackCall.args[0], 'test-event');
      assert.deepStrictEqual(trackCall.args[1], testProperties);
      assert(typeof trackCall.args[2].device_id === 'string');
      assert(typeof trackCall.args[2].session_id === 'number');
    });

    it('should merge properties into analyticsContext when getProperties returns data', async (t) => {
      const mod = await setupModule(t);
      const firstProperties = { scan_location: '/test/path1', eol_true_count: 3 };
      const secondProperties = { scan_location: '/test/path2', eol_unknown_count: 2 };

      mod.track('test-event-1', () => firstProperties);

      const getSecondProperties = sinon.stub().callsFake((context) => {
        assert.strictEqual(context.scan_location, '/test/path1');
        assert.strictEqual(context.eol_true_count, 3);
        return secondProperties;
      });

      mod.track('test-event-2', getSecondProperties);

      assert(getSecondProperties.calledOnce);
      assert(mockAmplitude.track.calledTwice);
    });

    it('should preserve existing analyticsContext when getProperties returns undefined', async (t) => {
      const mod = await setupModule(t);
      const initialProperties = { scan_location: '/test/path', eol_true_count: 5 };

      mod.track('test-event-1', () => initialProperties);

      const getUndefinedProperties = sinon.stub().callsFake((context) => {
        assert.strictEqual(context.scan_location, '/test/path');
        assert.strictEqual(context.eol_true_count, 5);
        return undefined;
      });

      mod.track('test-event-2', getUndefinedProperties);

      assert(getUndefinedProperties.calledOnce);
      assert(mockAmplitude.track.calledTwice);

      // Second track call should have undefined properties
      const secondTrackCall = mockAmplitude.track.getCall(1);
      assert.strictEqual(secondTrackCall.args[1], undefined);
    });

    it('should pass correct device_id and session_id to amplitude track', async (t) => {
      const mod = await setupModule(t);
      mod.track('test-event');

      assert(mockAmplitude.track.calledOnce);
      const trackCall = mockAmplitude.track.getCall(0);
      const eventOptions = trackCall.args[2];

      assert.strictEqual(eventOptions.device_id, 'test-machine-id');
      assert(typeof eventOptions.session_id === 'number');
      assert(eventOptions.session_id > 0);
    });
  });

  describe('Module Initialization', () => {
    it('should initialize device_id using NodeMachineId.machineIdSync', async (t) => {
      await setupModule(t);

      assert(mockNodeMachineId.machineIdSync.calledOnce);
      assert.strictEqual(mockNodeMachineId.machineIdSync.getCall(0).args[0], true);
    });

    it('should initialize started_at as a Date object', async (t) => {
      const beforeImport = Date.now();
      const mod = await setupModule(t);
      const afterImport = Date.now();

      mod.initializeAnalytics();

      const identifyCall = mockAmplitude.identify.getCall(0);
      const sessionId = identifyCall.args[1].session_id;

      assert(sessionId >= beforeImport);
      assert(sessionId <= afterImport);
    });

    it('should initialize session_id as timestamp from started_at', async (t) => {
      const mod = await setupModule(t);
      mod.initializeAnalytics();

      const identifyCall = mockAmplitude.identify.getCall(0);
      const sessionId = identifyCall.args[1].session_id;

      // Session ID should be a valid timestamp
      assert(typeof sessionId === 'number');
      assert(sessionId > 0);
      assert(sessionId <= Date.now());
    });

    it('should initialize defaultAnalyticsContext with correct locale', async (t) => {
      const mod = await setupModule(t);

      const getProperties = sinon.stub().callsFake((context) => {
        assert(typeof context.locale === 'string');
        assert(context.locale.length > 0);
        return {};
      });

      mod.track('test-event', getProperties);
      assert(getProperties.calledOnce);
    });

    it('should initialize defaultAnalyticsContext with correct OS platform', async (t) => {
      const mod = await setupModule(t);

      const getProperties = sinon.stub().callsFake((context) => {
        assert(typeof context.os_platform === 'string');
        assert(
          ['darwin', 'linux', 'win32', 'freebsd', 'openbsd', 'android', 'aix', 'sunos'].includes(context.os_platform),
        );
        return {};
      });

      mod.track('test-event', getProperties);
      assert(getProperties.calledOnce);
    });

    it('should initialize defaultAnalyticsContext with CLI version from npm_package_version or unknown', async (t) => {
      const mod = await setupModule(t);

      const getProperties = sinon.stub().callsFake((context) => {
        assert(typeof context.cli_version === 'string');
        assert(context.cli_version.length > 0);
        return {};
      });

      mod.track('test-event', getProperties);
      assert(getProperties.calledOnce);
    });

    it('should initialize analyticsContext equal to defaultAnalyticsContext', async (t) => {
      const mod = await setupModule(t);

      const getProperties = sinon.stub().callsFake((context) => {
        assert(typeof context.locale === 'string');
        assert(typeof context.os_platform === 'string');
        assert(typeof context.os_release === 'string');
        assert(typeof context.cli_version === 'string');
        assert(context.started_at instanceof Date);
        return {};
      });

      mod.track('test-event', getProperties);
      assert(getProperties.calledOnce);
    });
  });
});
