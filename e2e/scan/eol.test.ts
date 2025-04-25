import { doesNotThrow } from 'node:assert';
import { doesNotMatch, match, strictEqual } from 'node:assert/strict';
import { exec } from 'node:child_process';
import { existsSync, readFileSync, unlinkSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { runCommand } from '@oclif/test';

const execAsync = promisify(exec);

const GRAPHQL_HOST = 'https://api.dev.nes.herodevs.com';

describe('scan:eol e2e', () => {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const fixturesDir = path.resolve(__dirname, '../fixtures');
  const simplePurls = path.resolve(__dirname, '../fixtures/npm/simple.purls.json');
  const simpleSbom = path.join(fixturesDir, 'npm/eol.sbom.json');
  const reportPath = path.resolve(fixturesDir, 'eol.report.json');
  const upToDatePurls = path.resolve(__dirname, '../fixtures/npm/up-to-date.purls.json');
  const extraLargePurlsPath = path.resolve(__dirname, '../fixtures/npm/extra-large.purls.json');
  const emptyPurlsPath = path.resolve(__dirname, '../fixtures/npm/empty.purls.json');
  const angular17Purls = path.resolve(__dirname, '../fixtures/npm/angular-17.purls.json');

  async function run(cmd: string) {
    // Set up environment
    process.env.GRAPHQL_HOST = GRAPHQL_HOST;

    // Ensure fixtures directory exists and is clean
    await mkdir(fixturesDir, { recursive: true });

    const output = await runCommand(cmd);

    // Log any errors for debugging
    if (output.error) {
      console.error('Command failed with error:', output.error);
      console.error('Error details:', output.stderr);
    }

    // Verify command executed successfully
    strictEqual(output.error, undefined, 'Command should execute without errors');

    return output;
  }

  it('defaults to scan:eol -t when no arguments are provided', async () => {
    // Run the CLI directly with no arguments
    const { stdout } = await execAsync('node bin/run.js', {
      env: { ...process.env, GRAPHQL_HOST },
    });

    // Match table header
    match(stdout, /┌.*┬.*┬.*┬.*┬.*┐/, 'Should show table top border');
    match(stdout, /│ NAME\s*│ VERSION\s*│ EOL\s*│ DAYS EOL\s*│ TYPE\s*│ # OF VULNS*|/, 'Should show table headers');
    match(stdout, /├.*┼.*┼.*┼.*┼.*┤/, 'Should show table header separator');

    // Match table content
    match(
      stdout,
      /│ bootstrap\s*│ 3\.1\.1\s*│ 2019-07-24\s*│ \d+\s*│ npm\s*│/,
      'Should show bootstrap package in table',
    );

    // Match table footer
    match(stdout, /└.*┴.*┴.*┴.*┴.*┘/, 'Should show table bottom border');
  });

  it('scans existing SBOM for EOL components', async () => {
    const cmd = `scan:eol --file ${simpleSbom}`;
    const { stdout } = await run(cmd);

    // Match command output patterns
    match(stdout, /Here are the results of the scan:/, 'Should show results header');
    match(stdout, /pkg:npm\/bootstrap@3\.1\.1/, 'Should detect bootstrap package');
    match(stdout, /EOL Date: 2019-07-24/, 'Should show correct EOL date for bootstrap');
  });

  it('saves report when --save flag is used', async () => {
    const cmd = `scan:eol --purls=${simplePurls} --dir=${fixturesDir} --save`;
    await run(cmd);

    // Verify report was saved
    const reportExists = existsSync(reportPath);

    strictEqual(reportExists, true, 'Report file should be created');

    // Verify report content
    const report = readFileSync(reportPath, 'utf-8');

    // Verify report structure using match
    match(report, /"components":\s*\[/, 'Report should contain components array');
    match(report, /"purl":\s*"pkg:npm\/bootstrap@3\.1\.1"/, 'Report should contain bootstrap package');
    match(report, /"isEol":\s*true/, 'Bootstrap should be marked as EOL');

    unlinkSync(reportPath);
  });

  it('scans extra-large.purls.json for EOL components', async () => {
    const cmd = `scan:eol --purls ${extraLargePurlsPath}`;
    const { stdout } = await run(cmd);

    // Match command output patterns
    match(stdout, /Here are the results of the scan:/, 'Should show results header');

    // Match specific EOL packages
    match(stdout, /pkg:npm\/%40angular\/core@12\.2\.2/, 'Should detect Angular core package');
    match(stdout, /EOL Date: 2022-11-12/, 'Should show correct EOL date for Angular core');
    match(stdout, /pkg:npm\/bootstrap@3\.4\.1/, 'Should detect Bootstrap 3.4.1');
    match(stdout, /EOL Date: 2019-07-24/, 'Should show correct EOL date for Bootstrap 3.4.1');
    match(stdout, /pkg:npm\/bootstrap@4\.6\.2/, 'Should detect Bootstrap 4.6.2');
    match(stdout, /EOL Date: 2023-01-01/, 'Should show correct EOL date for Bootstrap 4.6.2');

    // Match legend
    match(stdout, /• = No Known Issues/, 'Should show legend for No Known Issues');
    match(stdout, /✔ = OK/, 'Should show legend for OK status');
    match(stdout, /⚡= Supported: End-of-Life \(EOL\) is scheduled/, 'Should show legend for SUPPORTED status');
    match(stdout, /✗ = End of Life \(EOL\)/, 'Should show legend for EOL status');
  });

  it('outputs JSON when using the --json flag', async () => {
    const cmd = `scan:eol --purls=${simplePurls} --json`;
    const { stdout } = await run(cmd);

    // Match command output patterns
    doesNotMatch(stdout, /Here are the results of the scan:/, 'Should not show results header');
    doesNotThrow(() => JSON.parse(stdout));
  });

  it('displays results in table format when using the -t flag', async () => {
    const cmd = `scan:eol --purls=${simplePurls} -t`;
    const { stdout } = await run(cmd);

    // Match table header
    match(stdout, /┌.*┬.*┬.*┬.*┬.*┐/, 'Should show table top border');
    match(stdout, /│ NAME\s*│ VERSION\s*│ EOL\s*│ DAYS EOL\s*│ TYPE\s*│ # OF VULNS*|/, 'Should show table headers');
    match(stdout, /├.*┼.*┼.*┼.*┼.*┤/, 'Should show table header separator');

    // Match table content
    match(
      stdout,
      /│ bootstrap\s*│ 3\.1\.1\s*│ 2019-07-24\s*│ \d+\s*│ npm\s*│/,
      'Should show bootstrap package in table',
    );

    // Match table footer
    match(stdout, /└.*┴.*┴.*┴.*┴.*┘/, 'Should show table bottom border');
  });

  describe('--all flag', () => {
    it('excludes OK packages by default', async () => {
      const cmd = `scan:eol --purls=${simplePurls}`;
      const { stdout } = await run(cmd);

      // Match command output patterns
      match(stdout, /Here are the results of the scan:/, 'Should show results header');
      doesNotMatch(stdout, /pkg:npm\/vue@3\.5\.13/, 'Should not show vue package');
    });

    it('shows all packages when --all flag is used', async () => {
      const cmd = `scan:eol --purls=${simplePurls} --all`;
      const { stdout } = await run(cmd);

      // Match command output patterns
      match(stdout, /Here are the results of the scan:/, 'Should show results header');
      match(stdout, /pkg:npm\/bootstrap@3\.1\.1/, 'Should detect bootstrap package');
      match(stdout, /pkg:npm\/vue@3\.5\.13/, 'Should show vue package');
    });

    it('shows "No EOL" message by default if no components are found', async () => {
      const cmd = `scan:eol --purls ${upToDatePurls}`;
      const { stdout } = await run(cmd);

      // Match command output patterns
      doesNotMatch(stdout, /Here are the results of the scan:/, 'Should not show results header');
      match(stdout, /No End-of-Life or Supported components found in scan/, 'Should show "No EOL" message');
    });

    it('shows "No components found" message if no components are found with --all flag', async () => {
      const cmd = `scan:eol --purls ${emptyPurlsPath} --all`;
      const { stdout } = await run(cmd);

      // Match command output patterns
      doesNotMatch(stdout, /Here are the results of the scan:/, 'Should not show results header');
      match(stdout, /No components found in scan/, 'Should show "No components found" message');
    });
  });

  it('correctly identifies Angular 17 EOL status', async () => {
    const cmd = `scan:eol --purls=${angular17Purls}`;
    const { stdout } = await run(cmd);

    // Check for Angular package presence
    match(stdout, /pkg:npm\/%40angular\/core@17\.3\.12/, 'Should detect Angular core package');

    // Check for either SUPPORTED or EOL status
    match(stdout, /⚡= Supported: End-of-Life \(EOL\) is scheduled/, 'Should show SUPPORTED status');

    // Check for EOL date format with days remaining
    match(stdout, /EOL Date: \d{4}-\d{2}-\d{2} \(\d+ days from now\)/, 'Should show EOL date with days remaining');

    // Check for the status indicator in the package line
    match(stdout, /⚡ pkg:npm\/%40angular\/core@17\.3\.12/, 'Should show supported status indicator');

    // Check for the arrow format
    match(stdout, /⮑ {2}EOL Date: \d{4}-\d{2}-\d{2}/, 'Should show EOL date with arrow');
  });
});

/**
 * Directory scan tests
 * Please see CONTRIBUTING.md before adding new tests to this section.
 */
describe('scan:eol e2e directory', () => {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const simpleDir = path.resolve(__dirname, '../fixtures/npm/simple');
  const upToDateDir = path.resolve(__dirname, '../fixtures/npm/up-to-date');
  const reportPath = path.join(simpleDir, 'eol.report.json');

  async function run(cmd: string) {
    // Set up environment
    process.env.GRAPHQL_HOST = GRAPHQL_HOST;
    // process.env.GRAPHQL_HOST = 'http://localhost:3000';

    // Ensure test directory exists and is clean
    await mkdir(simpleDir, { recursive: true });

    const output = await runCommand(cmd);

    // Log any errors for debugging
    if (output.error) {
      console.error('Command failed with error:', output.error);
      console.error('Error details:', output.stderr);
    }

    // Verify command executed successfully
    strictEqual(output.error, undefined, 'Command should execute without errors');

    return output;
  }

  it('scans a directory or sbom for EOL components', async () => {
    const cmd = `scan:eol --dir ${simpleDir}`;
    const { stdout } = await run(cmd);

    // Match command output patterns
    match(stdout, /Here are the results of the scan:/, 'Should show results header');
    match(stdout, /pkg:npm\/bootstrap@3\.1\.1/, 'Should detect bootstrap package');
    match(stdout, /End of Life \(EOL\)/, 'Should show EOL status');
    match(stdout, /EOL Date:/, 'Should show EOL date information');
  });

  it('saves report when --save flag is used', async () => {
    const cmd = `scan:eol --dir ${simpleDir} --save`;
    await run(cmd);

    // Verify report was saved
    const reportExists = existsSync(reportPath);

    strictEqual(reportExists, true, 'Report file should be created');

    // Verify report content
    const report = readFileSync(reportPath, 'utf-8');

    // Verify report structure using match
    match(report, /"components":\s*\[/, 'Report should contain components array');
    match(report, /"purl":\s*"pkg:npm\/bootstrap@3\.1\.1"/, 'Report should contain bootstrap package');
    match(report, /"isEol":\s*true/, 'Bootstrap should be marked as EOL');

    unlinkSync(reportPath);
  });
  it('scans existing SBOM for EOL components', async () => {
    const cmd = `scan:eol --file ${simpleDir}/sbom.json`;
    const { stdout } = await run(cmd);

    // Match command output patterns
    match(stdout, /Here are the results of the scan:/, 'Should show results header');
    match(stdout, /pkg:npm\/bootstrap@3\.1\.1/, 'Should detect bootstrap package');
    match(stdout, /EOL Date: 2019-07-24/, 'Should show correct EOL date for bootstrap');
  });

  it('outputs JSON when using the --json flag', async () => {
    const cmd = `scan:eol --dir ${simpleDir} --json`;
    const { stdout } = await run(cmd);

    // Match command output patterns
    doesNotMatch(stdout, /Here are the results of the scan:/, 'Should not show results header');
    doesNotThrow(() => JSON.parse(stdout));
  });

  it('displays results in table format when using the -t flag', async () => {
    const cmd = `scan:eol --dir ${simpleDir} -t`;
    const { stdout } = await run(cmd);

    // Match table header
    match(stdout, /┌.*┬.*┬.*┬.*┬.*┐/, 'Should show table top border');
    match(
      stdout,
      /│ NAME\s*│ VERSION\s*│ EOL\s*│ DAYS EOL\s*│ TYPE\s*│/, // TODO: add vulns to monorepo api
      'Should show table headers',
    );
    match(stdout, /├.*┼.*┼.*┼.*┼.*┤/, 'Should show table header separator');

    // Match table content
    match(
      stdout,
      /│ bootstrap\s*│ 3\.1\.1\s*│ 2019-07-24\s*│ \d+\s*│ npm\s*│/,
      'Should show bootstrap package in table',
    );

    // Match table footer
    match(stdout, /└.*┴.*┴.*┴.*┴.*┘/, 'Should show table bottom border');
  });

  describe('--all flag', () => {
    it('excludes OK packages by default', async () => {
      const cmd = `scan:eol --dir ${simpleDir}`;
      const { stdout } = await run(cmd);

      // Match command output patterns
      match(stdout, /Here are the results of the scan:/, 'Should show results header');
      doesNotMatch(stdout, /pkg:npm\/vue@3\.5\.13/, 'Should not show vue package');
    });

    it('shows all packages when --all flag is used', async () => {
      const cmd = `scan:eol --dir ${simpleDir} --all`;
      const { stdout } = await run(cmd);

      // Match command output patterns
      match(stdout, /Here are the results of the scan:/, 'Should show results header');
      match(stdout, /pkg:npm\/bootstrap@3\.1\.1/, 'Should detect bootstrap package');
      match(stdout, /pkg:npm\/vue@3\.5\.13/, 'Should show vue package');
    });

    it('shows "No EOL" message by default if no components are found', async () => {
      const cmd = `scan:eol --dir ${upToDateDir}`;
      const { stdout } = await run(cmd);

      // Match command output patterns
      doesNotMatch(stdout, /Here are the results of the scan:/, 'Should not show results header');
      match(stdout, /No End-of-Life or Supported components found in scan/, 'Should show "No EOL" message');
    });
  });
});
