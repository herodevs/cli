import { Entry } from '@napi-rs/keyring';
import { afterEach, assert, describe, it, vi } from 'vitest';
import { GH_ACCESS_KEY, GH_REFRESH_KEY, GH_SERVICE_NAME } from '../../src/config/gh.config.js';
import { authenticateWithDeviceFlow, userAccessToken, userLogout, userRefreshToken } from '../../src/service/gh.svc.js';

const DEMO_ACCESS_TOKEN = 'DEMO_ACCESS_TOKEN';
const DEMO_REFRESH_TOKEN = 'DEMO_REFRESH_TOKEN';

vi.mock('@octokit/auth-oauth-device', () => ({
  __esModule: true,
  createOAuthDeviceAuth: vi.fn().mockReturnValue(() => ({
    refreshToken: DEMO_REFRESH_TOKEN,
    token: DEMO_ACCESS_TOKEN,
  })),
}));

describe('gh.svc', () => {
  describe('userAccessToken', () => {
    describe('with no previous access_token saved', () => {
      beforeEach(() => {
        new Entry(GH_SERVICE_NAME, GH_ACCESS_KEY).deletePassword();
      });
      it(`should return null`, () => {
        const result = userAccessToken();
        assert.strictEqual(result, null);
      });
    });
    describe('with access_token already saved', () => {
      beforeEach(async () => {
        new Entry(GH_SERVICE_NAME, GH_ACCESS_KEY).setPassword(DEMO_ACCESS_TOKEN);
      });
      afterEach(() => {
        new Entry(GH_SERVICE_NAME, GH_ACCESS_KEY).deletePassword();
      });
      it('should get saved access_token', () => {
        const result = userAccessToken();
        assert.equal(result, DEMO_ACCESS_TOKEN);
      });
    });
  });

  describe('userRefreshToken', () => {
    describe('with no previous refresh_token saved', () => {
      beforeEach(() => {
        new Entry(GH_SERVICE_NAME, GH_REFRESH_KEY).deletePassword();
      });
      it(`should return null`, () => {
        const result = userRefreshToken();
        assert.strictEqual(result, null);
      });
    });
    describe('with refresh_token already saved', () => {
      beforeEach(async () => {
        new Entry(GH_SERVICE_NAME, GH_REFRESH_KEY).setPassword(DEMO_REFRESH_TOKEN);
      });
      afterEach(() => {
        new Entry(GH_SERVICE_NAME, GH_REFRESH_KEY).deletePassword();
      });
      it('should get saved refresh_token', () => {
        const result = userRefreshToken();
        assert.equal(result, DEMO_REFRESH_TOKEN);
      });
    });
  });

  describe('userLogout', () => {
    describe('with tokens saved', () => {
      beforeEach(() => {
        new Entry(GH_SERVICE_NAME, GH_ACCESS_KEY).setPassword(DEMO_ACCESS_TOKEN);
        new Entry(GH_SERVICE_NAME, GH_REFRESH_KEY).setPassword(DEMO_ACCESS_TOKEN);
      });
      afterEach(() => {
        new Entry(GH_SERVICE_NAME, GH_ACCESS_KEY).deletePassword();
        new Entry(GH_SERVICE_NAME, GH_REFRESH_KEY).deletePassword();
      });
      it('should clear access_token', () => {
        userLogout();
        const result = userAccessToken();
        assert.equal(result, null);
      });
      it('should clear refresh_token', () => {
        userLogout();
        const result = userRefreshToken();
        assert.equal(result, null);
      });
    });
    describe('with no tokens saved', () => {
      it('should clear access_token', () => {
        userLogout();
        const result = userAccessToken();
        assert.equal(result, null);
      });
      it('should clear refresh_token', () => {
        userLogout();
        const result = userRefreshToken();
        assert.equal(result, null);
      });
    });
  });

  describe('authenticateWithDeviceFlow', () => {
    afterEach(() => {
      new Entry(GH_SERVICE_NAME, GH_ACCESS_KEY).deletePassword();
      new Entry(GH_SERVICE_NAME, GH_REFRESH_KEY).deletePassword();
    });
    it('should store access_token', async () => {
      await authenticateWithDeviceFlow(() => {});
      const result = userAccessToken();
      assert.equal(result, DEMO_ACCESS_TOKEN);
    });
    it('should store refresh_token', async () => {
      await authenticateWithDeviceFlow(() => {});
      const result = userRefreshToken();
      assert.equal(result, DEMO_REFRESH_TOKEN);
    });
  });
});
