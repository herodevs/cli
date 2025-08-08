import assert from 'node:assert';
import { describe, it, mock } from 'node:test';
// Node <22 may not support mock.module; skip tests if unavailable
const hasMockModule = typeof (mock as unknown as { module?: unknown }).module === 'function';

describe('cdx.svc createSbom', () => {
  it('returns bomJson when cdxgen returns an object', { skip: !hasMockModule }, async () => {
    const bomJson = { bomFormat: 'CycloneDX', specVersion: '1.6', components: [] };
    await mock.module('@cyclonedx/cdxgen', {
      namedExports: {
        // biome-ignore lint/suspicious/noExplicitAny: test-time ESM mock
        createBom: async () => ({ bomJson }) as any,
      },
    });

    const mod = await import('../../src/service/cdx.svc.ts');
    const res = await mod.createSbom('/tmp/project');
    assert.deepStrictEqual(res, bomJson);
    mock.restoreAll();
  });

  it('throws when cdxgen returns a falsy value', { skip: !hasMockModule }, async () => {
    await mock.module('@cyclonedx/cdxgen', {
      namedExports: {
        createBom: async () => null,
      },
    });

    const mod = await import('../../src/service/cdx.svc.ts');
    await assert.rejects(() => mod.createSbom('/tmp/project'), /SBOM not generated/);
    mock.restoreAll();
  });
});
