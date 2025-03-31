import { strictEqual } from 'node:assert';
import fs from 'node:fs/promises';
import path from 'node:path';
import { afterEach, beforeEach, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { runCommand } from '@oclif/test';

describe('scan:eol e2e', () => {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const testDir = path.resolve(__dirname, '../fixtures/npm/simple');
  const reportPath = path.join(testDir, 'nes.eol.json');

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

    strictEqual(stdout.includes('Here are the results of the scan:'), true, 'Should show results header');

    // Since we know bootstrap@3.1.1 is EOL, verify it's detected
    strictEqual(stdout.includes('pkg:npm/bootstrap@3.1.1'), true, 'Should detect bootstrap package');
    strictEqual(stdout.includes('End of Life (EOL)'), true, 'Should show EOL status');
  });

  it('saves report when --save flag is used', async () => {
    const cmd = `scan:eol --dir ${testDir} --save`;
    const output = await runCommand(cmd);

    // Log any errors for debugging
    if (output.error) {
      console.error('Command failed with error:', output.error);
      console.error('Error details:', output.stderr);
    }

    console.log('output', output.stdout);
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

    // Verify structure
    strictEqual(Array.isArray(report.components), true, 'Report should contain components array');

    // Verify content (we know bootstrap@3.1.1 should be EOL)
    const bootstrap = report.components.find((c) => c.purl === 'pkg:npm/bootstrap@3.1.1');
    strictEqual(bootstrap !== undefined, true, 'Report should contain bootstrap package');
    strictEqual(bootstrap?.info?.isEol, true, 'Bootstrap should be marked as EOL');
  });
});
