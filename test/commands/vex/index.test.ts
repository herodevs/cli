import type { CdxBom } from '@herodevs/eol-shared';
import type { Config } from '@oclif/core';
import { vi } from 'vitest';
import type { OpenVexDocument } from '../../../src/service/vex.svc.ts';

const { fetchVexStatementMock, applyVexFiltersMock, trackMock, readSbomFromFileMock, saveArtifactToFileMock } =
  vi.hoisted(() => ({
    fetchVexStatementMock: vi.fn(),
    applyVexFiltersMock: vi.fn(),
    trackMock: vi.fn(),
    readSbomFromFileMock: vi.fn(),
    saveArtifactToFileMock: vi.fn(),
  }));

vi.mock('../../../src/service/vex.svc.ts', () => ({
  fetchVexStatement: fetchVexStatementMock,
  applyVexFilters: applyVexFiltersMock,
}));

vi.mock('../../../src/service/file.svc.ts', () => ({
  readSbomFromFile: readSbomFromFileMock,
  saveArtifactToFile: saveArtifactToFileMock,
}));

vi.mock('../../../src/service/analytics.svc.ts', () => ({
  track: trackMock,
}));

import Vex from '../../../src/commands/vex/index.ts';

const sampleVex: OpenVexDocument = {
  '@context': 'https://openvex.dev/ns/v0.2.0',
  '@id': 'https://openvex.dev/docs/public/vex-test',
  author: 'HeroDevs',
  version: 1,
  statements: [
    {
      vulnerability: { name: 'CVE-2021-23337' },
      products: [{ '@id': 'pkg:npm/lodash@4.17.20' }],
      status: 'not_affected',
    },
  ],
};

const filteredVex: OpenVexDocument = {
  ...sampleVex,
  statements: [],
};

type VexCommandInternals = {
  parse: (...args: unknown[]) => Promise<{ flags: Record<string, unknown> }>;
  log: (message: string) => void;
  warn: (message: string) => void;
  error: (message: string | Error) => never;
  jsonEnabled: () => boolean;
  run: () => Promise<OpenVexDocument>;
};

function createCommand(): VexCommandInternals {
  return new Vex([], {} as Config) as unknown as VexCommandInternals;
}

