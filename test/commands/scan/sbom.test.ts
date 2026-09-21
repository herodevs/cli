import type { CdxBom } from '@herodevs/eol-shared';
import type { Config } from '@oclif/core';
import ScanSbom from '../../../src/commands/scan/sbom.ts';

const { trackMock, createSbomMock, readSbomFromFileMock, saveArtifactToFileMock, validateDirectoryMock } = vi.hoisted(
  () => ({
    trackMock: vi.fn(),
    createSbomMock: vi.fn(),
    readSbomFromFileMock: vi.fn(),
    saveArtifactToFileMock: vi.fn(),
    validateDirectoryMock: vi.fn(),
  }),
);

vi.mock('../../../src/service/analytics.svc.ts', () => ({
  track: trackMock,
}));

vi.mock('../../../src/service/cdx.svc.ts', () => ({
  createSbom: createSbomMock,
}));

vi.mock('../../../src/service/file.svc.ts', () => ({
  readSbomFromFile: readSbomFromFileMock,
  saveArtifactToFile: saveArtifactToFileMock,
  validateDirectory: validateDirectoryMock,
}));

vi.mock('ora', () => ({
  default: vi.fn(() => ({
    start: vi.fn().mockReturnThis(),
    succeed: vi.fn().mockReturnThis(),
    fail: vi.fn().mockReturnThis(),
  })),
}));

type ParseFlags = {
  dir?: string;
  file?: string;
  output?: string;
};

type ScanSbomInternals = {
  parse: (...args: unknown[]) => Promise<{ flags: ParseFlags }>;
  log: (message: string) => void;
  error: (message: string) => never;
  run: () => Promise<CdxBom>;
};

function createCommand(): ScanSbomInternals {
  return new ScanSbom([], {} as Config) as unknown as ScanSbomInternals;
}

function getTrackProperties(eventName: string): Record<string, unknown> {
  const call = trackMock.mock.calls.find(([event]) => event === eventName);
  if (!call) {
    throw new Error(`Expected analytics event ${eventName} to be tracked`);
  }

  const getProperties = call[1] as (context: Record<string, unknown>) => Record<string, unknown>;
  return getProperties({ command: 'scan:sbom', command_flags: '--dir .' });
}

describe('scan:sbom', () => {
  const sampleSbom = {
    bomFormat: 'CycloneDX',
    specVersion: '1.6',
    metadata: {},
    components: [{ purl: 'pkg:npm/test@1.0.0' }],
  } as unknown as CdxBom;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('generates an SBOM from a directory without requesting any credential', async () => {
    createSbomMock.mockResolvedValue(sampleSbom);

    const command = createCommand();
    vi.spyOn(command, 'parse').mockResolvedValue({ flags: { dir: '/repo' } });
    const logSpy = vi.spyOn(command, 'log').mockImplementation(() => {});

    const result = await command.run();

    expect(validateDirectoryMock).toHaveBeenCalledWith('/repo');
    expect(createSbomMock).toHaveBeenCalledWith('/repo');
    expect(result).toEqual(sampleSbom);
    expect(logSpy).toHaveBeenCalledWith(JSON.stringify(sampleSbom, null, 2));

    const properties = getTrackProperties('CLI SBOM Generated');
    expect(properties.command).toBe('scan:sbom');
  });

  it('loads an existing SBOM from --file instead of generating one', async () => {
    readSbomFromFileMock.mockReturnValue(sampleSbom);

    const command = createCommand();
    vi.spyOn(command, 'parse').mockResolvedValue({ flags: { file: '/tmp/sbom.json', dir: process.cwd() } });
    vi.spyOn(command, 'log').mockImplementation(() => {});

    await command.run();

    expect(readSbomFromFileMock).toHaveBeenCalledWith('/tmp/sbom.json');
    expect(createSbomMock).not.toHaveBeenCalled();
    expect(trackMock).not.toHaveBeenCalledWith('CLI SBOM Generated', expect.anything());
  });

  it('saves the SBOM to a file when --output is provided, and does not print it to stdout', async () => {
    createSbomMock.mockResolvedValue(sampleSbom);
    saveArtifactToFileMock.mockReturnValue('/repo/herodevs.sbom.json');

    const command = createCommand();
    vi.spyOn(command, 'parse').mockResolvedValue({ flags: { dir: '/repo', output: '/repo' } });
    const logSpy = vi.spyOn(command, 'log').mockImplementation(() => {});

    const result = await command.run();

    expect(saveArtifactToFileMock).toHaveBeenCalledWith('/repo', {
      kind: 'sbom',
      payload: sampleSbom,
      outputPath: '/repo',
    });
    expect(logSpy).toHaveBeenCalledWith('SBOM saved to /repo/herodevs.sbom.json');
    expect(logSpy).not.toHaveBeenCalledWith(JSON.stringify(sampleSbom, null, 2));
    expect(result).toEqual(sampleSbom);

    const properties = getTrackProperties('CLI SBOM Output Saved');
    expect(properties.sbom_output_path).toBe('/repo/herodevs.sbom.json');
  });

  it('tracks and surfaces an error when directory generation fails', async () => {
    validateDirectoryMock.mockImplementation(() => {
      throw new Error('Directory not found: /missing');
    });

    const command = createCommand();
    vi.spyOn(command, 'parse').mockResolvedValue({ flags: { dir: '/missing' } });
    vi.spyOn(command, 'error').mockImplementation((message: string) => {
      throw new Error(message);
    });

    await expect(command.run()).rejects.toThrow('Failed to scan directory: Directory not found: /missing');

    const properties = getTrackProperties('CLI Error Encountered');
    expect(properties.error).toBe('Directory not found: /missing');
  });

  it('tracks and surfaces an error when loading an SBOM file fails', async () => {
    readSbomFromFileMock.mockImplementation(() => {
      throw new Error('SBOM file not found: /missing.json');
    });

    const command = createCommand();
    vi.spyOn(command, 'parse').mockResolvedValue({ flags: { file: '/missing.json', dir: process.cwd() } });
    vi.spyOn(command, 'error').mockImplementation((message: string) => {
      throw new Error(message);
    });

    await expect(command.run()).rejects.toThrow('SBOM file not found: /missing.json');

    const properties = getTrackProperties('CLI Error Encountered');
    expect(properties.error).toBe('SBOM file not found: /missing.json');
  });
});
