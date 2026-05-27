import { createInstallProxy } from '../../../src/service/install/proxy-server.svc.ts';
import type { InstallNesPackageSummary, InstallSummary } from '../../../src/types/install.ts';

describe('install proxy server', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('passes requests outside the catalog through to the configured public registry', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ name: 'lodash' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );
    globalThis.fetch = fetchMock;

    const summary = createSummary();
    const app = createInstallProxy({
      authToken: 'access-token',
      summary,
      catalog: new Map(),
      publicRegistryUrl: 'https://registry.example.test',
    });
    const response = await app.inject({
      method: 'GET',
      url: '/lodash',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ name: 'lodash' });
    expect(fetchMock).toHaveBeenCalledWith(
      new URL('/lodash', 'https://registry.example.test'),
      expect.objectContaining({
        signal: expect.any(AbortSignal),
      }),
    );

    await app.close();
  });

  it('routes catalog-matched requests to the mapped NES package path', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify(
          createNesManifest('@neverendingsupport/lodash', '1.0.1', { dependencies: { leftpad: '^1.0.0' } }),
        ),
        {
          status: 200,
          headers: { 'content-type': 'application/json' },
        },
      ),
    );
    globalThis.fetch = fetchMock;

    const summary = createSummary();
    const app = createInstallProxy({
      authToken: 'access-token',
      summary,
      catalog: new Map([
        ['lodash', [{ nesPackageName: '@neverendingsupport/lodash', nesVersion: '1.0.1', ossVersion: '1.0.0' }]],
      ]),
    });
    const response = await app.inject({
      method: 'GET',
      url: '/lodash',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().versions['1.0.0']).toMatchObject({
      name: 'lodash',
      version: '1.0.0',
      dependencies: {
        leftpad: '^1.0.0',
      },
      dist: {
        tarball: 'https://registry.example.test/lodash.tgz',
      },
    });
    expect(fetchMock).toHaveBeenCalledWith(
      new URL('https://registry.nes.herodevs.com/npm/pkg/%40neverendingsupport/lodash'),
      expect.any(Object),
    );

    await app.close();
  });

  it('uses the catalog NES version when synthesizing OSS metadata', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(createNesManifest('@neverendingsupport/vue', '2.7.14-vue-2.7.23')), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );
    globalThis.fetch = fetchMock;

    const summary = createSummary();
    const app = createInstallProxy({
      authToken: 'access-token',
      summary,
      catalog: new Map([
        ['vue', [{ nesPackageName: '@neverendingsupport/vue', nesVersion: '2.7.14-vue-2.7.23', ossVersion: '2.7.14' }]],
      ]),
      nesRegistryUrl: 'https://registry.dev.nes.herodevs.com/npm/pkg',
    });
    const response = await app.inject({
      method: 'GET',
      url: '/vue',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      name: 'vue',
      versions: {
        '2.7.14': {
          name: 'vue',
          version: '2.7.14',
          dist: {
            tarball: 'https://registry.example.test/lodash.tgz',
          },
        },
      },
      'dist-tags': {
        latest: '2.7.14',
      },
    });
    expect(fetchMock).toHaveBeenCalledWith(
      new URL('https://registry.dev.nes.herodevs.com/npm/pkg/%40neverendingsupport/vue'),
      expect.any(Object),
    );

    await app.close();
  });

  it('records catalog-matched metadata and caches NES manifests for the proxy run', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(createNesManifest('@neverendingsupport/lodash', '1.0.1')), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );
    globalThis.fetch = fetchMock;

    const summary = createSummary();
    const app = createInstallProxy({
      authToken: 'access-token',
      summary,
      catalog: new Map([
        ['lodash', [{ nesPackageName: '@neverendingsupport/lodash', nesVersion: '1.0.1', ossVersion: '1.0.0' }]],
      ]),
      publicRegistryUrl: 'https://registry.example.test',
    });
    const response = await app.inject({
      method: 'GET',
      url: '/lodash',
    });
    const cachedResponse = await app.inject({
      method: 'GET',
      url: '/lodash',
    });

    expect(response.statusCode).toBe(200);
    expect(cachedResponse.statusCode).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(Array.from(summary.matchedNesPackages.values())).toEqual([
      {
        ossPackageName: 'lodash',
        ossVersion: '1.0.0',
        nesPackageName: '@neverendingsupport/lodash',
        nesVersion: '1.0.1',
      },
    ]);

    await app.close();
  });

  it('falls back to public npm and records a not-entitled package when the NES manifest is unavailable', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response('not entitled', { status: 403 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ name: 'lodash' }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      );
    globalThis.fetch = fetchMock;

    const summary = createSummary();
    const app = createInstallProxy({
      authToken: 'access-token',
      summary,
      catalog: new Map([
        ['lodash', [{ nesPackageName: '@neverendingsupport/lodash', nesVersion: '1.0.1', ossVersion: '1.0.0' }]],
      ]),
      publicRegistryUrl: 'https://registry.example.test',
    });
    const response = await app.inject({
      method: 'GET',
      url: '/lodash',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ name: 'lodash' });
    expect(Array.from(summary.availableNotEntitled.values())).toEqual([
      {
        ossPackageName: 'lodash',
        ossVersion: '1.0.0',
        nesPackageName: '@neverendingsupport/lodash',
        nesVersion: '1.0.1',
      },
    ]);

    await app.close();
  });

  it('skips inaccessible catalog candidates while keeping accessible NES versions', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response('not entitled', { status: 403 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify(createNesManifest('@neverendingsupport/vue', '2.7.14-vue-2.7.23')), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      );
    globalThis.fetch = fetchMock;

    const summary = createSummary();
    const app = createInstallProxy({
      authToken: 'access-token',
      summary,
      catalog: new Map([
        [
          'vue',
          [
            { nesPackageName: '@neverendingsupport/vue2', nesVersion: '2.7.22', ossVersion: '2.7.10' },
            { nesPackageName: '@neverendingsupport/vue', nesVersion: '2.7.14-vue-2.7.23', ossVersion: '2.7.14' },
          ],
        ],
      ]),
      publicRegistryUrl: 'https://registry.example.test',
    });
    const response = await app.inject({
      method: 'GET',
      url: '/vue',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().versions).toEqual({
      '2.7.14': {
        name: 'vue',
        version: '2.7.14',
        dist: {
          tarball: 'https://registry.example.test/lodash.tgz',
        },
      },
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(Array.from(summary.availableNotEntitled.values())).toEqual([
      {
        ossPackageName: 'vue',
        ossVersion: '2.7.10',
        nesPackageName: '@neverendingsupport/vue2',
        nesVersion: '2.7.22',
      },
    ]);

    await app.close();
  });

  it('strips decoded body framing headers before replying to npm', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ name: 'lodash' }), {
        status: 200,
        headers: {
          'content-encoding': 'gzip',
          'content-length': '999',
          'content-type': 'application/json',
        },
      }),
    );
    globalThis.fetch = fetchMock;

    const app = createInstallProxy({
      authToken: 'access-token',
      summary: createSummary(),
      catalog: new Map(),
      publicRegistryUrl: 'https://registry.example.test',
    });
    const response = await app.inject({
      method: 'GET',
      url: '/lodash',
    });

    expect(response.headers['content-encoding']).toBeUndefined();
    expect(response.headers['content-length']).toBeUndefined();
    expect(response.headers['content-type']).toBe('application/json');

    await app.close();
  });

  it('preserves tarball request suffixes when routing to NES', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify(createNesManifest('@neverendingsupport/lodash', '1.0.1')), { status: 200 }),
      );
    globalThis.fetch = fetchMock;

    const app = createInstallProxy({
      authToken: 'access-token',
      summary: createSummary(),
      catalog: new Map([
        ['lodash', [{ nesPackageName: '@neverendingsupport/lodash', nesVersion: '1.0.1', ossVersion: '1.0.0' }]],
      ]),
    });
    await app.inject({
      method: 'GET',
      url: '/lodash/-/lodash-4.17.25.tgz',
    });

    expect(fetchMock).toHaveBeenCalledWith(
      new URL('https://registry.nes.herodevs.com/npm/pkg/%40neverendingsupport/lodash/-/lodash-4.17.25.tgz'),
      expect.any(Object),
    );

    await app.close();
  });

  it('adds the HeroDevs token only when the request is catalog-matched', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify(createNesManifest('@neverendingsupport/scope-package', '1.0.1')), { status: 200 }),
      );
    globalThis.fetch = fetchMock;

    const app = createInstallProxy({
      authToken: 'access-token',
      summary: createSummary(),
      catalog: new Map([
        ['lodash', [{ nesPackageName: '@neverendingsupport/lodash', nesVersion: '1.0.1', ossVersion: '1.0.0' }]],
      ]),
      nesRegistryUrl: 'https://registry.dev.nes.herodevs.com/npm/pkg',
    });
    await app.inject({
      method: 'GET',
      url: '/lodash/-/lodash-1.0.1.tgz',
    });

    const [, requestInit] = fetchMock.mock.calls[0];
    expect((requestInit.headers as Headers).get('authorization')).toBe('Bearer access-token');

    await app.close();
  });

  it('does not add the HeroDevs token when the request is not catalog-matched', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }));
    globalThis.fetch = fetchMock;

    const app = createInstallProxy({
      authToken: 'access-token',
      summary: createSummary(),
      catalog: new Map([
        ['bootstrap', [{ nesPackageName: '@neverendingsupport/bootstrap', nesVersion: '1.0.1', ossVersion: '1.0.0' }]],
      ]),
      nesRegistryUrl: 'https://registry.dev.nes.herodevs.com/npm/pkg',
      publicRegistryUrl: 'https://registry.example.test',
    });
    await app.inject({
      method: 'GET',
      url: '/lodash',
    });

    const [, requestInit] = fetchMock.mock.calls[0];
    expect((requestInit.headers as Headers).get('authorization')).toBeNull();

    await app.close();
  });

  it('preserves scoped public tarball request suffixes without duplicating the package name', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }));
    globalThis.fetch = fetchMock;

    const app = createInstallProxy({
      authToken: 'access-token',
      summary: createSummary(),
      catalog: new Map(),
      publicRegistryUrl: 'https://registry.example.test',
    });
    await app.inject({
      method: 'GET',
      url: '/@babel/helper-validator-identifier/-/helper-validator-identifier-7.29.7.tgz',
    });

    expect(fetchMock).toHaveBeenCalledWith(
      new URL(
        'https://registry.example.test/%40babel/helper-validator-identifier/-/helper-validator-identifier-7.29.7.tgz',
      ),
      expect.any(Object),
    );

    await app.close();
  });

  it('keeps tarballs on public npm after metadata proves a catalog package is not entitled', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }));
    globalThis.fetch = fetchMock;

    const app = createInstallProxy({
      authToken: 'access-token',
      summary: createSummary({
        availableNotEntitled: [
          {
            ossPackageName: 'vue',
            ossVersion: '2.7.14',
            nesPackageName: '@neverendingsupport/vue',
            nesVersion: '2.7.14-vue-2.7.23',
          },
        ],
      }),
      catalog: new Map([
        ['vue', [{ nesPackageName: '@neverendingsupport/vue', nesVersion: '2.7.14-vue-2.7.23', ossVersion: '2.7.14' }]],
      ]),
      publicRegistryUrl: 'https://registry.example.test',
    });
    await app.inject({
      method: 'GET',
      url: '/vue/-/vue-2.7.14.tgz',
    });

    expect(fetchMock).toHaveBeenCalledWith(
      new URL('https://registry.example.test/vue/-/vue-2.7.14.tgz'),
      expect.any(Object),
    );

    await app.close();
  });

  it('matches scoped package names when npm encodes the slash', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }));
    globalThis.fetch = fetchMock;

    const app = createInstallProxy({
      authToken: 'access-token',
      summary: createSummary(),
      catalog: new Map([
        [
          '@scope/package',
          [{ nesPackageName: '@neverendingsupport/scope-package', nesVersion: '1.0.1', ossVersion: '1.0.0' }],
        ],
      ]),
      nesRegistryUrl: 'https://registry.dev.nes.herodevs.com/npm/pkg',
    });
    await app.inject({
      method: 'GET',
      url: '/@scope/package/-/scope-package-1.0.1.tgz',
    });

    expect(fetchMock).toHaveBeenCalledWith(
      new URL(
        'https://registry.dev.nes.herodevs.com/npm/pkg/%40neverendingsupport/scope-package/-/scope-package-1.0.1.tgz',
      ),
      expect.any(Object),
    );

    await app.close();
  });
});

function createNesManifest(name: string, version: string, metadata: Record<string, unknown> = {}): unknown {
  return {
    name,
    versions: {
      [version]: {
        name,
        version,
        ...metadata,
        dist: {
          tarball: 'https://registry.example.test/lodash.tgz',
        },
      },
    },
  };
}

function createSummary(options: { availableNotEntitled?: InstallNesPackageSummary[] } = {}): InstallSummary {
  const availableNotEntitled = new Map<string, InstallNesPackageSummary>();
  for (const item of options.availableNotEntitled ?? []) {
    availableNotEntitled.set(
      `${item.ossPackageName}@${item.ossVersion}->${item.nesPackageName}@${item.nesVersion}`,
      item,
    );
  }

  return {
    availableNotEntitled,
    matchedNesPackages: new Map(),
    eolNoNesPackages: new Map(),
  };
}
