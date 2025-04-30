import { spawn } from 'node:child_process';
import fs from 'node:fs';
import { join, resolve } from 'node:path';
import { Command, Flags, ux } from '@oclif/core';
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
      description: 'Save the generated SBOM as eol.sbom.json in the scanned directory',
    }),
    background: Flags.boolean({
      char: 'b',
      default: false,
      description: 'Run the scan in the background',
    }),
  };

  static async loadSbom(flags: Record<string, string>, config: Command['config']) {
    const sbomArgs = ScanSbom.getSbomArgs(flags);
    const sbomCommand = new ScanSbom(sbomArgs, config);
    const sbom = await sbomCommand.run();
    if (!sbom) {
      throw new Error('SBOM not generated');
    }
    return sbom;
  }

  static getSbomArgs(flags: Record<string, string>): string[] {
    const { dir, file, save, json, background } = flags ?? {};

    const sbomArgs = [];

    if (file) sbomArgs.push('--file', file);
    if (dir) sbomArgs.push('--dir', dir);
    // if (save) sbomArgs.push('--save'); // only save if sbom command is used directly with -s flag
    if (json) sbomArgs.push('--json');
    if (background) sbomArgs.push('--background');

    return sbomArgs;
  }

  getScanOptions() {
    // intentionally provided for mocking
    return {};
  }

  public async run(): Promise<Sbom | undefined> {
    const { flags } = await this.parse(ScanSbom);
    const { dir, save, file, background } = flags;

    // Validate that exactly one of --file or --dir is provided
    if (file && dir) {
      throw new Error('Cannot specify both --file and --dir flags. Please use one or the other.');
    }
    let sbom: Sbom;
    const path = dir || process.cwd();
    if (file) {
      sbom = this._getSbomFromFile(file);
    } else if (background) {
      this._getSbomInBackground(path);
      this.log(`The scan is running in the background. The file will be saved at ${path}/eol.sbom.json`);
      return;
    } else {
      sbom = await this._getSbomFromScan(path);
      if (save) {
        this._saveSbom(path, sbom);
      }
    }

    return sbom;
  }

  private async _getSbomFromScan(_dirFlag: string): Promise<Sbom> {
    const dir = resolve(_dirFlag);
    try {
      if (!fs.existsSync(dir)) {
        throw new Error(`Directory not found: ${dir}`);
      }
      const stats = fs.statSync(dir);
      if (!stats.isDirectory()) {
      }

      ux.action.start(`Scanning ${dir}`);

      const options = this.getScanOptions();
      const sbom = await createSbom(dir, options);
      if (!sbom) {
        throw new Error(`SBOM failed to generate: ${dir}`);
      }
      return sbom;
    } catch (error) {
      throw new Error('Failed to scan directory', { cause: error });
    }
  }

  private _getSbomInBackground(path: string): void {
    try {
      const opts = this.getScanOptions();
      const args = [
        JSON.stringify({
          opts,
          path,
        }),
      ];

      const workerProcess = spawn('node', [join(import.meta.url, '../../service/eol/sbom.worker.js'), ...args], {
        stdio: 'ignore',
        detached: true,
        env: { ...process.env },
      });

      workerProcess.unref();
    } catch (error) {
      throw new Error('Failed to start background scan', { cause: error });
    }
  }

  private _getSbomFromFile(_fileFlag: string): Sbom {
    const file = resolve(_fileFlag);
    try {
      if (!fs.existsSync(file)) {
        throw new Error(`SBOM file not found: ${file}`);
      }

      ux.action.start(`Loading sbom from ${file}`);

      const fileContent = fs.readFileSync(file, {
        encoding: 'utf8',
        flag: 'r',
      });
      const sbom = JSON.parse(fileContent) as Sbom;
      validateIsCycloneDxSbom(sbom);
      return sbom;
    } catch (error) {
      throw new Error('Failed to read SBOM file', { cause: error });
    }
  }

  private _saveSbom(dir: string, sbom: Sbom) {
    try {
      const outputPath = join(dir, 'eol.sbom.json');
      fs.writeFileSync(outputPath, JSON.stringify(sbom, null, 2));
      if (!this.jsonEnabled()) {
        this.log(`SBOM saved to ${outputPath}`);
      }
    } catch (error) {
      throw new Error('Failed to save SBOM', { cause: error });
    }
  }
}
