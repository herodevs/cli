import assert from 'node:assert';
import fs from 'node:fs';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, describe, it } from 'node:test';
import type { CdxBom, EolReport } from '@herodevs/eol-shared';
import { readSbomFromFile, saveReportToFile, saveSbomToFile, validateDirectory } from '../../src/service/file.svc.ts';

describe('file.svc', () => {
  let tempDir: string;

  const mockSbom: CdxBom = {
    bomFormat: 'CycloneDX',
    specVersion: '1.6',
    version: 1,
    components: [],
  } as unknown as CdxBom;

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
    it('should read and parse a valid SBOM file', async () => {
      tempDir = await mkdtemp(join(tmpdir(), 'file-svc-test-'));
      const filePath = join(tempDir, 'test.json');
      await writeFile(filePath, JSON.stringify(mockSbom));

      const result = readSbomFromFile(filePath);
      assert.deepStrictEqual(result, mockSbom);
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
  });
});
