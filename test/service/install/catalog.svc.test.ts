import { createInstallCatalogIndex, loadInstallCatalog } from '../../../src/service/install/catalog.svc.ts';

describe('install catalog service', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('loads all catalog pages with the HeroDevs token', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            results: [
              {
                component: 'pkg:npm/lodash',
                versions: [
                  {
                    version: '4.17.21',
                    nes: {
                      latest: '4.17.21-lodash-4.17.22',
                      purl: 'pkg:npm/%40neverendingsupport/lodash',
                    },
                  },
                ],
              },
            ],
            totalPages: 2,
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            results: [
              {
                component: 'pkg:npm/%40angular/core',
                versions: [
                  {
                    version: '19.2.21',
                    nes: {
                      latest: '19.2.21-angular-19.2.22',
                      purl: 'pkg:npm/%40neverendingsupport/angular-core',
                    },
                  },
                ],
              },
            ],
            totalPages: 2,
          }),
          { status: 200 },
        ),
      );
    globalThis.fetch = fetchMock;

    const catalog = await loadInstallCatalog({
      authToken: 'access-token',
      catalogUrl: 'https://catalog.example.test/packages',
    });

    expect(catalog).toEqual(
      new Map([
        [
          'lodash',
          [
            {
              nesPackageName: '@neverendingsupport/lodash',
              nesVersion: '4.17.21-lodash-4.17.22',
              ossVersion: '4.17.21',
            },
          ],
        ],
        [
          '@angular/core',
          [
            {
              nesPackageName: '@neverendingsupport/angular-core',
              nesVersion: '19.2.21-angular-19.2.22',
              ossVersion: '19.2.21',
            },
          ],
        ],
      ]),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      new URL('https://catalog.example.test/packages'),
      expect.objectContaining({
        headers: { authorization: 'Bearer access-token' },
        signal: expect.any(AbortSignal),
      }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      new URL('https://catalog.example.test/packages?page=2'),
      expect.objectContaining({
        headers: { authorization: 'Bearer access-token' },
        signal: expect.any(AbortSignal),
      }),
    );
  });

  it('uses the npm catalog filter by default', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          results: [],
          totalPages: 1,
        }),
        { status: 200 },
      ),
    );
    globalThis.fetch = fetchMock;

    await loadInstallCatalog({
      authToken: 'access-token',
    });

    expect(fetchMock).toHaveBeenCalledWith(
      new URL('https://api.nes.herodevs.com/api/catalog/packages?type=npm'),
      expect.any(Object),
    );
  });

  it('builds an OSS npm package to NES npm package index from catalog pages', () => {
    const catalog = createInstallCatalogIndex({
      results: [
        {
          component: 'pkg:npm/lodash',
          versions: [
            {
              version: '4.17.21',
              nes: {
                latest: '4.17.21-lodash-4.17.22',
                purl: 'pkg:npm/%40neverendingsupport/lodash',
                versions: [{ purl: 'pkg:npm/%40neverendingsupport/lodash@4.17.23-lodash-4.17.25' }],
              },
            },
          ],
        },
        {
          component: 'pkg:npm/%40angular/core',
          versions: [
            {
              version: '19.2.21',
              nes: {
                latest: '19.2.21-angular-19.2.22',
                purl: 'pkg:npm/%40neverendingsupport/angular-core',
              },
            },
          ],
        },
      ],
      totalPages: 1,
    });

    expect(catalog).toEqual(
      new Map([
        [
          'lodash',
          [
            {
              nesPackageName: '@neverendingsupport/lodash',
              nesVersion: '4.17.21-lodash-4.17.22',
              ossVersion: '4.17.21',
            },
          ],
        ],
        [
          '@angular/core',
          [
            {
              nesPackageName: '@neverendingsupport/angular-core',
              nesVersion: '19.2.21-angular-19.2.22',
              ossVersion: '19.2.21',
            },
          ],
        ],
      ]),
    );
  });

  it('prefers package-specific NES mappings over legacy shared packages for the same OSS version', () => {
    const catalog = createInstallCatalogIndex({
      results: [
        {
          component: 'pkg:npm/vue',
          versions: [
            {
              version: '2.7.14',
              nes: {
                latest: '2.7.22',
                purl: 'pkg:npm/%40neverendingsupport/vue2',
              },
            },
            {
              version: '2.7.14',
              nes: {
                latest: '2.7.14-vue-2.7.23',
                purl: 'pkg:npm/%40neverendingsupport/vue',
              },
            },
          ],
        },
      ],
      totalPages: 1,
    });

    expect(catalog.get('vue')).toEqual([
      {
        nesPackageName: '@neverendingsupport/vue',
        nesVersion: '2.7.14-vue-2.7.23',
        ossVersion: '2.7.14',
      },
    ]);
  });

  it('indexes the OSS package identity emitted by the catalog component', () => {
    const catalog = createInstallCatalogIndex({
      results: [
        {
          component: 'pkg:npm/vue-compiler-sfc',
          versions: [
            {
              version: '2.7.14',
              nes: {
                latest: '2.7.14-vue-2.7.23',
                purl: 'pkg:npm/%40neverendingsupport/vue-compiler-sfc',
              },
            },
          ],
        },
      ],
      totalPages: 1,
    });

    expect(catalog.get('vue-compiler-sfc')).toEqual([
      {
        nesPackageName: '@neverendingsupport/vue-compiler-sfc',
        nesVersion: '2.7.14-vue-2.7.23',
        ossVersion: '2.7.14',
      },
    ]);
  });

  it('ignores non-npm catalog entries and incomplete NES mappings', () => {
    const catalog = createInstallCatalogIndex({
      results: [
        {
          component: 'pkg:composer/colorbox',
          versions: [{ nes: { purl: 'pkg:composer/neverendingsupport/colorbox' } }],
        },
        {
          component: 'pkg:npm/bootstrap',
          versions: [{ nes: { purl: '' } }],
        },
      ],
      totalPages: 1,
    });

    expect(catalog).toEqual(new Map());
  });
});
