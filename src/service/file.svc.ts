import fs from 'node:fs';
import path, { join, resolve } from 'node:path';
import type { CdxBom, EolReport } from '@herodevs/eol-shared';
import { isCdxBom } from '@herodevs/eol-shared';
import { filenamePrefix } from '../config/constants.ts';
import { getErrorMessage } from './log.svc.ts';

export interface FileError extends Error {
  code?: string;
}

/**
 * Reads an SBOM from a file path
 */
export function readSbomFromFile(filePath: string): CdxBom {
  const file = resolve(filePath);

  if (!fs.existsSync(file)) {
    throw new Error(`SBOM file not found: ${file}`);
  }

  try {
    const fileContent = fs.readFileSync(file, 'utf8');
    const sbom = JSON.parse(fileContent) as CdxBom;
    if (!isCdxBom(sbom)) {
      throw new Error(`Invalid SBOM file: ${file}`);
    }
    return sbom;
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
export function saveSbomToFile(dir: string, sbom: CdxBom): string {
  const outputPath = join(dir, `${filenamePrefix}.sbom.json`);

  try {
    fs.writeFileSync(outputPath, JSON.stringify(sbom, null, 2));
    return outputPath;
  } catch (error) {
    throw new Error(`Failed to save SBOM: ${getErrorMessage(error)}`);
  }
}

/**
 * Saves an EOL report to a file in the specified directory
 */
export function saveReportToFile(dir: string, report: EolReport): string {
  const reportPath = path.join(dir, `${filenamePrefix}.report.json`);

  try {
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    return reportPath;
  } catch (error) {
    const fileError = error as FileError;

    if (fileError.code === 'EACCES') {
      throw new Error(`Permission denied. Unable to save report to ${filenamePrefix}.report.json`);
    }
    if (fileError.code === 'ENOSPC') {
      throw new Error(`No space left on device. Unable to save report to ${filenamePrefix}.report.json`);
    }
    throw new Error(`Failed to save report: ${getErrorMessage(error)}`);
  }
}
