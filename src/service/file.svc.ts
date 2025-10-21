import fs from 'node:fs';
import path, { join, resolve } from 'node:path';
import type { CdxBom, EolReport, SPDX23 } from '@herodevs/eol-shared';
import { isCdxBom, isSpdxBom, spdxToCdxBom } from '@herodevs/eol-shared';
import { filenamePrefix } from '../config/constants.ts';
import { getErrorMessage } from './log.svc.ts';

export interface FileError extends Error {
  code?: string;
}

/**
 * Computes an absolute output path using either a provided path or the base directory and default name.
 */
function resolveOutputPath(
  baseDir: string,
  defaultFilename: string,
  customPath?: string,
): { fileName: string; fullPath: string } {
  const output = customPath ? resolve(customPath) : resolve(join(baseDir, defaultFilename));
  return { fileName: path.basename(output), fullPath: output };
}

/**
 * Ensures the directory for a target file path exists and is a directory before writing.
 */
function ensureOutputDirectory(fullPath: string, fileName: string): void {
  const targetDir = path.dirname(fullPath);

  if (!fs.existsSync(targetDir)) {
    throw new Error(`Unable to save ${fileName}`);
  }

  const stats = fs.statSync(targetDir);
  if (!stats.isDirectory()) {
    throw new Error(`Unable to save ${fileName}`);
  }
}

/**
 * Writes JSON to disk after validating directory constraints and formats the payload for readability.
 */
function writeJsonFile(fullPath: string, fileName: string, payload: unknown, failureLabel: string): string {
  ensureOutputDirectory(fullPath, fileName);

  try {
    fs.writeFileSync(fullPath, JSON.stringify(payload, null, 2));
    return fullPath;
  } catch (error) {
    const fileError = error as FileError;

    if (fileError.code === 'EACCES') {
      throw new Error(`Permission denied. Unable to save ${fileName}`);
    }

    if (fileError.code === 'ENOSPC') {
      throw new Error(`No space left on device. Unable to save ${fileName}`);
    }

    if (fileError.code === 'ENOENT' || fileError.code === 'ENOTDIR') {
      throw new Error(`Unable to save ${fileName}`);
    }

    throw new Error(`Failed to save ${failureLabel}: ${getErrorMessage(error)}`);
  }
}

/**
 * Reads an SBOM from a file path and converts it to CycloneDX format
 * Supports both SPDX 2.3 and CycloneDX formats
 */
export function readSbomFromFile(filePath: string): CdxBom {
  const file = resolve(filePath);

  if (!fs.existsSync(file)) {
    throw new Error(`SBOM file not found: ${file}`);
  }

  try {
    const fileContent = fs.readFileSync(file, 'utf8');
    const jsonContent = JSON.parse(fileContent);

    if (isSpdxBom(jsonContent)) {
      return spdxToCdxBom(jsonContent as SPDX23);
    }

    if (isCdxBom(jsonContent)) {
      return jsonContent as CdxBom;
    }

    throw new Error(`Invalid SBOM file format. Expected SPDX 2.3 or CycloneDX format.`);
  } catch (error) {
    throw new Error(`Failed to read SBOM file: ${getErrorMessage(error)}`);
  }
}

/**
 * Validates that a directory path exists and is actually a directory
 */
export function validateDirectory(dirPath: string): void {
  const dir = resolve(dirPath);

  if (!fs.existsSync(dir)) {
    throw new Error(`Directory not found: ${dir}`);
  }

  const stats = fs.statSync(dir);
  if (!stats.isDirectory()) {
    throw new Error(`Path is not a directory: ${dir}`);
  }
}

/**
 * Saves an SBOM to a file in the specified directory
 */
export function saveSbomToFile(dir: string, sbom: CdxBom, outputPath?: string): string {
  const { fileName, fullPath } = resolveOutputPath(dir, `${filenamePrefix}.sbom.json`, outputPath);
  return writeJsonFile(fullPath, fileName, sbom, fileName);
}

/**
 * Saves a trimmed SBOM to a file in the specified directory
 */
export function saveTrimmedSbomToFile(dir: string, sbom: CdxBom): string {
  const { fileName, fullPath } = resolveOutputPath(dir, `${filenamePrefix}.sbom-trimmed.json`);
  return writeJsonFile(fullPath, fileName, sbom, fileName);
}

/**
 * Saves an EOL report to a file in the specified directory
 */
export function saveReportToFile(dir: string, report: EolReport, outputPath?: string): string {
  const { fileName, fullPath } = resolveOutputPath(dir, `${filenamePrefix}.report.json`, outputPath);
  return writeJsonFile(fullPath, fileName, report, fileName);
}
