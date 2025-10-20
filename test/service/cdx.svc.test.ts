import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

beforeAll(() => {
  if (typeof (globalThis as { File?: unknown }).File === 'undefined') {
    (globalThis as { File?: unknown }).File = class File {};
  }
});

const createBomMock = vi.fn<[string, string?], Promise<{ bomJson: unknown } | null>>();

describe('cdx.svc createSbom', () => {
  beforeEach(() => {
    vi.resetModules();
    createBomMock.mockReset();
  });

  it('returns bomJson when cdxgen returns an object', async () => {
    const bomJson = { bomFormat: 'CycloneDX', specVersion: '1.6', components: [] };
    createBomMock.mockResolvedValue({ bomJson });
    const mod = await import('../../src/service/cdx.svc.ts');
    const createSbom = mod.createSbomFactory({
      createBom: createBomMock as any,
      postProcess: () => ({ bomJson }),
    });
    const res = await createSbom('/tmp/project');
    expect(res).toEqual(bomJson);
  });

  it('throws when cdxgen returns a falsy value', async () => {
    createBomMock.mockResolvedValue(null);
    const mod = await import('../../src/service/cdx.svc.ts');
    const createSbom = mod.createSbomFactory({
      createBom: createBomMock as any,
      postProcess: () => ({ bomJson: null }),
    });
    await expect(createSbom('/tmp/project')).rejects.toThrow(/SBOM not generated/);
  });
});
