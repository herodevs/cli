import fs from 'node:fs';
import path from 'node:path';
import { Command, Flags, ux } from '@oclif/core';
import terminalLink from 'terminal-link';
import { batchSubmitPurls } from '../../api/nes/nes.client.ts';
import type { ScanResult } from '../../api/types/hd-cli.types.js';
import type { ComponentStatus, InsightsEolScanComponent } from '../../api/types/nes.types.ts';
import { config, filenamePrefix } from '../../config/constants.ts';
import type { Sbom } from '../../service/eol/cdx.svc.ts';
import { getErrorMessage, isErrnoException } from '../../service/error.svc.ts';
import { extractPurls, parsePurlsFile } from '../../service/purls.svc.ts';
import { INDICATORS, SCAN_ID_KEY, STATUS_COLORS } from '../../ui/shared.ui.ts';
import ScanSbom from './sbom.ts';
import ora from 'ora';

export default class ScanEol extends Command {
  static override description = 'Scan a given sbom for EOL data';
  static enableJsonFlag = true;
  static override examples = [
    '<%= config.bin %> <%= command.id %> --dir=./my-project',
    '<%= config.bin %> <%= command.id %> --file=path/to/sbom.json',
    '<%= config.bin %> <%= command.id %> --purls=path/to/purls.json',
    '<%= config.bin %> <%= command.id %> -a --dir=./my-project',
  ];
  static override flags = {
    file: Flags.string({
      char: 'f',
      description: 'The file path of an existing cyclonedx sbom to scan for EOL',
    }),
    purls: Flags.string({
      char: 'p',
      description: 'The file path of a list of purls to scan for EOL',
    }),
    dir: Flags.string({
      char: 'd',
      description: 'The directory to scan in order to create a cyclonedx sbom',
    }),
    save: Flags.boolean({
      char: 's',
      default: false,
      description: `Save the generated report as ${filenamePrefix}.report.json in the scanned directory`,
    }),
  };

  public async run(): Promise<{ components: InsightsEolScanComponent[]; createdOn: string }> {
    const { flags } = await this.parse(ScanEol);

    const scan = await this.getScan(flags, this.config);
    const components = Array.from(scan.components.values());

    ux.action.stop();

    if (flags.save) {
      await this.saveReport(components, scan.createdOn);
    }

    if (!this.jsonEnabled()) {
      this.displayResults(components);

      if (scan.scanId) {
        this.printWebReportUrl(scan.scanId);
      }

      this.log('* Use --json to output the report payload');
      this.log(`* Use --save to save the report to ${filenamePrefix}.report.json`);
      this.log('* Use --help for more commands or options');
    }

    return { components, createdOn: scan.createdOn ?? '' };
  }

  private async getScan(flags: Record<string, string>, config: Command['config']): Promise<ScanResult> {
    if (flags.purls) {
      const spinner = ora().start('Loading purls file');
      const purls = this.getPurlsFromFile(flags.purls);
      spinner.succeed('Loaded purls file');
      return batchSubmitPurls(purls);
    }

    const sbom = await ScanSbom.loadSbom(flags, config);
    return this.scanSbom(sbom);
  }

  private getPurlsFromFile(filePath: string): string[] {
    try {
      const purlsFileString = fs.readFileSync(filePath, 'utf8');
      return parsePurlsFile(purlsFileString);
    } catch (error) {
      this.error(`Failed to read purls file. ${getErrorMessage(error)}`);
    }
  }

  private printWebReportUrl(scanId: string): void {
    this.log(ux.colorize('bold', '-'.repeat(40)));
    const id = scanId.split(SCAN_ID_KEY)[1];
    const reportCardUrl = config.eolReportUrl;
    const url = ux.colorize(
      'blue',
      terminalLink(new URL(reportCardUrl).hostname, `${reportCardUrl}/${id}`, { fallback: (_, url) => url }),
    );
    this.log(`🌐 View your full EOL report at: ${url}\n`);
  }

