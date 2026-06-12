import { type Mock, vi } from 'vitest';

const {
  getNesRegistryAuthTokenMock,
  loadInstallCatalogMock,
  requireAccessTokenMock,
  runNpmInstallMock,
  startInstallProxyMock,
  trackMock,
} = vi.hoisted(() => ({
  getNesRegistryAuthTokenMock: vi.fn(),
  loadInstallCatalogMock: vi.fn(),
  requireAccessTokenMock: vi.fn(),
  runNpmInstallMock: vi.fn(),
  startInstallProxyMock: vi.fn(),
  trackMock: vi.fn(),
}));

vi.mock('../../src/service/install/registry-auth.svc.ts', () => ({
  __esModule: true,
  getNesRegistryAuthToken: getNesRegistryAuthTokenMock,
}));

vi.mock('../../src/service/install/catalog.svc.ts', () => ({
  __esModule: true,
  loadInstallCatalog: loadInstallCatalogMock,
}));

vi.mock('../../src/service/auth.svc.ts', () => ({
  __esModule: true,
  requireAccessToken: requireAccessTokenMock,
}));

vi.mock('../../src/service/install/npm-runner.svc.ts', () => ({
  __esModule: true,
  runNpmInstall: runNpmInstallMock,
}));

vi.mock('../../src/service/install/proxy-server.svc.ts', () => ({
  __esModule: true,
  startInstallProxy: startInstallProxyMock,
}));

vi.mock('../../src/service/analytics.svc.ts', () => ({
  __esModule: true,
  track: trackMock,
}));

import { ux } from '@oclif/core';
import Install from '../../src/commands/install.ts';
import { track } from '../../src/service/analytics.svc.ts';
import { requireAccessToken } from '../../src/service/auth.svc.ts';
import { loadInstallCatalog } from '../../src/service/install/catalog.svc.ts';
import { runNpmInstall } from '../../src/service/install/npm-runner.svc.ts';
import { startInstallProxy } from '../../src/service/install/proxy-server.svc.ts';
import { getNesRegistryAuthToken } from '../../src/service/install/registry-auth.svc.ts';

