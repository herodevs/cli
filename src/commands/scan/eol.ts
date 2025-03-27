import { Command, Flags, ux } from '@oclif/core';

import { submitScan } from '../../api/nes/nes.client.ts';
import { type ScanResult, VALID_STATUSES } from '../../api/types/nes.types.ts';
import type { Sbom } from '../../service/eol/cdx.svc.ts';
import { getErrorMessage } from '../../service/error.svc.ts';
import { extractPurls } from '../../service/purls.svc.ts';
import ScanSbom from './sbom.ts';
export default class ScanEol extends Command {
  static override description = 'Scan a given sbom for EOL data';
  static enableJsonFlag = true;
  static override examples = [
    '<%= config.bin %> <%= command.id %> --dir=./my-project',
    '<%= config.bin %> <%= command.id %> --file=path/to/sbom.json',
    '<%= config.bin %> <%= command.id %> -w EOL,UNKNOWN --dir=./my-project',
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
    withStatus: Flags.string({
      char: 'w',
      description: `Show components with specific statuses (comma-separated). Valid values: ${VALID_STATUSES.join(
        ', ',
      )}`,
      options: VALID_STATUSES,
      multiple: true,
      delimiter: ',',
      default: ['EOL'],
    }),
  };

  public async run(): Promise<ScanResult | { components: [] }> {
    const { flags } = await this.parse(ScanEol);
    const { dir: _dirFlag, file: _fileFlag, withStatus } = flags;

    const sbom = await ScanSbom.loadSbom(flags, this.config);
    const { scan, purls } = await this.scanSbom(sbom);

    ux.action.stop('Scan completed');

    // TODO:
    // - display rows using cli table
    // - save to file

    return scan;
  }

  private async scanSbom(sbom: Sbom): Promise<{ scan: ScanResult; purls: string[] }> {
    let scan: ScanResult;
    let purls: string[];

    try {
      purls = await extractPurls(sbom);
    } catch (error) {
      this.error(`Failed to extract purls from sbom. ${getErrorMessage(error)}`);
    }
    try {
      scan = await submitScan(purls);
    } catch (error) {
      this.error(`Failed to submit scan to NES from sbom. ${getErrorMessage(error)}`);
    }

    if (scan.components.size === 0) {
      this.warn('No components found in scan');
    }

    return { scan, purls };
  }
}