  private async scanSbom(sbom: Sbom): Promise<ScanResult> {
    let scan: ScanResult;
    let purls: string[];

    try {
      purls = await extractPurls(sbom);
    } catch (error) {
      this.error(`Failed to extract purls from sbom. ${getErrorMessage(error)}`);
    }

    const spinner = ora().start('Scanning for EOL packages');
    try {
      scan = await batchSubmitPurls(purls);
      spinner.succeed('Scan completed');
    } catch (error) {
      spinner.fail('Scanning failed');
      this.error(`Failed to submit scan to NES from sbom. ${getErrorMessage(error)}`);
    }

    return scan;
  }

  private async saveReport(components: InsightsEolScanComponent[], createdOn?: string): Promise<void> {
    const { flags } = await this.parse(ScanEol);
    const reportPath = path.join(flags.dir || process.cwd(), `${filenamePrefix}.report.json`);

    try {
      fs.writeFileSync(reportPath, JSON.stringify({ components, createdOn }, null, 2));
      this.log(`Report saved to ${filenamePrefix}.report.json`);
    } catch (error) {
      if (!isErrnoException(error)) {
        this.error(`Failed to save report: ${getErrorMessage(error)}`);
      }
      if (error.code === 'EACCES') {
        this.error(`Permission denied. Unable to save report to ${filenamePrefix}.report.json`);
      } else if (error.code === 'ENOSPC') {
        this.error(`No space left on device. Unable to save report to ${filenamePrefix}.report.json`);
      } else {
        this.error(`Failed to save report: ${getErrorMessage(error)}`);
      }
    }
  }

  private displayResults(components: InsightsEolScanComponent[]) {
    const { UNKNOWN, OK, EOL_UPCOMING, EOL, NES_AVAILABLE } = countComponentsByStatus(components);

    if (!UNKNOWN && !OK && !EOL_UPCOMING && !EOL) {
      this.log(ux.colorize('yellow', 'No components found in scan.'));
      return;
    }

    this.log(ux.colorize('bold', 'Scan results:'));
    this.log(ux.colorize('bold', '-'.repeat(40)));
    this.log(ux.colorize('bold', `${components.length.toLocaleString()} total packages scanned`));
    this.log(ux.colorize(STATUS_COLORS.EOL, `${INDICATORS.EOL} ${EOL.toLocaleString().padEnd(5)} End-of-Life (EOL)`));
    this.log(
      ux.colorize(
        STATUS_COLORS.EOL_UPCOMING,
        `${INDICATORS.EOL_UPCOMING}${EOL_UPCOMING.toLocaleString().padEnd(5)} EOL Upcoming`,
      ),
    );
    this.log(ux.colorize(STATUS_COLORS.OK, `${INDICATORS.OK} ${OK.toLocaleString().padEnd(5)} OK`));
    this.log(
      ux.colorize(STATUS_COLORS.UNKNOWN, `${INDICATORS.UNKNOWN} ${UNKNOWN.toLocaleString().padEnd(5)} Unknown Status`),
    );
    this.log(
      ux.colorize(
        STATUS_COLORS.UNKNOWN,
        `${INDICATORS.UNKNOWN} ${NES_AVAILABLE.toLocaleString().padEnd(5)} HeroDevs NES Remediation${NES_AVAILABLE !== 1 ? 's' : ''} Available`,
      ),
    );
  }
}

export function countComponentsByStatus(
  components: InsightsEolScanComponent[],
): Record<ComponentStatus | 'NES_AVAILABLE', number> {
  const grouped: Record<ComponentStatus | 'NES_AVAILABLE', number> = {
    UNKNOWN: 0,
    OK: 0,
    EOL_UPCOMING: 0,
    EOL: 0,
    NES_AVAILABLE: 0,
  };

  for (const component of components) {
    grouped[component.info.status]++;

    if (component.info.nesAvailable) {
      grouped.NES_AVAILABLE++;
    }
  }

  return grouped;
}
