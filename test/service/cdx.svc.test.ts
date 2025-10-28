import assert from 'node:assert';
import { describe, it, mock } from 'node:test';

import { createSbomFactory } from '../../src/service/cdx.svc.ts';

describe('cdx.svc createSbom', () => {
  it('returns bomJson when cdxgen returns an object', async () => {
    const bomJson = { bomFormat: 'CycloneDX', specVersion: '1.6', components: [] };
    const createBom = mock.fn(async () => ({ bomJson }));
    const postProcess = mock.fn((sbom) => sbom);

    const createSbom = createSbomFactory({ createBom, postProcess });
    const res = await createSbom('/tmp/project');

    assert.deepStrictEqual(res, bomJson);
  });

  it('throws when cdxgen returns a falsy value', async () => {
    const createBom = mock.fn(async () => null);

    const createSbom = createSbomFactory({ createBom });

    await assert.rejects(() => createSbom('/tmp/project'), /SBOM not generated/);
  });
});
