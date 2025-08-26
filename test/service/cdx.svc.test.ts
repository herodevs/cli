import assert from 'node:assert';
import { describe, it, mock, type TestContext } from 'node:test';

// Node <22 may not support mock.module; skip tests if unavailable
const hasMockModule = typeof (mock as unknown as { module?: unknown }).module === 'function';

describe('cdx.svc createSbom', () => {
  function setupModule({ createBom, t }: { createBom: () => Promise<{ bomJson: unknown } | null>; t: TestContext }) {
    t.mock.module('@cyclonedx/cdxgen', {
      namedExports: { createBom },
    });

    return import(import.meta.resolve(`../../src/service/cdx.svc.ts?${Math.random().toFixed(3)}`));
  }

  it('returns bomJson when cdxgen returns an object', { skip: !hasMockModule }, async (t) => {
    const bomJson = { bomFormat: 'CycloneDX', specVersion: '1.6', components: [] };
    const mod = await setupModule({ createBom: async () => ({ bomJson }), t });
    const res = await mod.createSbom('/tmp/project');
    assert.deepStrictEqual(res, bomJson);
  });

  it('throws when cdxgen returns a falsy value', { skip: !hasMockModule }, async (t) => {
    const mod = await setupModule({ createBom: async () => null, t });
    await assert.rejects(() => mod.createSbom('/tmp/project'), /SBOM not generated/);
  });
});
