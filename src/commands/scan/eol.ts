import path from 'node:path';
import { Args, Command, Flags, ux } from '@oclif/core';

import fs from 'node:fs';
import { type Sbom, createSbom, prepareRows, scanForEol, validateIsCycloneDxSbom } from '../../service/eol/eol.svc.ts';
import { promptComponentDetails } from '../../service/eol/eol.ui.ts';
import type { ScanResult } from '../../service/nes/modules/sbom.ts';

export default class ScanEol extends Command {
  static override args = {
    dir: Args.string({ description: 'file to read' }),
  };
  static override description = 'Scan a given directory';
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
      description: 'The directory to scan',
    }),
    save: Flags.boolean({
      char: 's',
      default: false,
      description: 'Save the generated SBOM as nes.sbom.json in the scanned directory',
    }),
  };

  getScanOptions() {
    // intentionally provided for mocking
    return {};
  }

  public async run(): Promise<ScanResult | { components: [] }> {
    const { flags } = await this.parse(ScanEol);
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

    const { purls, scan } = await scanForEol(sbom);
    ux.action.stop('Scan completed');

    if (!scan?.components) {
      if (_fileFlag) {
        throw new Error(`Scan failed to generate for file path: ${_fileFlag}`);
      }
      if (_dirFlag) {
        throw new Error(`Scan failed to generate for dir: ${_dirFlag}`);
      }
      throw new Error('Scan failed to generate components.');
    }

    const lines = await prepareRows(purls, scan);
    if (lines?.length === 0) {
      this.log('No dependencies found');
      return { components: [] };
    }

    const r = await promptComponentDetails(lines);
    this.log('What now %o', r);

    return scan;
  }

  private async _getSbomFromScan(_dirFlag: string): Promise<Sbom> {
    const dir = path.resolve(_dirFlag);
    if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) {
      throw new Error(`Directory not found or not a directory: ${dir}`);
    }
    ux.action.start(`Scanning ${dir}`);
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
    ux.action.start(`Loading sbom from ${file}`);
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
      this.log(`SBOM saved to ${outputPath}`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.warn(`Failed to save SBOM: ${errorMessage}`);
    }
  }
}
