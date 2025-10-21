import assert from 'node:assert';
import fs from 'node:fs';
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, describe, it } from 'node:test';
import type { CdxBom, EolReport, SPDX23 } from '@herodevs/eol-shared';
import {
  readSbomFromFile,
  saveReportToFile,
  saveSbomToFile,
  saveTrimmedSbomToFile,
  validateDirectory,
} from '../../src/service/file.svc.ts';

describe('file.svc', () => {
  let tempDir: string;

  const mockSbom: CdxBom = {
    bomFormat: 'CycloneDX',
    specVersion: '1.6',
    version: 1,
    components: [],
  } as unknown as CdxBom;

  const mockSpdxSbom: SPDX23 = {
    spdxVersion: 'SPDX-2.3',
    dataLicense: 'CC0-1.0',
    SPDXID: 'SPDXRef-DOCUMENT',
    name: 'test-sbom',
    documentNamespace: 'https://example.com/test',
    creationInfo: {
      created: '2024-01-01T00:00:00Z',
      creators: ['Tool: test'],
    },
    packages: [],
  };

  const mockReport: EolReport = {
    id: 'test-id',
    createdOn: new Date().toISOString(),
    components: [],
    metadata: {
      totalComponentsCount: 0,
      unknownComponentsCount: 0,
    },
  };

  after(() => {
    if (tempDir && fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('readSbomFromFile', () => {
    it('should read and parse a valid CycloneDX SBOM file', async () => {
      tempDir = await mkdtemp(join(tmpdir(), 'file-svc-test-'));
      const filePath = join(tempDir, 'test.json');
      await writeFile(filePath, JSON.stringify(mockSbom));

      const result = readSbomFromFile(filePath);
      assert.deepStrictEqual(result, mockSbom);
    });

    it('should read and convert a valid SPDX SBOM file to CycloneDX', async () => {
      tempDir = await mkdtemp(join(tmpdir(), 'file-svc-test-'));
      const filePath = join(tempDir, 'spdx-test.json');
      await writeFile(filePath, JSON.stringify(mockSpdxSbom));

      const result = readSbomFromFile(filePath);

      assert.strictEqual(result.bomFormat, 'CycloneDX');
      assert.ok(result.specVersion);
      assert.ok(Array.isArray(result.components));
    });

    it('should throw error for non-existent file', () => {
      assert.throws(() => readSbomFromFile('/non/existent/path'), /SBOM file not found/);
    });

    it('should throw error for invalid JSON', async () => {
      tempDir = await mkdtemp(join(tmpdir(), 'file-svc-test-'));
      const filePath = join(tempDir, 'invalid.json');
      await writeFile(filePath, 'invalid json');

      assert.throws(() => readSbomFromFile(filePath), /Failed to read SBOM file/);
    });

    it('should throw error for invalid SBOM format (neither SPDX nor CycloneDX)', async () => {
      tempDir = await mkdtemp(join(tmpdir(), 'file-svc-test-'));
      const filePath = join(tempDir, 'invalid-format.json');
      await writeFile(filePath, JSON.stringify({ invalid: 'format' }));

      assert.throws(
        () => readSbomFromFile(filePath),
        /Invalid SBOM file format\. Expected SPDX 2\.3 or CycloneDX format/,
      );
    });
  });

  describe('validateDirectory', () => {
    it('should not throw for valid directory', async () => {
      tempDir = await mkdtemp(join(tmpdir(), 'file-svc-test-'));
      assert.doesNotThrow(() => validateDirectory(tempDir));
    });

    it('should throw error for non-existent directory', () => {
      assert.throws(() => validateDirectory('/non/existent/directory'), /Directory not found/);
    });

    it('should throw error for file instead of directory', async () => {
      tempDir = await mkdtemp(join(tmpdir(), 'file-svc-test-'));
      const filePath = join(tempDir, 'file.txt');
      await writeFile(filePath, 'content');

      assert.throws(() => validateDirectory(filePath), /Path is not a directory/);
    });
  });

  describe('saveSbomToFile', () => {
    it('should save SBOM to file successfully', async () => {
      tempDir = await mkdtemp(join(tmpdir(), 'file-svc-test-'));

      const outputPath = saveSbomToFile(tempDir, mockSbom);

      assert.ok(fs.existsSync(outputPath));
      const content = fs.readFileSync(outputPath, 'utf8');
      const parsed = JSON.parse(content);
      assert.deepStrictEqual(parsed, mockSbom);
    });

    it('should return the correct output path', async () => {
      tempDir = await mkdtemp(join(tmpdir(), 'file-svc-test-'));

      const outputPath = saveSbomToFile(tempDir, mockSbom);

      assert.ok(outputPath.endsWith('herodevs.sbom.json'));
      assert.ok(outputPath.includes(tempDir));
    });

    it('should save SBOM to a custom path', async () => {
      tempDir = await mkdtemp(join(tmpdir(), 'file-svc-test-'));
      const customDir = join(tempDir, 'nested');
      await mkdir(customDir);

      const customPath = join(customDir, 'custom-sbom.json');
      const outputPath = saveSbomToFile(tempDir, mockSbom, customPath);

      assert.strictEqual(outputPath, customPath);
      assert.ok(fs.existsSync(customPath));
    });

    it('should throw a descriptive error when the custom directory is missing', async () => {
      tempDir = await mkdtemp(join(tmpdir(), 'file-svc-test-'));
      const missingPath = join(tempDir, 'missing', 'custom-sbom.json');

      assert.throws(() => saveSbomToFile(tempDir, mockSbom, missingPath), /Unable to save custom-sbom\.json/);
    });
  });

  describe('saveTrimmedSbomToFile', () => {
    it('should save trimmed SBOM to file successfully', async () => {
      tempDir = await mkdtemp(join(tmpdir(), 'file-svc-test-'));

      const outputPath = saveTrimmedSbomToFile(tempDir, mockSbom);

      assert.ok(fs.existsSync(outputPath));
      const content = fs.readFileSync(outputPath, 'utf8');
      const parsed = JSON.parse(content);
      assert.deepStrictEqual(parsed, mockSbom);
    });

    it('should return the correct output path', async () => {
      tempDir = await mkdtemp(join(tmpdir(), 'file-svc-test-'));

      const outputPath = saveTrimmedSbomToFile(tempDir, mockSbom);

      assert.ok(outputPath.endsWith('herodevs.sbom-trimmed.json'));
      assert.ok(outputPath.includes(tempDir));
    });
  });

  describe('saveReportToFile', () => {
    it('should save report to file successfully', async () => {
      tempDir = await mkdtemp(join(tmpdir(), 'file-svc-test-'));

      const outputPath = saveReportToFile(tempDir, mockReport);

      assert.ok(fs.existsSync(outputPath));
      const content = fs.readFileSync(outputPath, 'utf8');
      const parsed = JSON.parse(content);
      assert.deepStrictEqual(parsed, mockReport);
    });

    it('should return the correct output path', async () => {
      tempDir = await mkdtemp(join(tmpdir(), 'file-svc-test-'));

      const outputPath = saveReportToFile(tempDir, mockReport);

      assert.ok(outputPath.endsWith('herodevs.report.json'));
      assert.ok(outputPath.includes(tempDir));
    });

    it('should save report to a custom path', async () => {
      tempDir = await mkdtemp(join(tmpdir(), 'file-svc-test-'));
      const customDir = join(tempDir, 'nested');
      await mkdir(customDir);

      const customPath = join(customDir, 'my-report.json');
      const outputPath = saveReportToFile(tempDir, mockReport, customPath);

      assert.strictEqual(outputPath, customPath);
      assert.ok(fs.existsSync(customPath));
    });

    it('should throw a descriptive error when the custom directory is missing', async () => {
      tempDir = await mkdtemp(join(tmpdir(), 'file-svc-test-'));
      const missingPath = join(tempDir, 'missing', 'my-report.json');

      assert.throws(() => saveReportToFile(tempDir, mockReport, missingPath), /Unable to save my-report\.json/);
    });
  });
});
