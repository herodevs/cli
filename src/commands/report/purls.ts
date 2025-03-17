import fs from 'node:fs';
import path from 'node:path';
import { Command, Flags, ux } from '@oclif/core';

import { type Sbom, extractPurls } from '../../service/eol/eol.svc.ts';
import { getPurlOutput } from '../../service/report/purls.svc.ts';
import SbomScan from '../scan/sbom.ts';

export default class ReportPurls extends Command {
  static override description = 'Generate a list of purls from a sbom';
  static override examples = [
    '<%= config.bin %> <%= command.id %> --dir=./my-project',
    '<%= config.bin %> <%= command.id %> --file=path/to/sbom.json',
    '<%= config.bin %> <%= command.id %> --dir=./my-project --save',
    '<%= config.bin %> <%= command.id %> --save --output=csv',
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
    output: Flags.string({
      char: 'o',
      options: ['json', 'csv'],
      default: 'json',
      description: 'The output format of the list of purls',
    }),
  };

  public async run(): Promise<string[]> {
    const { flags } = await this.parse(ReportPurls);
    const { dir: _dirFlag, file: _fileFlag, save, output } = flags;

    // Load the SBOM: Only pass the file, dir, and save flags to SbomScan
    const sbomArgs = SbomScan.getSbomArgs(flags);
    const sbomCommand = new SbomScan(sbomArgs, this.config);
    const sbom: Sbom = await sbomCommand.run();

    // Extract purls from SBOM
    const purls = await extractPurls(sbom);

    ux.action.stop('Scan completed');

    // Print the purls
    this.log('Found purls:');
    for (const purl of purls) {
      this.log(purl);
    }

    // Save if requested
    if (save) {
      try {
        const outputPath = path.join(_dirFlag || process.cwd(), `nes.purls.${output}`);
        const purlOutput = getPurlOutput(purls, output);
        fs.writeFileSync(outputPath, purlOutput);

        this.log(`\nPurls saved to ${outputPath}`);
      } catch (error: unknown) {
        const errorMessage = error && typeof error === 'object' && 'message' in error ? error.message : 'Unknown error';
        this.warn(`Failed to save purls: ${errorMessage}`);
      }
    }

    return purls;
  }
}
