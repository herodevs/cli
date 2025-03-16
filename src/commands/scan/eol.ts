import { Command, Flags, ux } from '@oclif/core';

import { type Sbom, prepareRows, scanForEol } from '../../service/eol/eol.svc.ts';
import { promptComponentDetails } from '../../service/eol/eol.ui.ts';
import type { ScanResult } from '../../service/nes/modules/sbom.ts';
import SbomScan from './sbom.ts';

export default class ScanEol extends Command {
  static override description = 'Scan a given sbom for EOL data';
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

  public async run(): Promise<ScanResult | { components: [] }> {
    const { flags } = await this.parse(ScanEol);
    const { dir: _dirFlag, file: _fileFlag } = flags;

    // Load the SBOM
    const sbomCommand = new SbomScan(this.argv, this.config);
    const sbom: Sbom = await sbomCommand.run();

    // Scan the SBOM for EOL information
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
}
