import fs from 'node:fs';
import path from 'node:path';
import { Command, Flags, ux } from '@oclif/core';

import type { Sbom } from '../../service/eol/cdx.svc.ts';
import { log } from '../../service/log.svc.ts';
import { extractPurls, getPurlOutput } from '../../service/purls.svc.ts';
import SbomScan from '../scan/sbom.ts';

export default class ReportPurls extends Command {
  static override description = 'Generate a list of purls from a sbom';
  static enableJsonFlag = true;
  static override examples = [
    '<%= config.bin %> <%= command.id %> --json -s',
    '<%= config.bin %> <%= command.id %> --dir=./my-project',
    '<%= config.bin %> <%= command.id %> --file=path/to/sbom.json',
    '<%= config.bin %> <%= command.id %> --dir=./my-project --save',
    '<%= config.bin %> <%= command.id %> --save --csv',
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
      description: 'Save the list of purls as nes.purls.<output>',
    }),
    csv: Flags.boolean({
      char: 'c',
      default: false,
      description: 'Save output in CSV format (only applies when using --save)',
    }),
  };

  public async run(): Promise<{ purls: string[] }> {
    const { flags } = await this.parse(ReportPurls);
    const { dir: _dirFlag, file: _fileFlag, save, csv } = flags;

    // If --json is used with --csv, return error object
    if (this.jsonEnabled() && csv) {
      this.error(new Error('--csv flag is ignored when using --json'));
    }

    // Load the SBOM: Only pass the file, dir, and save flags to SbomScan
    const sbomArgs = SbomScan.getSbomArgs(flags);
    const sbomCommand = new SbomScan(sbomArgs, this.config);
    const sbom: Sbom = await sbomCommand.run();

    // Extract purls from SBOM
    const purls = await extractPurls(sbom);

    ux.action.stop('Scan completed');

    // Print the purls
    for (const purl of purls) {
      log.info(purl);
    }

    // Save if requested
    if (save) {
      try {
        const outputPath = path.join(_dirFlag || process.cwd(), `nes.purls.${csv ? 'csv' : 'json'}`);
        const purlOutput = getPurlOutput(purls, csv ? 'csv' : 'json');
        fs.writeFileSync(outputPath, purlOutput);

        log.info(`\nPurls saved to ${outputPath}`);
      } catch (error: unknown) {
        const errorMessage = error && typeof error === 'object' && 'message' in error ? error.message : 'Unknown error';
        if (this.jsonEnabled()) {
          this.error(`Failed to save purls: ${errorMessage}`);
        }
        log.warn(`Failed to save purls: ${errorMessage}`);
      }
    }

    // Return wrapped object
    return { purls };
  }
}
