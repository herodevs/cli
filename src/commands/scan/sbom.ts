import path from 'node:path';
import { Command, Flags, ux } from '@oclif/core';

import fs from 'node:fs';
import type { Sbom } from '../../service/eol/cdx.svc.ts';
import { createSbom, validateIsCycloneDxSbom } from '../../service/eol/eol.svc.ts';

export default class ScanSbom extends Command {
  static override description = 'Scan a SBOM for purls';
  static enableJsonFlag = true;
  static override examples = [
    '<%= config.bin %> <%= command.id %> --dir=./my-project',
    '<%= config.bin %> <%= command.id %> --file=path/to/sbom.json',
  ];
  static override flags = {
    file: Flags.string({
      char: 'f',
      description: 'The file path of an existing cyclonedx sbom to scan for EOL',
    }),
    dir: Flags.string({
      char: 'd',
      description: 'The directory to scan in order to create a cyclonedx sbom',
    }),
    save: Flags.boolean({
      char: 's',
      default: false,
      description: 'Save the generated SBOM as nes.sbom.json in the scanned directory',
    }),
  };

  static getSbomArgs(flags: Record<string, string>): string[] {
    const { dir, file, save, json } = flags ?? {};

    const sbomArgs = [];

    if (file) sbomArgs.push('--file', file);
    if (dir) sbomArgs.push('--dir', dir);
    if (save) sbomArgs.push('--save');
    if (json) sbomArgs.push('--json');

    return sbomArgs;
  }

  getScanOptions() {
    // intentionally provided for mocking
    return {};
  }

  public async run(): Promise<Sbom> {
    const { flags } = await this.parse(ScanSbom);
    const { dir: _dirFlag, save, file: _fileFlag } = flags;

    // Validate that exactly one of --file or --dir is provided
    if (_fileFlag && _dirFlag) {
      throw new Error('Cannot specify both --file and --dir flags. Please use one or the other.');
    }

    let sbom: Sbom;

    if (_fileFlag) {
      sbom = this._getSbomFromFile(_fileFlag);
    } else {
      const _dir = _dirFlag || process.cwd();
      sbom = await this._getSbomFromScan(_dir);
      if (save) {
        this._saveSbom(_dir, sbom);
      }
    }

    return sbom;
  }

  private async _getSbomFromScan(_dirFlag: string): Promise<Sbom> {
    const dir = path.resolve(_dirFlag);
    if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) {
      throw new Error(`Directory not found or not a directory: ${dir}`);
    }
    if (!this.jsonEnabled()) {
      ux.action.start(`Scanning ${dir}`);
    }
    const options = this.getScanOptions();
    const sbom = await createSbom(dir, options);
    if (!sbom) {
      throw new Error(`SBOM failed to generate for dir: ${dir}`);
    }
    return sbom;
  }

  private _getSbomFromFile(_fileFlag: string): Sbom {
    const file = path.resolve(_fileFlag);
    if (!fs.existsSync(file)) {
      throw new Error(`SBOM file not found: ${file}`);
    }
    if (!this.jsonEnabled()) {
      ux.action.start(`Loading sbom from ${file}`);
    }
    try {
      const fileContent = fs.readFileSync(file, {
        encoding: 'utf8',
        flag: 'r',
      });
      const sbom = JSON.parse(fileContent) as Sbom;
      validateIsCycloneDxSbom(sbom);
      return sbom;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to read or parse SBOM file: ${errorMessage}`);
    }
  }

  private _saveSbom(dir: string, sbom: Sbom) {
    try {
      const outputPath = path.join(dir, 'nes.sbom.json');
      fs.writeFileSync(outputPath, JSON.stringify(sbom, null, 2));
      if (!this.jsonEnabled()) {
        this.log(`SBOM saved to ${outputPath}`);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.warn(`Failed to save SBOM: ${errorMessage}`);
    }
  }
}
