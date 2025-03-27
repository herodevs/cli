import { Command, Flags, ux } from '@oclif/core';
import fs from 'node:fs';
import { submitScan } from '../../api/nes/nes.client.ts';
import {
  type ComponentStatus,
  type ScanResult,
  VALID_STATUSES,
  validateComponentStatuses
} from '../../api/types/nes.types.ts';
import type { Sbom } from '../../service/eol/cdx.svc.ts';
import { getErrorMessage, isErrnoException } from '../../service/error.svc.ts';
import { extractPurls } from '../../service/purls.svc.ts';
import {
  createStatusDisplay,
  initializeStatusCounts,
  promptForContinue,
  promptTableSelection,
} from '../../ui/eol.ui.ts';
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
      default: ['EOL', 'LTS', 'OK', 'UNKNOWN'],
    }),
    getCustomerSupport: Flags.boolean({
      char: 'c',
      description: 'Get Never-Ending Support for End-of-Life components',
      default: false,
    }),
  };

  public async run(): Promise<ScanResult | { components: [] }> {
    const { flags } = await this.parse(ScanEol);
    const sbom = await ScanSbom.loadSbom(flags, this.config);
    const scan = await this.scanSbom(sbom);

    ux.action.stop('\nScan completed');

    const validStatuses = validateComponentStatuses(flags.withStatus);

    if (flags.save) {
      await this.saveReport(scan, validStatuses);
    }

    if (this.jsonEnabled()) {
      return scan;
    }

    await this.displayInteractiveResults(scan, validStatuses);

    return scan;
  }

  private async scanSbom(sbom: Sbom): Promise<ScanResult> {
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

    return scan;
  }

  private async displayInteractiveResults(scan: ScanResult, withStatus: ComponentStatus[]): Promise<void> {
    const statusCounts = initializeStatusCounts(scan, withStatus);

    while (true) {
      const selectedStatus = await promptTableSelection(statusCounts);
      if (selectedStatus === 'exit') break;

      const output = createStatusDisplay(scan.components, selectedStatus);
      this.log(output);
      await promptForContinue();
    }
  }

  private async saveReport(scan: ScanResult, validStatuses: string[]): Promise<void> {
    try {
      // Filter components based on withStatus
      const filteredComponents = [];
      for (const [_, component] of scan.components.entries()) {
        if (validStatuses.includes(component.info.status)) {
          filteredComponents.push(component);
        }
      }

      fs.writeFileSync('nes.eol.json', JSON.stringify({ components: filteredComponents }, null, 2));
      this.log('Report saved to nes.eol.json');
    } catch (error) {
      if (isErrnoException(error)) {
        switch (error.code) {
          case 'EACCES':
            this.error('Permission denied. Unable to save report to nes.eol.json');
            break;
          case 'ENOSPC':
            this.error('No space left on device. Unable to save report to nes.eol.json');
            break;
          default:
            this.error(`Failed to save report: ${getErrorMessage(error)}`);
        }
      } else {
        this.error(`Failed to save report: ${getErrorMessage(error)}`);
      }
    }
  }
}
