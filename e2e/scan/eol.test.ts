import { doesNotThrow } from 'node:assert';
import { doesNotMatch, match, notStrictEqual, ok, strictEqual } from 'node:assert/strict';
import { exec } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { existsSync, readFileSync, rmSync, unlinkSync, writeFileSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, it } from 'node:test';
import { promisify } from 'node:util';
import type { DeepPartial } from '@apollo/client/utilities';
import type { EolScanComponent } from '@herodevs/eol-shared';
import { runCommand } from '@oclif/test';
import { config, filenamePrefix } from '../../src/config/constants.ts';
import { FetchMock } from '../../test/utils/mocks/fetch.mock.ts';

const execAsync = promisify(exec);
const fixturesDir = path.resolve(import.meta.dirname, '../fixtures');
const simpleDir = path.resolve(fixturesDir, 'npm/simple');
const simpleSbom = path.join(simpleDir, 'sbom.json');
const simpleSpdxSbom = path.join(fixturesDir, 'npm/simple-spdx.sbom.json');
const upToDateDir = path.resolve(fixturesDir, 'npm/up-to-date');
const upToDateSbom = path.join(fixturesDir, 'npm/up-to-date.sbom.json');
const noComponentsSbom = path.join(fixturesDir, 'npm/no-components.sbom.json');

function mockUserSetupStatus(orgId = 1) {
  return {
    eol: {
      userSetupStatus: {
        isComplete: true,
        orgId,
      },
    },
  };
}

function mockReport(components: DeepPartial<EolScanComponent>[] = []) {
  return {
    eol: {
      createReport: {
        success: true,
        id: 'test-123',
        totalRecords: components.length,
      },
    },
  };
}

function mockGetReport(components: DeepPartial<EolScanComponent>[] = []) {
  return {
    eol: {
      report: {
        id: 'test-123',
        createdOn: new Date().toISOString(),
        metadata: {
          totalComponentsCount: components.length,
          unknownComponentsCount: 0,
          totalUniqueComponentsCount: components.length,
        },
        components,
        page: 1,
        totalRecords: components.length,
      },
    },
  };
}

describe('environment', () => {
  it('should not be configured to run against the production environment', () => {
    notStrictEqual(process.env.GRAPHQL_HOST, 'https://api.nes.herodevs.com', 'GRAPHQL_HOST should not be production');
    notStrictEqual(
      process.env.EOL_REPORT_URL,
      'https://eol-report-card.apps.herodevs.com/reports',
      'EOL_REPORT_URL should not be production',
    );
    notStrictEqual(config.graphqlHost, 'https://api.nes.herodevs.com', 'config.graphqlHost should not be production');
    notStrictEqual(
      config.eolReportUrl,
      'https://eol-report-card.apps.herodevs.com/reports',
      'config.eolReportUrl should not be production',
    );
  });
});

