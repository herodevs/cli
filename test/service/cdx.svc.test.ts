import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

beforeAll(() => {
  if (typeof (globalThis as { File?: unknown }).File === 'undefined') {
    (globalThis as { File?: unknown }).File = class File {};
  }
});

type SbomOptions = typeof import('../../src/service/cdx.svc.ts').SBOM_DEFAULT__OPTIONS;
type BomResult = { bomJson: unknown };
type CreateBomFn = (path: string, options: SbomOptions) => Promise<BomResult | null>;
type PostProcessFn = (sbom: BomResult, options: SbomOptions) => BomResult | null;

const createBomMock = vi.fn<CreateBomFn>();
const postProcessMock = vi.fn<PostProcessFn>();

describe('cdx.svc createSbom', () => {
  beforeEach(() => {
    vi.resetModules();
    createBomMock.mockReset();
  });

  it('returns bomJson when cdxgen returns an object', async () => {
    const bomJson = { bomFormat: 'CycloneDX', specVersion: '1.6', components: [] };
    createBomMock.mockResolvedValue({ bomJson });
    postProcessMock.mockReturnValue({ bomJson });
    const mod = await import('../../src/service/cdx.svc.ts');
    const createSbom = mod.createSbomFactory({
      createBom: createBomMock,
      postProcess: postProcessMock,
    });
    const res = await createSbom('/tmp/project');
    expect(res).toEqual(bomJson);
  });

  it('throws when cdxgen returns a falsy value', async () => {
    createBomMock.mockResolvedValue(null);
    const mod = await import('../../src/service/cdx.svc.ts');
    const createSbom = mod.createSbomFactory({
      createBom: createBomMock,
      postProcess: postProcessMock,
    });
    await expect(createSbom('/tmp/project')).rejects.toThrow(/SBOM not generated/);
  });
});
