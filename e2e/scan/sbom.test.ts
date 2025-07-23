import { doesNotThrow } from 'node:assert';
import { doesNotMatch, strictEqual } from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { describe, it } from 'node:test';
import { runCommand } from '@oclif/test';

describe('scan:sbom e2e', () => {
  const fixturesDir = path.resolve(import.meta.dirname, '../fixtures');
  const simpleDir = path.resolve(fixturesDir, 'npm/simple');

  async function run(cmd: string) {
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

  describe('SBOM generation and attribution', () => {
    it('generates SBOM with correct HeroDevs attribution', async () => {
      const cmd = `scan:sbom --dir ${simpleDir} --json`;
      const { stdout } = await run(cmd);

      // Verify JSON output is valid
      doesNotThrow(() => JSON.parse(stdout), 'Output should be valid JSON');

      const sbom = JSON.parse(stdout);

      // Verify SBOM structure
      strictEqual(sbom.bomFormat, 'CycloneDX', 'Should be CycloneDX format');
      strictEqual(Array.isArray(sbom.components), true, 'Should have components array');

      // Verify author attribution
      strictEqual(Array.isArray(sbom.metadata?.authors), true, 'Should have authors array');
      strictEqual(sbom.metadata.authors.length, 1, 'Should have exactly one author');
      strictEqual(sbom.metadata.authors[0].name, 'HeroDevs, Inc.', 'Should have correct author name');

      // Verify tools attribution (in CycloneDX, tools is an object with components array)
      strictEqual(typeof sbom.metadata?.tools, 'object', 'Should have tools object');
      strictEqual(Array.isArray(sbom.metadata.tools?.components), true, 'Should have tools components array');
      strictEqual(sbom.metadata.tools.components.length > 0, true, 'Should have at least one tool');

      // Find our CLI tool in the tools components
      const cliTool = sbom.metadata.tools.components.find((tool: { name?: string }) => tool.name === '@herodevs/cli');

      strictEqual(cliTool !== undefined, true, 'Should find @herodevs/cli tool');
      strictEqual(cliTool.publisher, 'HeroDevs, Inc.', 'Should have correct tool publisher');

      // Verify version is present (don't check exact value as it may vary)
      strictEqual(typeof cliTool.version, 'string', 'Should have tool version as string');
      strictEqual(cliTool.version.length > 0, true, 'Should have non-empty tool version');
    });

    it('outputs valid CycloneDX SBOM format', async () => {
      const cmd = `scan:sbom --dir ${simpleDir} --json`;
      const { stdout } = await run(cmd);

      const sbom = JSON.parse(stdout);

      // Verify SBOM format and spec version
      strictEqual(sbom.bomFormat, 'CycloneDX', 'Should be CycloneDX format');
      strictEqual(sbom.specVersion, '1.6', 'Should use CycloneDX spec version 1.6');

      // Verify metadata structure
      strictEqual(typeof sbom.metadata, 'object', 'Should have metadata object');
      strictEqual(typeof sbom.serialNumber, 'string', 'Should have serial number');

      // Verify components are detected
      strictEqual(Array.isArray(sbom.components), true, 'Should have components array');
      strictEqual(sbom.components.length > 0, true, 'Should detect at least one component');
    });

    it('does not show progress output when using --json flag', async () => {
      const cmd = `scan:sbom --dir ${simpleDir} --json`;
      const { stdout } = await run(cmd);

      // Should not contain progress indicators or non-JSON output
      doesNotMatch(stdout, /Generating SBOM/, 'Should not show progress messages');
      doesNotMatch(stdout, /Scan results:/, 'Should not show results header');

      // Verify output is pure JSON
      doesNotThrow(() => JSON.parse(stdout), 'Output should be valid JSON');
    });

    it('detects npm packages in simple fixture', async () => {
      const cmd = `scan:sbom --dir ${simpleDir} --json`;
      const { stdout } = await run(cmd);

      const sbom = JSON.parse(stdout);

      // Verify components are detected
      strictEqual(Array.isArray(sbom.components), true, 'Should have components array');
      strictEqual(sbom.components.length > 0, true, 'Should detect components');

      // Look for bootstrap package that should be in the simple fixture
      const hasBootstrap = sbom.components.some((component: { purl?: string }) =>
        component.purl?.includes('pkg:npm/bootstrap@'),
      );
      strictEqual(hasBootstrap, true, 'Should detect bootstrap package from package.json');
    });
  });
});