describe('Install command', () => {
  const closeProxyMock = vi.fn();
  const originalRegistryAuthToken = process.env.HD_INSTALL_NPM_REGISTRY_AUTH_TOKEN;
  const catalog = new Map([
    ['lodash', [{ nesPackageName: '@neverendingsupport/lodash', nesVersion: '1.0.1', ossVersion: '1.0.0' }]],
  ]);

  beforeEach(() => {
    vi.resetAllMocks();
    delete process.env.HD_INSTALL_NPM_REGISTRY_AUTH_TOKEN;
    closeProxyMock.mockResolvedValue(undefined);
    (requireAccessToken as Mock).mockResolvedValue('access-token');
    (getNesRegistryAuthToken as Mock).mockResolvedValue('registry-access-token');
    (loadInstallCatalog as Mock).mockResolvedValue(catalog);
    (startInstallProxy as Mock).mockResolvedValue({
      registryUrl: 'http://127.0.0.1:12345',
      close: closeProxyMock,
    });
    (runNpmInstall as Mock).mockResolvedValue({ exitCode: 0 });
    vi.spyOn(ux.action, 'start').mockImplementation(() => {});
    vi.spyOn(ux.action, 'stop').mockImplementation(() => {});
  });

  afterEach(() => {
    if (originalRegistryAuthToken === undefined) {
      delete process.env.HD_INSTALL_NPM_REGISTRY_AUTH_TOKEN;
    } else {
      process.env.HD_INSTALL_NPM_REGISTRY_AUTH_TOKEN = originalRegistryAuthToken;
    }
  });

  it('starts the proxy, runs npm install, and closes the proxy', async () => {
    const command = new Install([], {} as Record<string, unknown>);
    vi.spyOn(command, 'parse').mockResolvedValue({ flags: {}, args: {} } as never);
    const logSpy = vi.spyOn(command, 'log').mockImplementation(() => {});

    await command.run();

    expect(requireAccessToken).toHaveBeenCalledTimes(1);
    expect(loadInstallCatalog).toHaveBeenCalledWith({
      authToken: 'access-token',
      catalogUrl: undefined,
      onProgress: expect.any(Function),
    });
    expect(startInstallProxy).toHaveBeenCalledWith({
      authToken: 'access-token',
      catalog,
      registryAuthToken: 'registry-access-token',
      summary: {
        availableNotEntitled: new Map(),
        matchedNesPackages: new Map(),
        eolNoNesPackages: new Map(),
      },
      nesRegistryUrl: 'https://registry.nes.herodevs.com/npm/pkg',
    });
    expect(runNpmInstall).toHaveBeenCalledWith({
      authToken: 'access-token',
      nesRegistryUrl: 'https://registry.nes.herodevs.com/npm/pkg',
      registryAuthToken: 'registry-access-token',
      registryUrl: 'http://127.0.0.1:12345',
    });
    expect(closeProxyMock).toHaveBeenCalledTimes(1);
    expect(logSpy).toHaveBeenCalledWith('Install completed.');
    expect(track).toHaveBeenNthCalledWith(1, 'CLI Install Started', expect.any(Function));
    expect(track).toHaveBeenNthCalledWith(2, 'CLI Install Succeeded', expect.any(Function));
  });

  it('emits exact NES package decisions in install analytics', async () => {
    (startInstallProxy as Mock).mockImplementation(async (options) => {
      options.summary.availableNotEntitled.set('lodash@1.0.0->@neverendingsupport/lodash@1.0.1', {
        ossPackageName: 'lodash',
        ossVersion: '1.0.0',
        nesPackageName: '@neverendingsupport/lodash',
        nesVersion: '1.0.1',
      });
      options.summary.matchedNesPackages.set('vue@2.7.14->@neverendingsupport/vue@2.7.14-vue-2.7.23', {
        ossPackageName: 'vue',
        ossVersion: '2.7.14',
        nesPackageName: '@neverendingsupport/vue',
        nesVersion: '2.7.14-vue-2.7.23',
      });
      return {
        registryUrl: 'http://127.0.0.1:12345',
        close: closeProxyMock,
      };
    });
    const command = new Install([], {} as Record<string, unknown>);
    vi.spyOn(command, 'parse').mockResolvedValue({ flags: {}, args: {} } as never);
    vi.spyOn(command, 'log').mockImplementation(() => {});

    await command.run();

    const getProperties = (track as Mock).mock.calls[1][1];
    expect(getProperties({})).toMatchObject({
      nes_available_not_entitled_count: 1,
      nes_available_not_entitled_packages: [
        {
          ossPackageName: 'lodash',
          ossVersion: '1.0.0',
          nesPackageName: '@neverendingsupport/lodash',
          nesVersion: '1.0.1',
        },
      ],
      nes_matched_package_count: 1,
      nes_matched_packages: [
        {
          ossPackageName: 'vue',
          ossVersion: '2.7.14',
          nesPackageName: '@neverendingsupport/vue',
          nesVersion: '2.7.14-vue-2.7.23',
        },
      ],
      eol_no_nes_count: 0,
      eol_no_nes_packages: [],
    });
  });

  it('uses the registry auth token override for NES npm registry access', async () => {
    process.env.HD_INSTALL_NPM_REGISTRY_AUTH_TOKEN = 'registry-token';
    const command = new Install([], {} as Record<string, unknown>);
    vi.spyOn(command, 'parse').mockResolvedValue({ flags: {}, args: {} } as never);
    vi.spyOn(command, 'log').mockImplementation(() => {});

    await command.run();

    expect(startInstallProxy).toHaveBeenCalledWith(
      expect.objectContaining({
        authToken: 'access-token',
        registryAuthToken: 'registry-token',
      }),
    );
    expect(getNesRegistryAuthToken).not.toHaveBeenCalled();
    expect(runNpmInstall).toHaveBeenCalledWith(
      expect.objectContaining({
        authToken: 'access-token',
        registryAuthToken: 'registry-token',
      }),
    );
  });

  it('fails before starting the proxy when NES registry auth cannot be prepared', async () => {
    (getNesRegistryAuthToken as Mock).mockRejectedValue(new Error('registry auth failed'));
    const command = new Install([], {} as Record<string, unknown>);
    vi.spyOn(command, 'parse').mockResolvedValue({ flags: {}, args: {} } as never);
    vi.spyOn(command, 'error').mockImplementation((message) => {
      throw new Error(message as string);
    });

    await expect(command.run()).rejects.toThrow(/Unable to authenticate with the NES registry/);

    expect(startInstallProxy).not.toHaveBeenCalled();
    expect(runNpmInstall).not.toHaveBeenCalled();
  });

  it('fails before starting the proxy when auth is missing', async () => {
    (requireAccessToken as Mock).mockRejectedValue(new Error('not logged in'));
    const command = new Install([], {} as Record<string, unknown>);
    vi.spyOn(command, 'parse').mockResolvedValue({ flags: {}, args: {} } as never);
    vi.spyOn(command, 'error').mockImplementation((message) => {
      throw new Error(message as string);
    });

    await expect(command.run()).rejects.toThrow(/Must be logged in/);

    expect(startInstallProxy).not.toHaveBeenCalled();
    expect(runNpmInstall).not.toHaveBeenCalled();
  });

  it('closes the proxy when npm install fails', async () => {
    (runNpmInstall as Mock).mockRejectedValue(new Error('spawn failed'));
    const command = new Install([], {} as Record<string, unknown>);
    vi.spyOn(command, 'parse').mockResolvedValue({ flags: {}, args: {} } as never);
    vi.spyOn(command, 'log').mockImplementation(() => {});
    vi.spyOn(command, 'error').mockImplementation((message) => {
      throw new Error(message as string);
    });

    await expect(command.run()).rejects.toThrow(/spawn failed/);

    expect(closeProxyMock).toHaveBeenCalledTimes(1);
    expect(track).toHaveBeenNthCalledWith(2, 'CLI Install Failed', expect.any(Function));
  });

  it('closes the proxy and exits with npm exit code when npm install exits non-zero', async () => {
    (runNpmInstall as Mock).mockResolvedValue({ exitCode: 42 });
    const command = new Install([], {} as Record<string, unknown>);
    vi.spyOn(command, 'parse').mockResolvedValue({ flags: {}, args: {} } as never);
    vi.spyOn(command, 'log').mockImplementation(() => {});
    vi.spyOn(command, 'exit').mockImplementation((code) => {
      throw new Error(`exit:${code}`);
    });

    await expect(command.run()).rejects.toThrow('exit:42');

    expect(closeProxyMock).toHaveBeenCalledTimes(1);
    expect(track).toHaveBeenNthCalledWith(2, 'CLI Install Failed', expect.any(Function));
  });
});
