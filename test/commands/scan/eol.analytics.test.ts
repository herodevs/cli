import type { CdxBom, EolReport } from '@herodevs/eol-shared';
import { ApiError } from '../../../src/api/errors.ts';
import ScanEol from '../../../src/commands/scan/eol.ts';

const { trackMock, requireAccessTokenForScanMock, submitScanMock, countComponentsByStatusMock } = vi.hoisted(() => ({
  trackMock: vi.fn(),
  requireAccessTokenForScanMock: vi.fn(),
  submitScanMock: vi.fn(),
  countComponentsByStatusMock: vi.fn(),
}));

vi.mock('@herodevs/eol-shared', () => ({
  trimCdxBom: vi.fn((sbom: unknown) => sbom),
}));

vi.mock('../../../src/service/analytics.svc.ts', () => ({
  track: trackMock,
}));

vi.mock('../../../src/service/auth.svc.ts', () => ({
  requireAccessTokenForScan: requireAccessTokenForScanMock,
}));

vi.mock('../../../src/api/nes.client.ts', () => ({
  submitScan: submitScanMock,
}));

vi.mock('../../../src/service/display.svc.ts', () => ({
  countComponentsByStatus: countComponentsByStatusMock,
  formatDataPrivacyLink: vi.fn(() => []),
  formatReportSaveHint: vi.fn(() => []),
  formatScanResults: vi.fn(() => []),
  formatWebReportUrl: vi.fn(() => []),
}));

vi.mock('../../../src/service/file.svc.ts', () => ({
  readSbomFromFile: vi.fn(),
  saveArtifactToFile: vi.fn(),
  validateDirectory: vi.fn(),
}));

vi.mock('../../../src/service/cdx.svc.ts', () => ({
  createSbom: vi.fn(),
}));

vi.mock('ora', () => ({
  default: vi.fn(() => ({
    start: vi.fn().mockReturnThis(),
    succeed: vi.fn().mockReturnThis(),
    fail: vi.fn().mockReturnThis(),
  })),
}));

type ParseFlags = {
  automated?: boolean;
  saveTrimmedSbom?: boolean;
  dir?: string;
  file?: string;
  save?: boolean;
  output?: string;
  saveSbom?: boolean;
  sbomOutput?: string;
  hideReportUrl?: boolean;
};

type ScanCommandInternals = {
  parse: (...args: unknown[]) => Promise<{ flags: ParseFlags }>;
  error: (message: string) => never;
  scanSbom: (sbom: CdxBom) => Promise<EolReport>;
  loadSbom: () => Promise<CdxBom>;
  displayResults: (report: EolReport, hideReportUrl: boolean, hasCustomOutput: boolean) => void;
  jsonEnabled: () => boolean;
  run: () => Promise<EolReport | undefined>;
};

function createCommand(): ScanCommandInternals {
  return new ScanEol([], {} as Record<string, unknown>) as unknown as ScanCommandInternals;
}

function getTrackProperties(eventName: string): Record<string, unknown> {
  const call = trackMock.mock.calls.find(([event]) => event === eventName);
  if (!call) {
    throw new Error(`Expected analytics event ${eventName} to be tracked`);
  }

  const getProperties = call[1] as (context: Record<string, unknown>) => Record<string, unknown>;
  return getProperties({ command: 'scan:eol', command_flags: '--file sample.sbom.json' });
}

describe('scan:eol analytics timing', () => {
  const sampleSbom = {
    bomFormat: 'CycloneDX',
    specVersion: '1.5',
    metadata: {},
    components: [{ purl: 'pkg:npm/test@1.0.0' }],
  } as unknown as CdxBom;

  const sampleReport = {
    id: 'report-123',
    metadata: {},
    createdOn: new Date().toISOString(),
    components: [{ purl: 'pkg:npm/test@1.0.0', metadata: {} }],
  } as unknown as EolReport;

  beforeEach(() => {
    vi.clearAllMocks();
    requireAccessTokenForScanMock.mockResolvedValue(undefined);
    countComponentsByStatusMock.mockReturnValue({
      EOL: 1,
      EOL_UPCOMING: 0,
      OK: 0,
      UNKNOWN: 0,
      NES_AVAILABLE: 0,
      TOTAL: 1,
      ECOSYSTEMS: ['npm'],
    });
  });

  it('tracks scan_load_time on timeout-like scan failures', async () => {
    submitScanMock.mockRejectedValue(new Error('GraphQL request timed out after 60000ms'));

    const command = createCommand();
    vi.spyOn(command, 'parse').mockResolvedValue({
      flags: { automated: false, saveTrimmedSbom: false, dir: process.cwd() },
    });
    vi.spyOn(command, 'error').mockImplementation((message: string) => {
      throw new Error(message);
    });

    await expect(command.scanSbom(sampleSbom)).rejects.toThrow(
      'Failed to submit scan to NES. GraphQL request timed out after 60000ms',
    );

    const properties = getTrackProperties('CLI EOL Scan Failed');
    expect(properties.scan_failure_reason).toBe('GraphQL request timed out after 60000ms');
    expect(properties.scan_load_time).toEqual(expect.any(Number));
    expect(properties.scan_load_time as number).toBeGreaterThanOrEqual(0);
  });

  it('tracks scan_load_time on ApiError scan failures', async () => {
    submitScanMock.mockRejectedValue(new ApiError('forbidden', 'FORBIDDEN'));

    const command = createCommand();
    vi.spyOn(command, 'parse').mockResolvedValue({
      flags: { automated: false, saveTrimmedSbom: false, dir: process.cwd() },
    });
    vi.spyOn(command, 'error').mockImplementation((message: string) => {
      throw new Error(message);
    });

    await expect(command.scanSbom(sampleSbom)).rejects.toThrow('You do not have permission to perform this action.');

    const properties = getTrackProperties('CLI EOL Scan Failed');
    expect(properties.scan_failure_reason).toBe('FORBIDDEN');
    expect(properties.scan_load_time).toEqual(expect.any(Number));
    expect(properties.scan_load_time as number).toBeGreaterThanOrEqual(0);
  });

  it('keeps scan_load_time on successful completion events', async () => {
    const command = createCommand();

    vi.spyOn(command, 'parse').mockResolvedValue({
      flags: {
        file: '/tmp/sample.sbom.json',
        save: false,
        output: undefined,
        saveSbom: false,
        sbomOutput: undefined,
        saveTrimmedSbom: false,
        hideReportUrl: false,
        automated: false,
      },
    });
    vi.spyOn(command, 'loadSbom').mockResolvedValue(sampleSbom);
    vi.spyOn(command, 'scanSbom').mockResolvedValue(sampleReport);
    vi.spyOn(command, 'displayResults').mockImplementation(() => {});
    vi.spyOn(command, 'jsonEnabled').mockReturnValue(true);

    await command.run();

    const properties = getTrackProperties('CLI EOL Scan Completed');
    expect(properties.scan_load_time).toEqual(expect.any(Number));
    expect(properties.scan_load_time as number).toBeGreaterThanOrEqual(0);
  });
});
