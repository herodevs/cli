import fs from 'node:fs';
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { CdxBom, EolReport, SPDX23 } from '@herodevs/eol-shared';
import { readSbomFromFile, saveArtifactToFile, validateDirectory } from '../../src/service/file.svc.ts';

describe('file.svc', () => {
  let tempDir: string;

  const createTempDir = () => {
    const prefix = join(tmpdir(), 'file-svc-test-');

    if (typeof fs.mkdtempDisposableSync === 'function') {
      const { path: dirPath } = fs.mkdtempDisposableSync(prefix);
      return dirPath;
    }

    return fs.mkdtempSync(prefix);
  };

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
      totalUniqueComponentsCount: 0,
    },
    page: 1,
    totalRecords: 0,
  };

  afterAll(() => {
    if (tempDir && fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('readSbomFromFile', () => {
    it('should read and parse a valid CycloneDX SBOM file', async () => {
      tempDir = createTempDir();
      const filePath = join(tempDir, 'test.json');
      await writeFile(filePath, JSON.stringify(mockSbom));

      const result = readSbomFromFile(filePath);
      expect(result).toEqual(mockSbom);
    });

    it('should read and convert a valid SPDX SBOM file to CycloneDX', async () => {
      tempDir = createTempDir();
      const filePath = join(tempDir, 'spdx-test.json');
      await writeFile(filePath, JSON.stringify(mockSpdxSbom));

      const result = readSbomFromFile(filePath);

      expect(result.bomFormat).toBe('CycloneDX');
      expect(result.specVersion).toBeTruthy();
      expect(Array.isArray(result.components)).toBe(true);
    });

    it('should throw error for non-existent file', () => {
      expect(() => readSbomFromFile('/non/existent/path')).toThrow(/SBOM file not found/);
    });

    it('should throw error for invalid JSON', async () => {
      tempDir = createTempDir();
      const filePath = join(tempDir, 'invalid.json');
      await writeFile(filePath, 'invalid json');

      expect(() => readSbomFromFile(filePath)).toThrow(/Failed to read SBOM file/);
    });

    it('should throw error for invalid SBOM format (neither SPDX nor CycloneDX)', async () => {
      tempDir = createTempDir();
      const filePath = join(tempDir, 'invalid-format.json');
      await writeFile(filePath, JSON.stringify({ invalid: 'format' }));

      expect(() => readSbomFromFile(filePath)).toThrow(
        /Invalid SBOM file format\. Expected SPDX 2\.3 or CycloneDX format/,
      );
    });
  });

  describe('validateDirectory', () => {
    it('should not throw for valid directory', async () => {
      tempDir = await mkdtemp(join(tmpdir(), 'file-svc-test-'));
      expect(() => validateDirectory(tempDir)).not.toThrow();
    });

    it('should throw error for non-existent directory', () => {
      expect(() => validateDirectory('/non/existent/directory')).toThrow(/Directory not found/);
    });

    it('should throw error for file instead of directory', async () => {
      tempDir = createTempDir();
      const filePath = join(tempDir, 'file.txt');
      await writeFile(filePath, 'content');

      expect(() => validateDirectory(filePath)).toThrow(/Path is not a directory/);
    });
  });

  describe('saveArtifactToFile', () => {
    it('should save SBOM to file successfully', async () => {
      tempDir = createTempDir();

      const outputPath = saveArtifactToFile(tempDir, { kind: 'sbom', payload: mockSbom });

      expect(fs.existsSync(outputPath)).toBe(true);
      const content = fs.readFileSync(outputPath, 'utf8');
      const parsed = JSON.parse(content);
      expect(parsed).toEqual(mockSbom);
    });

    it('should return the correct SBOM output path', async () => {
      tempDir = createTempDir();

      const outputPath = saveArtifactToFile(tempDir, { kind: 'sbom', payload: mockSbom });

      expect(outputPath.endsWith('herodevs.sbom.json')).toBe(true);
      expect(outputPath.includes(tempDir)).toBe(true);
    });

    it('should save SBOM to a custom path', async () => {
      tempDir = createTempDir();
      const customDir = join(tempDir, 'nested');
      await mkdir(customDir);

      const customPath = join(customDir, 'custom-sbom.json');
      const outputPath = saveArtifactToFile(tempDir, {
        kind: 'sbom',
        payload: mockSbom,
        outputPath: customPath,
      });

      assert.strictEqual(outputPath, customPath);
      assert.ok(fs.existsSync(customPath));
    });

    it('should throw a descriptive error when the custom directory is missing for SBOM', async () => {
      tempDir = createTempDir();
      const missingPath = join(tempDir, 'missing', 'custom-sbom.json');

      assert.throws(
        () => saveArtifactToFile(tempDir, { kind: 'sbom', payload: mockSbom, outputPath: missingPath }),
        /Unable to save custom-sbom\.json/,
      );
    });

    it('should default to SBOM filename when directory path is provided', async () => {
      tempDir = createTempDir();
      const customDir = join(tempDir, 'nested');
      await mkdir(customDir);

      const outputPath = saveArtifactToFile(tempDir, {
        kind: 'sbom',
        payload: mockSbom,
        outputPath: customDir,
      });

      const expectedPath = join(customDir, 'herodevs.sbom.json');
      assert.strictEqual(outputPath, expectedPath);
      assert.ok(fs.existsSync(expectedPath));
    });

    it('should save trimmed SBOM to file successfully', async () => {
      tempDir = createTempDir();

      const outputPath = saveArtifactToFile(tempDir, { kind: 'sbomTrimmed', payload: mockSbom });

      expect(fs.existsSync(outputPath)).toBe(true);
      const content = fs.readFileSync(outputPath, 'utf8');
      const parsed = JSON.parse(content);
      expect(parsed).toEqual(mockSbom);
    });

    it('should return the correct trimmed SBOM output path', async () => {
      tempDir = createTempDir();

      const outputPath = saveArtifactToFile(tempDir, { kind: 'sbomTrimmed', payload: mockSbom });

      expect(outputPath.endsWith('herodevs.sbom-trimmed.json')).toBe(true);
      expect(outputPath.includes(tempDir)).toBe(true);
    });

    it('should save report to file successfully', async () => {
      tempDir = createTempDir();

      const outputPath = saveArtifactToFile(tempDir, { kind: 'report', payload: mockReport });

      expect(fs.existsSync(outputPath)).toBe(true);
      const content = fs.readFileSync(outputPath, 'utf8');
      const parsed = JSON.parse(content);
      expect(parsed).toEqual(mockReport);
    });

    it('should return the correct report output path', async () => {
      tempDir = createTempDir();

      const outputPath = saveArtifactToFile(tempDir, { kind: 'report', payload: mockReport });

      expect(outputPath.endsWith('herodevs.report.json')).toBe(true);
      expect(outputPath.includes(tempDir)).toBe(true);
    });

    it('should save report to a custom path', async () => {
      tempDir = createTempDir();
      const customDir = join(tempDir, 'nested');
      await mkdir(customDir);

      const customPath = join(customDir, 'my-report.json');
      const outputPath = saveArtifactToFile(tempDir, {
        kind: 'report',
        payload: mockReport,
        outputPath: customPath,
      });

      assert.strictEqual(outputPath, customPath);
      assert.ok(fs.existsSync(customPath));
    });

    it('should throw a descriptive error when the custom directory is missing for report', async () => {
      tempDir = createTempDir();
      const missingPath = join(tempDir, 'missing', 'my-report.json');

      assert.throws(
        () => saveArtifactToFile(tempDir, { kind: 'report', payload: mockReport, outputPath: missingPath }),
        /Unable to save my-report\.json/,
      );
    });

    it('should default to report filename when directory path is provided', async () => {
      tempDir = createTempDir();
      const customDir = join(tempDir, 'reports');
      await mkdir(customDir);

      const outputPath = saveArtifactToFile(tempDir, {
        kind: 'report',
        payload: mockReport,
        outputPath: customDir,
      });

      const expectedPath = join(customDir, 'herodevs.report.json');
      assert.strictEqual(outputPath, expectedPath);
      assert.ok(fs.existsSync(expectedPath));
    });
  });
});
