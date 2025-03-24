import { Command, Flags, ux } from '@oclif/core';

import type { ScanResult } from '../../api/types/nes.types.ts';
import type { Sbom } from '../../service/eol/cdx.svc.ts';
import { prepareRows, scanForEol } from '../../service/eol/eol.svc.ts';
import { promptComponentDetails } from '../../ui/eol.ui.ts';
import SbomScan from './sbom.ts';
import { log } from '../../service/log.svc.ts';

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
    this.checkEolScanDisabled();

    const { flags } = await this.parse(ScanEol);
    const { dir: _dirFlag, file: _fileFlag } = flags;

    // Load the SBOM: Only pass the file, dir, and save flags to SbomScan
    const sbomArgs = SbomScan.getSbomArgs(flags);
    const sbomCommand = new SbomScan(sbomArgs, this.config);
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
      log.info('No dependencies found');
      return { components: [] };
    }

    const r = await promptComponentDetails(lines);
    log.info('What now %o', r);

    return scan;
  }

  private checkEolScanDisabled(override = true) {
    // Check if running in beta version or pre v1.0.0
    const version = this.config.version;
    const [major] = version.split('.').map(Number);

    if (version.includes('beta') || major < 1) {
      log.info(`VERSION=${version}`);
      throw new Error('The EOL scan feature is not available in beta releases. Please wait for the stable release.');
    }
    // Just in case the beta check fails
    if (override) {
      log.info(`VERSION=${version}`);
      log.info('EOL scan is disabled');
      return { components: [] };
    }
  }
}