describe('vex command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchVexStatementMock.mockResolvedValue(sampleVex);
    applyVexFiltersMock.mockImplementation((vex: OpenVexDocument) => vex);
    saveArtifactToFileMock.mockReturnValue('/cwd/herodevs.openvex.json');
  });

  describe('default behavior (no flags)', () => {
    it('fetches VEX and logs it as formatted JSON to stdout', async () => {
      const command = createCommand();
      vi.spyOn(command, 'parse').mockResolvedValue({ flags: {} });
      const logSpy = vi.spyOn(command, 'log').mockImplementation(() => {});
      vi.spyOn(command, 'jsonEnabled').mockReturnValue(false);

      const result = await command.run();

      expect(fetchVexStatementMock).toHaveBeenCalledOnce();
      expect(applyVexFiltersMock).not.toHaveBeenCalled();
      expect(logSpy).toHaveBeenCalledWith(JSON.stringify(sampleVex, null, 2));
      expect(result).toEqual(sampleVex);
    });

    it('returns the VEX document', async () => {
      const command = createCommand();
      vi.spyOn(command, 'parse').mockResolvedValue({ flags: {} });
      vi.spyOn(command, 'log').mockImplementation(() => {});
      vi.spyOn(command, 'jsonEnabled').mockReturnValue(true);

      const result = await command.run();

      expect(result).toEqual(sampleVex);
    });

    it('skips logging JSON when --json flag is active', async () => {
      const command = createCommand();
      vi.spyOn(command, 'parse').mockResolvedValue({ flags: {} });
      const logSpy = vi.spyOn(command, 'log').mockImplementation(() => {});
      vi.spyOn(command, 'jsonEnabled').mockReturnValue(true);

      await command.run();

      expect(logSpy).not.toHaveBeenCalled();
    });
  });

  describe('filtering', () => {
    it('reads SBOM and passes it to applyVexFilters when --file is provided', async () => {
      const mockSbom = { components: [] } as unknown as CdxBom;
      readSbomFromFileMock.mockReturnValue(mockSbom);

      const command = createCommand();
      vi.spyOn(command, 'parse').mockResolvedValue({ flags: { file: '/path/to/sbom.json' } });
      vi.spyOn(command, 'log').mockImplementation(() => {});
      vi.spyOn(command, 'jsonEnabled').mockReturnValue(false);

      await command.run();

      expect(readSbomFromFileMock).toHaveBeenCalledWith('/path/to/sbom.json');
      expect(applyVexFiltersMock).toHaveBeenCalledWith(sampleVex, expect.objectContaining({ sbom: mockSbom }));
    });

    it('passes package patterns to applyVexFilters', async () => {
      const command = createCommand();
      vi.spyOn(command, 'parse').mockResolvedValue({ flags: { package: ['pkg:npm/lodash*', 'pkg:npm/express*'] } });
      vi.spyOn(command, 'log').mockImplementation(() => {});
      vi.spyOn(command, 'jsonEnabled').mockReturnValue(false);

      await command.run();

      expect(applyVexFiltersMock).toHaveBeenCalledWith(
        sampleVex,
        expect.objectContaining({ packagePatterns: ['pkg:npm/lodash*', 'pkg:npm/express*'] }),
      );
    });

    it('passes vuln patterns to applyVexFilters', async () => {
      const command = createCommand();
      vi.spyOn(command, 'parse').mockResolvedValue({ flags: { vuln: ['CVE-2021-*'] } });
      vi.spyOn(command, 'log').mockImplementation(() => {});
      vi.spyOn(command, 'jsonEnabled').mockReturnValue(false);

      await command.run();

      expect(applyVexFiltersMock).toHaveBeenCalledWith(
        sampleVex,
        expect.objectContaining({ vulnPatterns: ['CVE-2021-*'] }),
      );
    });

    it('passes status list to applyVexFilters', async () => {
      const command = createCommand();
      vi.spyOn(command, 'parse').mockResolvedValue({ flags: { status: ['not_affected', 'fixed'] } });
      vi.spyOn(command, 'log').mockImplementation(() => {});
      vi.spyOn(command, 'jsonEnabled').mockReturnValue(false);

      await command.run();

      expect(applyVexFiltersMock).toHaveBeenCalledWith(
        sampleVex,
        expect.objectContaining({ statuses: ['not_affected', 'fixed'] }),
      );
    });

    it('skips applyVexFilters entirely when no filters are provided', async () => {
      const command = createCommand();
      vi.spyOn(command, 'parse').mockResolvedValue({ flags: {} });
      vi.spyOn(command, 'log').mockImplementation(() => {});
      vi.spyOn(command, 'jsonEnabled').mockReturnValue(false);

      await command.run();

      expect(applyVexFiltersMock).not.toHaveBeenCalled();
    });

    it('logs the filtered VEX, not the original', async () => {
      applyVexFiltersMock.mockReturnValue(filteredVex);

      const command = createCommand();
      vi.spyOn(command, 'parse').mockResolvedValue({ flags: { status: ['affected'] } });
      const logSpy = vi.spyOn(command, 'log').mockImplementation(() => {});
      vi.spyOn(command, 'jsonEnabled').mockReturnValue(false);

      const result = await command.run();

      expect(logSpy).toHaveBeenCalledWith(JSON.stringify(filteredVex, null, 2));
      expect(result).toEqual(filteredVex);
    });
  });

  describe('saving', () => {
    it('saves to default path when --save is provided', async () => {
      const command = createCommand();
      vi.spyOn(command, 'parse').mockResolvedValue({ flags: { save: true } });
      const logSpy = vi.spyOn(command, 'log').mockImplementation(() => {});
      vi.spyOn(command, 'jsonEnabled').mockReturnValue(false);

      await command.run();

      expect(saveArtifactToFileMock).toHaveBeenCalledWith(process.cwd(), {
        kind: 'vex',
        payload: sampleVex,
        outputPath: undefined,
      });
      expect(logSpy).toHaveBeenCalledWith('VEX statement saved to /cwd/herodevs.openvex.json');
    });

    it('saves to custom path when --save and --output are both provided', async () => {
      const command = createCommand();
      vi.spyOn(command, 'parse').mockResolvedValue({ flags: { save: true, output: './reports/my-vex.json' } });
      vi.spyOn(command, 'log').mockImplementation(() => {});
      vi.spyOn(command, 'jsonEnabled').mockReturnValue(false);

      await command.run();

      expect(saveArtifactToFileMock).toHaveBeenCalledWith(process.cwd(), {
        kind: 'vex',
        payload: sampleVex,
        outputPath: './reports/my-vex.json',
      });
    });

    it('does not save when no save flags are provided', async () => {
      const command = createCommand();
      vi.spyOn(command, 'parse').mockResolvedValue({ flags: {} });
      vi.spyOn(command, 'log').mockImplementation(() => {});
      vi.spyOn(command, 'jsonEnabled').mockReturnValue(false);

      await command.run();

      expect(saveArtifactToFileMock).not.toHaveBeenCalled();
    });

    it('warns and does not save when --output is given without --save', async () => {
      const command = createCommand();
      vi.spyOn(command, 'parse').mockResolvedValue({ flags: { output: './my-vex.json' } });
      vi.spyOn(command, 'log').mockImplementation(() => {});
      const warnSpy = vi.spyOn(command, 'warn').mockImplementation(() => {});
      vi.spyOn(command, 'jsonEnabled').mockReturnValue(false);

      await command.run();

      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('--output requires --save'));
      expect(saveArtifactToFileMock).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('errors with a descriptive message when fetch fails', async () => {
      fetchVexStatementMock.mockRejectedValue(new Error('Network error'));

      const command = createCommand();
      vi.spyOn(command, 'parse').mockResolvedValue({ flags: {} });
      vi.spyOn(command, 'error').mockImplementation((msg: string | Error) => {
        throw new Error(typeof msg === 'string' ? msg : msg.message);
      });

      await expect(command.run()).rejects.toThrow('Failed to fetch VEX statement. Network error');
    });

    it('errors when SBOM file cannot be read', async () => {
      readSbomFromFileMock.mockImplementation(() => {
        throw new Error('SBOM file not found: /missing/sbom.json');
      });

      const command = createCommand();
      vi.spyOn(command, 'parse').mockResolvedValue({ flags: { file: '/missing/sbom.json' } });
      vi.spyOn(command, 'error').mockImplementation((msg: string | Error) => {
        throw new Error(typeof msg === 'string' ? msg : msg.message);
      });

      await expect(command.run()).rejects.toThrow('SBOM file not found: /missing/sbom.json');
    });
  });

  describe('analytics', () => {
    it('tracks download started and completed events', async () => {
      const command = createCommand();
      vi.spyOn(command, 'parse').mockResolvedValue({ flags: {} });
      vi.spyOn(command, 'log').mockImplementation(() => {});
      vi.spyOn(command, 'jsonEnabled').mockReturnValue(false);

      await command.run();

      const events = trackMock.mock.calls.map(([event]: [string]) => event);
      expect(events).toContain('CLI VEX Download Started');
      expect(events).toContain('CLI VEX Download Completed');
    });

    it('tracks statement count and filtered flag on completion', async () => {
      const command = createCommand();
      vi.spyOn(command, 'parse').mockResolvedValue({ flags: { vuln: ['CVE-*'] } });
      vi.spyOn(command, 'log').mockImplementation(() => {});
      vi.spyOn(command, 'jsonEnabled').mockReturnValue(false);

      await command.run();

      const completedCall = trackMock.mock.calls.find(([event]: [string]) => event === 'CLI VEX Download Completed');
      expect(completedCall).toBeDefined();
      const getProperties = completedCall?.[1] as (ctx: Record<string, unknown>) => Record<string, unknown>;
      const properties = getProperties({ command: 'vex', command_flags: '--vuln CVE-*' });
      expect(properties.statement_count).toEqual(expect.any(Number));
      expect(properties.filtered).toBe(true);
    });

    it('tracks download failed event on fetch error', async () => {
      fetchVexStatementMock.mockRejectedValue(new Error('timeout'));

      const command = createCommand();
      vi.spyOn(command, 'parse').mockResolvedValue({ flags: {} });
      vi.spyOn(command, 'error').mockImplementation(() => {
        throw new Error('error');
      });

      await command.run().catch(() => {});

      const events = trackMock.mock.calls.map(([event]: [string]) => event);
      expect(events).toContain('CLI VEX Download Failed');
    });
  });
});
