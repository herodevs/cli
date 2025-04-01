import { match, strictEqual } from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { afterEach, beforeEach, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { runCommand } from '@oclif/test';

describe('scan:eol e2e', () => {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const testDir = path.resolve(__dirname, '../fixtures/npm/simple');
  const reportPath = path.join(testDir, 'nes.eol.json');
  const extraLargePurlsPath = path.resolve(__dirname, '../fixtures/purls/extra-large.purls.json');

  async function cleanupReport() {
    try {
      await fs.unlink(reportPath);
    } catch {
      // Ignore if file doesn't exist
    }
  }

  beforeEach(async () => {
    // Skip tests if no backend URL is provided
    if (!process.env.E2E_BACKEND_URL) {
      console.log('Skipping E2E tests: No backend URL provided');
      return;
    }

    // Set up environment
    process.env.GRAPHQL_HOST = process.env.E2E_BACKEND_URL;

    // Ensure test directory exists and is clean
    await fs.mkdir(testDir, { recursive: true });
    await cleanupReport();
  });

  afterEach(cleanupReport);

  it('scans a directory for EOL components', async () => {
    const cmd = `scan:eol --dir ${testDir}`;
    const output = await runCommand(cmd);

    // Log any errors for debugging
    if (output.error) {
      console.error('Command failed with error:', output.error);
      console.error('Error details:', output.stderr);
    }

    // Verify command executed successfully
    strictEqual(output.error, undefined, 'Command should execute without errors');

    // Verify output contains expected content
    const stdout = output.stdout;

    // Match command output patterns
    match(stdout, /Here are the results of the scan:/, 'Should show results header');
    match(stdout, /pkg:npm\/bootstrap@3\.1\.1/, 'Should detect bootstrap package');
    match(stdout, /End of Life \(EOL\)/, 'Should show EOL status');
    match(stdout, /EOL Date:/, 'Should show EOL date information');
  });

  it('saves report when --save flag is used', async () => {
    const cmd = `scan:eol --dir ${testDir} --save`;
    const output = await runCommand(cmd);

    // Log any errors for debugging
    if (output.error) {
      console.error('Command failed with error:', output.error);
      console.error('Error details:', output.stderr);
    }

    // Verify command executed successfully
    strictEqual(output.error, undefined, 'Command should execute without errors');

    // Verify report was saved
    const reportExists = await fs
      .access(reportPath)
      .then(() => true)
      .catch(() => false);

    strictEqual(reportExists, true, 'Report file should be created');

    // Verify report content
    const reportContent = await fs.readFile(reportPath, 'utf-8');
    const report = JSON.parse(reportContent);

    // Verify report structure using match
    match(JSON.stringify(report), /"components":\s*\[/, 'Report should contain components array');
    match(JSON.stringify(report), /"purl":\s*"pkg:npm\/bootstrap@3\.1\.1"/, 'Report should contain bootstrap package');
    match(JSON.stringify(report), /"isEol":\s*true/, 'Bootstrap should be marked as EOL');
  });

  it('scans extra-large.purls.json for EOL components', async () => {
    const cmd = `scan:eol --purls ${extraLargePurlsPath}`;
    const output = await runCommand(cmd);

    // Log any errors for debugging
    if (output.error) {
      console.error('Command failed with error:', output.error);
      console.error('Error details:', output.stderr);
    }

    // Verify command executed successfully
    strictEqual(output.error, undefined, 'Command should execute without errors');

    // Verify output contains expected content
    const stdout = output.stdout;

    // Match command output patterns
    match(stdout, /Scan completed/, 'Should show scan completion message');
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
    match(stdout, /⚡= Long Term Support \(LTS\)/, 'Should show legend for LTS status');
    match(stdout, /✗ = End of Life \(EOL\)/, 'Should show legend for EOL status');
  });
});