describe('scan:eol e2e', () => {
  let fetchMock: FetchMock;

  beforeEach(async () => {
    await mkdir(fixturesDir, { recursive: true });
    const components = [
      { purl: 'pkg:npm/bootstrap@3.1.1', metadata: { isEol: true } },
      {
        purl: 'pkg:npm/is-core-module@2.11.0',
        metadata: {},
        nesRemediation: { remediations: [{ urls: { main: 'https://example.com' } }] },
      },
    ];
    fetchMock = new FetchMock()
      .addGraphQL(mockUserSetupStatus())
      .addGraphQL(mockReport(components))
      .addGraphQL(mockGetReport(components));
  });

  afterEach(() => {
    fetchMock.restore();
  });

  describe('default arguments', () => {
    it('runs scan:eol with file flag and shows results', async () => {
      const { stdout } = await run(`scan:eol --file ${simpleSbom}`);
      match(stdout, /Scan results:/, 'Should show results header');
      match(stdout, /1( .*)End-of-Life \(EOL\)/, 'Should show EOL count of 1');
      match(stdout, /total packages scanned/i, 'Should show total packages scanned');
    });

    it('runs scan:eol with --json and produces valid JSON', async () => {
      const { stdout } = await run(`scan:eol --file ${simpleSbom} --json`);
      doesNotMatch(stdout, /Scan results:/, 'Should not show results header');
      doesNotThrow(() => JSON.parse(stdout), 'Output should be valid JSON');
    });

    it('shows help for scan:eol when --help is passed in', async () => {
      const { stdout } = await execAsync('node bin/run.js --help');
      match(stdout, /USAGE/, 'Should show usage section');
      match(stdout, /FLAGS/, 'Should show flags section');
      match(stdout, /EXAMPLES/, 'Should show examples section');
    });

    it('shows global help when help is passed in', async () => {
      const { stdout } = await execAsync('node bin/run.js help');
      match(stdout, /USAGE/, 'Should show usage section');
      match(stdout, /TOPICS/, 'Should show topics section');
      match(stdout, /COMMANDS/, 'Should show commands section');
    });
  });

  async function run(cmd: string) {
    const output = await runCommand(cmd);
    if (output.error) {
      console.error('Command failed with error:', output.error);
      console.error('Error details:', output.stderr);
    }
    strictEqual(output.error, undefined, 'Command should execute without errors');
    return output;
  }

  it('scans existing SBOM for EOL components', async () => {
    const cmd = `scan:eol --file ${simpleSbom}`;
    const { stdout } = await run(cmd);
    match(stdout, /Scan results:/, 'Should show results header');
    match(stdout, /1( .*)End-of-Life \(EOL\)/, 'Should show EOL count');
    match(stdout, /2 total packages scanned/, 'Should show total packages scanned');
  });

  it('scans existing SPDX SBOM file and converts to CycloneDX', async () => {
    const cmd = `scan:eol --file ${simpleSpdxSbom}`;
    const { stdout } = await run(cmd);
    match(stdout, /Scan results:/, 'Should show results header');
    match(stdout, /1( .*)End-of-Life \(EOL\)/, 'Should show EOL count');
    match(stdout, /2 total packages scanned/, 'Should show total packages scanned with SPDX input');
  });

  it('shows warning and does not generate report when no components are found in scan', async () => {
    const cmd = `scan:eol --file ${noComponentsSbom}`;
    const { stdout } = await run(cmd);
    match(
      stdout,
      /No components found in scan. Report not generated./,
      'Should show warning, no results header or package totals',
    );
  });

  it('saves report when --save flag is used (directory scan)', async () => {
    const reportPath = path.join(simpleDir, `${filenamePrefix}.report.json`);
    const cmd = `scan:eol --dir ${simpleDir} --save`;
    await run(cmd);

    const reportExists = existsSync(reportPath);
    strictEqual(reportExists, true, 'Report file should be created');

    const reportText = readFileSync(reportPath, 'utf-8');
    const reportJson = JSON.parse(reportText);
    strictEqual(Array.isArray(reportJson.components), true, 'components should be an array');
    strictEqual(reportJson.components.length, 2, 'should have 2 components');
    const bootstrap = reportJson.components.find((c: { purl?: string }) => c.purl === 'pkg:npm/bootstrap@3.1.1');
    strictEqual(!!bootstrap, true, 'should include bootstrap 3.1.1');
    strictEqual(bootstrap.metadata?.isEol, true, 'bootstrap should be EOL');
    const hasNes = reportJson.components.some(
      (c: { nesRemediation?: { remediations?: unknown[] } }) => !!c.nesRemediation?.remediations?.length,
    );
    strictEqual(hasNes, true, 'should include at least one NES remediation');
    match(
      reportText,
      /"createdOn": "\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z)"/,
      'Report should contain a date created on property in ISO format',
    );
    unlinkSync(reportPath);
  });

  it('warns and skips saving when --output is provided without --save', async () => {
    const customDir = path.join(tmpdir(), 'scan-eol-report-output', randomUUID());
    const customPath = path.join(customDir, 'custom-report.json');

    const cmd = `scan:eol --dir ${simpleDir} --output ${customPath}`;
    const { stderr } = await run(cmd);

    const reportExists = existsSync(customPath);
    strictEqual(reportExists, false, 'Custom report file should not be created without --save');

    match(stderr, /--output requires --save to write the report/i, 'Should warn that --output needs --save');

    if (existsSync(customDir)) {
      rmSync(customDir, { recursive: true, force: true });
    }
  });

  it('saves report to a custom path when --save and --output are provided', async () => {
    const customDir = path.join(fixturesDir, 'outputs-save');
    const customPath = path.join(customDir, 'custom-report.json');
    await mkdir(customDir, { recursive: true });

    const cmd = `scan:eol --dir ${simpleDir} --save --output ${customPath}`;
    const { stderr } = await run(cmd);

    const reportExists = existsSync(customPath);
    strictEqual(reportExists, true, 'Custom report file should be created when --save is provided');

    doesNotMatch(stderr, /--output requires --save to write the report/i, 'Should not warn when --save is provided');

    const reportJson = JSON.parse(readFileSync(customPath, 'utf-8'));
    ok(Array.isArray(reportJson.components), 'Report should have components array');

    unlinkSync(customPath);
    rmSync(customDir, { recursive: true, force: true });
  });

  it('outputs JSON only when using the --json flag', async () => {
    const cmd = `scan:eol --file ${simpleSbom} --json`;
    const { stdout } = await run(cmd);
    doesNotMatch(stdout, /Scan results:/, 'Should not show results header');
    const json = JSON.parse(stdout);
    // Accept either SBOM or report JSON depending on CLI output behavior
    if (json.bomFormat) {
      strictEqual(json.bomFormat, 'CycloneDX', 'Should be CycloneDX format');
    } else {
      strictEqual(Array.isArray(json.components), true, 'Should have components array');
      const bootstrap = json.components.find(
        (c: { purl?: string }) => typeof c.purl === 'string' && c.purl.includes('pkg:npm/bootstrap@'),
      );
      strictEqual(!!bootstrap, true, 'Should include bootstrap');
    }
  });

  it('shows zero EOL components when scanning up-to-date packages', async () => {
    const components = [
      { purl: 'pkg:npm/bootstrap@5.3.5', metadata: {} },
      { purl: 'pkg:npm/vue@3.5.13', metadata: {} },
    ];
    fetchMock.restore();
    fetchMock = new FetchMock()
      .addGraphQL(mockUserSetupStatus())
      .addGraphQL(mockReport(components))
      .addGraphQL(mockGetReport(components));
    const cmd = `scan:eol --file ${upToDateSbom}`;
    const { stdout } = await run(cmd);
    match(stdout, /Scan results:/, 'Should show results header');
    match(stdout, /0( .*)End-of-Life \(EOL\)/, 'Should show EOL count of 0');
    match(stdout, /2 total packages scanned/, 'Should show total packages scanned');
  });

  it('handles empty components array without errors', async () => {
    fetchMock.restore();
    fetchMock = new FetchMock()
      .addGraphQL(mockUserSetupStatus())
      .addGraphQL(mockReport([]))
      .addGraphQL(mockGetReport([]));
    const cmd = `scan:eol --file ${noComponentsSbom}`;
    const { stdout } = await run(cmd);
    match(stdout, /No components found in scan/, 'Should show no packages found in scan');
  });

  it('saves SBOM when --saveSbom flag is used (directory scan)', async () => {
    const sbomPath = path.join(simpleDir, `${filenamePrefix}.sbom.json`);
    const cmd = `scan:eol --dir ${simpleDir} --saveSbom`;
    await run(cmd);

    const sbomExists = existsSync(sbomPath);
    strictEqual(sbomExists, true, 'SBOM file should be created');

    const sbomText = readFileSync(sbomPath, 'utf-8');
    const sbomJson = JSON.parse(sbomText);
    strictEqual(sbomJson.bomFormat, 'CycloneDX', 'Should be CycloneDX format');
    strictEqual(Array.isArray(sbomJson.components), true, 'Should have components array');
    match(sbomText, /"name": "@herodevs\/cli"/, 'Should include HeroDevs CLI attribution');
    unlinkSync(sbomPath);
  });

  it('warns and skips saving when --sbomOutput is provided without --saveSbom', async () => {
    const customDir = path.join(tmpdir(), 'scan-eol-sbom-output', randomUUID());
    const customPath = path.join(customDir, 'custom-sbom.json');
    await mkdir(customDir, { recursive: true });

    const cmd = `scan:eol --dir ${simpleDir} --sbomOutput ${customPath}`;
    const { stderr } = await run(cmd);

    const sbomExists = existsSync(customPath);
    strictEqual(sbomExists, false, 'Custom SBOM file should not be created without --saveSbom');

    match(
      stderr,
      /--sbomOutput requires --saveSbom to write the SBOM/i,
      'Should warn that --sbomOutput needs --saveSbom',
    );

    rmSync(customDir, { recursive: true, force: true });
  });

  it('saves SBOM to a custom path when --sbomOutput is provided', async () => {
    const customDir = path.join(fixturesDir, 'sbom-outputs');
    const customPath = path.join(customDir, 'custom-sbom.json');
    await mkdir(customDir, { recursive: true });

    const cmd = `scan:eol --dir ${simpleDir} --saveSbom --sbomOutput ${customPath}`;
    const { stderr } = await run(cmd);

    const sbomExists = existsSync(customPath);
    strictEqual(sbomExists, true, 'Custom SBOM file should be created');

    doesNotMatch(
      stderr,
      /--sbomOutput requires --saveSbom to write the SBOM/i,
      'Should not warn when --saveSbom is provided',
    );

    const sbomJson = JSON.parse(readFileSync(customPath, 'utf-8'));
    strictEqual(sbomJson.bomFormat, 'CycloneDX', 'SBOM should be CycloneDX format');

    unlinkSync(customPath);
    rmSync(customDir, { recursive: true, force: true });
  });

  it('saves both report and SBOM when both --save and --saveSbom flags are used', async () => {
    const reportPath = path.join(simpleDir, `${filenamePrefix}.report.json`);
    const sbomPath = path.join(simpleDir, `${filenamePrefix}.sbom.json`);
    const cmd = `scan:eol --dir ${simpleDir} --save --saveSbom`;
    await run(cmd);

    const reportExists = existsSync(reportPath);
    const sbomExists = existsSync(sbomPath);
    strictEqual(reportExists, true, 'Report file should be created');
    strictEqual(sbomExists, true, 'SBOM file should be created');

    const reportText = readFileSync(reportPath, 'utf-8');
    const sbomText = readFileSync(sbomPath, 'utf-8');
    const reportJson = JSON.parse(reportText);
    const sbomJson = JSON.parse(sbomText);

    strictEqual(Array.isArray(reportJson.components), true, 'Report should have components array');
    strictEqual(sbomJson.bomFormat, 'CycloneDX', 'SBOM should be CycloneDX format');

    unlinkSync(reportPath);
    unlinkSync(sbomPath);
  });

  it('saves trimmed SBOM when --saveTrimmedSbom flag is used (directory scan)', async () => {
    const trimmedSbomPath = path.join(simpleDir, `${filenamePrefix}.sbom-trimmed.json`);
    const cmd = `scan:eol --dir ${simpleDir} --saveTrimmedSbom`;
    await run(cmd);

    const trimmedSbomExists = existsSync(trimmedSbomPath);
    strictEqual(trimmedSbomExists, true, 'Trimmed SBOM file should be created');

    const trimmedSbomText = readFileSync(trimmedSbomPath, 'utf-8');
    const trimmedSbomJson = JSON.parse(trimmedSbomText);
    strictEqual(trimmedSbomJson.bomFormat, 'CycloneDX', 'Should be CycloneDX format');
    strictEqual(Array.isArray(trimmedSbomJson.components), true, 'Should have components array');

    unlinkSync(trimmedSbomPath);
  });

  it('saves all three files when --save, --saveSbom, and --saveTrimmedSbom flags are used', async () => {
    const reportPath = path.join(simpleDir, `${filenamePrefix}.report.json`);
    const sbomPath = path.join(simpleDir, `${filenamePrefix}.sbom.json`);
    const trimmedSbomPath = path.join(simpleDir, `${filenamePrefix}.sbom-trimmed.json`);
    const cmd = `scan:eol --dir ${simpleDir} --save --saveSbom --saveTrimmedSbom`;
    await run(cmd);

    const reportExists = existsSync(reportPath);
    const sbomExists = existsSync(sbomPath);
    const trimmedSbomExists = existsSync(trimmedSbomPath);
    strictEqual(reportExists, true, 'Report file should be created');
    strictEqual(sbomExists, true, 'SBOM file should be created');
    strictEqual(trimmedSbomExists, true, 'Trimmed SBOM file should be created');

    const reportText = readFileSync(reportPath, 'utf-8');
    const sbomText = readFileSync(sbomPath, 'utf-8');
    const trimmedSbomText = readFileSync(trimmedSbomPath, 'utf-8');
    const reportJson = JSON.parse(reportText);
    const sbomJson = JSON.parse(sbomText);
    const trimmedSbomJson = JSON.parse(trimmedSbomText);

    strictEqual(Array.isArray(reportJson.components), true, 'Report should have components array');
    strictEqual(sbomJson.bomFormat, 'CycloneDX', 'SBOM should be CycloneDX format');
    strictEqual(trimmedSbomJson.bomFormat, 'CycloneDX', 'Trimmed SBOM should be CycloneDX format');

    // Verify that trimmed SBOM has valid structure
    const trimmedKeys = Object.keys(trimmedSbomJson);
    strictEqual(trimmedKeys.length > 0, true, 'Trimmed SBOM should have some properties');

    unlinkSync(reportPath);
    unlinkSync(sbomPath);
    unlinkSync(trimmedSbomPath);
  });

  it('scans up-to-date directory and shows modern packages', async () => {
    fetchMock.restore();
    const components = [
      { purl: 'pkg:npm/bootstrap@5.3.5', metadata: {} },
      { purl: 'pkg:npm/vue@3.5.13', metadata: {} },
    ];
    fetchMock = new FetchMock()
      .addGraphQL(mockUserSetupStatus())
      .addGraphQL(mockReport(components))
      .addGraphQL(mockGetReport(components));
    const cmd = `scan:eol --dir ${upToDateDir}`;
    const { stdout } = await run(cmd);
    match(stdout, /Scan results:/, 'Should show results header');
    match(stdout, /0( .*)End-of-Life \(EOL\)/, 'Should show EOL count of 0');
    match(stdout, /total packages scanned/, 'Should show total packages scanned');
  });

  describe('web report URL', () => {
    it('displays web report URL with scan ID when scan is successful', async () => {
      const cmd = `scan:eol --file ${simpleSbom}`;
      const { stdout } = await run(cmd);
      match(stdout, /View your full EOL report at.*test-123/, 'Should show web report text and scan ID');
    });

    it('does not display web report URL when using --json flag', async () => {
      const cmd = `scan:eol --file ${simpleSbom} --json`;
      const { stdout } = await run(cmd);
      doesNotMatch(stdout, /View your full EOL report/, 'Should not show web report text in JSON output');
    });

    it('shows save hint when --hideReportUrl flag is used', async () => {
      const cmd = `scan:eol --file ${simpleSbom} --hideReportUrl`;
      const { stdout } = await run(cmd);
      doesNotMatch(stdout, /View your full EOL report/, 'Should not show web report text when hidden');
      match(stdout, /To save your detailed JSON report, use the --save flag/, 'Should show save hint message');
    });

    it('omits save hint when --hideReportUrl is paired with custom outputs', async () => {
      const customDir = path.join(fixturesDir, 'hide-report-output');
      const customPath = path.join(customDir, 'custom-report.json');
      await mkdir(customDir, { recursive: true });
      const cmd = `scan:eol --file ${simpleSbom} --hideReportUrl --save --output ${customPath}`;
      const { stdout, stderr } = await run(cmd);

      doesNotMatch(
        stdout,
        /To save your detailed JSON report, use the --save flag/,
        'Should not show save hint when custom outputs are provided',
      );

      doesNotMatch(
        stderr,
        /Warning: --output requires --save to write the report/i,
        'Should not warn when --save is provided',
      );

      strictEqual(existsSync(customPath), true, 'Custom report file should be created');

      if (existsSync(customPath)) {
        unlinkSync(customPath);
      }
      rmSync(customDir, { recursive: true, force: true });
    });
  });

  describe('privacy and transparency', () => {
    it('displays data privacy link in scan results', async () => {
      const cmd = `scan:eol --file ${simpleSbom}`;
      const { stdout } = await run(cmd);
      match(stdout, /Learn more about data privacy/i, 'Should show data privacy link');
      match(stdout, /docs\.herodevs\.com\/eol-ds\/data-privacy-and-security/i, 'Should include HeroDevs docs URL');
    });

    it('does not display privacy link when using --json flag', async () => {
      const cmd = `scan:eol --file ${simpleSbom} --json`;
      const { stdout } = await run(cmd);
      doesNotMatch(stdout, /Learn more about data privacy/i, 'Should not show privacy link in JSON output');
    });

    it('confirms trimmed SBOM is saved before network request when --saveTrimmedSbom is used', async () => {
      const trimmedSbomPath = path.join(simpleDir, `${filenamePrefix}.sbom-trimmed.json`);
      const cmd = `scan:eol --dir ${simpleDir} --saveTrimmedSbom`;
      const { stdout } = await run(cmd);

      match(stdout, /Trimmed SBOM saved to/i, 'Should confirm trimmed SBOM was saved');
      match(stdout, /herodevs\.sbom-trimmed\.json/i, 'Should show correct filename');

      const trimmedSbomExists = existsSync(trimmedSbomPath);
      strictEqual(trimmedSbomExists, true, 'Trimmed SBOM file should exist');

      unlinkSync(trimmedSbomPath);
    });
  });

  describe('with directory flag', () => {
    it('scans a directory for EOL components', async () => {
      const cmd = `scan:eol --dir ${simpleDir}`;
      const { stdout } = await run(cmd);
      match(stdout, /Scan results:/, 'Should show results header');
      match(stdout, /total packages scanned/, 'Should show total packages scanned');
    });

    it('displays web report URL when scanning directory', async () => {
      const cmd = `scan:eol --dir ${simpleDir}`;
      const { stdout } = await run(cmd);
      match(stdout, /View your full EOL report at.*test-123/, 'Should show web report with scan ID');
    });

    it('outputs JSON when using the --json flag', async () => {
      const cmd = `scan:eol --dir ${simpleDir} --json`;
      const { stdout } = await run(cmd);
      doesNotMatch(stdout, /Generating SBOM/, 'Should not show progress messages');
      doesNotMatch(stdout, /Scan results:/, 'Should not show results header');
      const json = JSON.parse(stdout);
      if (json.bomFormat) {
        strictEqual(json.bomFormat, 'CycloneDX', 'Should be CycloneDX format');
        strictEqual(Array.isArray(json.components), true, 'Should have components array');
      } else {
        strictEqual(Array.isArray(json.components), true, 'Should have components array');
      }
      const hasBootstrap = json.components.some(
        (c: { purl?: string }) => typeof c.purl === 'string' && c.purl.includes('pkg:npm/bootstrap@'),
      );
      strictEqual(hasBootstrap, true, 'Should detect bootstrap package from package.json');
    });
  });

  describe('negative paths', () => {
    async function runExpectFail(cmd: string) {
      const output = await runCommand(cmd);
      notStrictEqual(output.error, undefined, 'Command should fail');
      // Some runners set process.exitCode on failures; ensure it doesn't leak and trip the file-level status
      process.exitCode = 0;
      return output;
    }

    function combinedOutputText(output: { stdout: string; stderr: string; error?: { message?: unknown } }) {
      const errorText = typeof output?.error?.message === 'string' ? output.error.message : '';
      return `${output.stderr}\n${output.stdout}\n${errorText}`;
    }

    it('fails when SBOM file does not exist', async () => {
      const missing = path.join(fixturesDir, 'npm', 'does-not-exist.json');
      const out = await runExpectFail(`scan:eol --file ${missing}`);
      match(
        combinedOutputText(out),
        /(SBOM file not found:|Failed to read SBOM file|Failed to load SBOM file|Loading SBOM file)/i,
        'Should indicate missing SBOM file',
      );
    });

    it('fails when SBOM file is invalid JSON', async () => {
      const badFile = path.join(fixturesDir, 'npm', 'invalid.json');
      writeFileSync(badFile, '{not-json');
      try {
        const out = await runExpectFail(`scan:eol --file ${badFile}`);
        match(
          combinedOutputText(out),
          /(Failed to read SBOM file|Failed to load SBOM file|Loading SBOM file)/i,
          'Should indicate invalid SBOM',
        );
      } finally {
        unlinkSync(badFile);
      }
    });

    it('fails when SBOM file is neither SPDX nor CycloneDX format', async () => {
      const badFile = path.join(fixturesDir, 'npm', 'invalid-format.json');
      writeFileSync(badFile, JSON.stringify({ invalid: 'format', notSpdx: true, notCdx: true }));
      try {
        const out = await runExpectFail(`scan:eol --file ${badFile}`);
        match(
          combinedOutputText(out),
          /(Failed to read SBOM file|Invalid SBOM file format|Expected SPDX 2\.3 or CycloneDX format\.)/i,
          'Should indicate invalid SBOM format',
        );
      } finally {
        unlinkSync(badFile);
      }
    });

    it('fails when directory does not exist', async () => {
      const missingDir = path.join(fixturesDir, 'npm', 'no-such-dir');
      const out = await runExpectFail(`scan:eol --dir ${missingDir}`);
      match(
        combinedOutputText(out),
        /(Directory not found:|Failed to scan directory|Generating SBOM)/i,
        'Should indicate missing directory',
      );
    });

    it('fails when provided path is not a directory', async () => {
      const out = await runExpectFail(`scan:eol --dir ${simpleSbom}`);
      match(
        combinedOutputText(out),
        /(Path is not a directory:|Failed to scan directory|Generating SBOM)/i,
        'Should indicate non-directory path',
      );
    });

    it('fails when NES returns unsuccessful result', async () => {
      // Override fetch mock to return unsuccessful mutation for this test
      fetchMock.restore();
      fetchMock = new FetchMock()
        .addGraphQL(mockUserSetupStatus())
        .addGraphQL({ eol: { createReport: { success: false, id: null, totalRecords: 0 } } });
      const out = await runExpectFail(`scan:eol --file ${simpleSbom}`);
      match(
        combinedOutputText(out),
        /(Failed to submit scan to NES|Scanning failed)/i,
        'Should indicate NES submission failure',
      );
    });

    it('fails when NES returns GraphQL errors', async () => {
      fetchMock.restore();
      fetchMock = new FetchMock()
        .addGraphQL(mockUserSetupStatus())
        .addGraphQL({ eol: { createReport: null } }, [
          { message: 'Internal server error', path: ['eol', 'createReport'] },
        ]);
      const out = await runExpectFail(`scan:eol --file ${simpleSbom}`);
      match(
        combinedOutputText(out),
        /(Failed to submit scan to NES|Scanning failed)/i,
        'Should indicate GraphQL errors from NES',
      );
    });

    it('shows a helpful error when report output directory is invalid', async () => {
      const invalidPath = path.join(fixturesDir, 'missing-dir', 'custom-report.json');
      const out = await runExpectFail(`scan:eol --dir ${simpleDir} --save --output ${invalidPath}`);
      match(
        combinedOutputText(out),
        /Unable to save custom-report\.json/i,
        'Should indicate report could not be saved',
      );
    });

    it('shows a helpful error when SBOM output directory is invalid', async () => {
      const invalidPath = path.join(fixturesDir, 'missing-dir', 'custom-sbom.json');
      const out = await runExpectFail(`scan:eol --dir ${simpleDir} --saveSbom --sbomOutput ${invalidPath}`);
      match(combinedOutputText(out), /Unable to save custom-sbom\.json/i, 'Should indicate SBOM could not be saved');
    });
  });
});
