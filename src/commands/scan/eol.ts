import fs from 'node:fs';
import path from 'node:path';
import { deriveComponentStatus, trimCdxBom } from '@herodevs/eol-shared';
import type { CdxBom, ComponentStatus, EolReport } from '@herodevs/eol-shared';
import { Command, Flags, ux } from '@oclif/core';
import ora from 'ora';
import terminalLink from 'terminal-link';
import { submitPurls, submitScan } from '../../api/nes/nes.client.ts';
import { config, filenamePrefix } from '../../config/constants.ts';
import type { Sbom } from '../../service/eol/cdx.svc.ts';
import { getErrorMessage, isErrnoException } from '../../service/error.svc.ts';
import { parsePurlsFile } from '../../service/purls.svc.ts';
import { INDICATORS, STATUS_COLORS } from '../../ui/shared.ui.ts';
import ScanSbom from './sbom.ts';

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

  public async run(): Promise<EolReport> {
    const { flags } = await this.parse(ScanEol);

    const scan = await this.getScan(flags, this.config);

    ux.action.stop();

    if (flags.save) {
      await this.saveReport(scan);
    }

    if (!this.jsonEnabled()) {
      this.displayResults(scan);

      if (scan.id) {
        this.printWebReportUrl(scan.id);
      }

      this.log('* Use --json to output the report payload');
      this.log(`* Use --save to save the report to ${filenamePrefix}.report.json`);
      this.log('* Use --help for more commands or options');
    }

    return scan;
  }

  private async getScan(flags: Record<string, string>, config: Command['config']): Promise<EolReport> {
    if (flags.purls) {
      const purls = this.getPurlsFromFile(flags.purls);
      return this.scanPurls(purls);
    }

    const sbom = await ScanSbom.loadSbom(flags, config);
    return this.scanSbom(sbom);
  }

  private getPurlsFromFile(filePath: string): string[] {
    const spinner = ora().start(`Loading purls from \`${filePath}\``);
    try {
      const purlsFileString = fs.readFileSync(filePath, 'utf8');
      const purls = parsePurlsFile(purlsFileString);
      spinner.succeed(`Loaded purls from \`${filePath}\``);
      return purls;
    } catch (error) {
      spinner.fail(`Failed to read purls from \`${filePath}\``);
      this.error(`Failed to read purls file. ${getErrorMessage(error)}`);
    }
  }

  private printWebReportUrl(id: string): void {
    this.log(ux.colorize('bold', '-'.repeat(40)));
    const reportCardUrl = config.eolReportUrl;
    const url = ux.colorize(
      'blue',
      terminalLink(new URL(reportCardUrl).hostname, `${reportCardUrl}/${id}`, { fallback: (_, url) => url }),
    );
    this.log(`🌐 View your full EOL report at: ${url}\n`);
  }

  private async scanSbom(sbom: Sbom): Promise<EolReport> {
    const spinner = ora().start('Scanning for EOL packages');
    try {
      const scan = await submitScan({ sbom: trimCdxBom(sbom as CdxBom) });
      spinner.succeed('Scan completed');
      return scan;
    } catch (error) {
      spinner.fail('Scanning failed');
      this.error(`Failed to submit scan to NES. ${getErrorMessage(error)}`);
    }
  }

  private async scanPurls(purls: string[]): Promise<EolReport> {
    const spinner = ora().start('Scanning for EOL packages');
    try {
      const scan = await submitPurls(purls);
      spinner.succeed('Scan completed');
      return scan;
    } catch (error) {
      spinner.fail('Scanning failed');
      this.error(`Failed to submit scan to NES. ${getErrorMessage(error)}`);
    }
  }

  private async saveReport(report: EolReport): Promise<void> {
    const { flags } = await this.parse(ScanEol);
    const reportPath = path.join(flags.dir || process.cwd(), `${filenamePrefix}.report.json`);

    try {
      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
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

  private displayResults(report: EolReport) {
    const { UNKNOWN, OK, EOL_UPCOMING, EOL, NES_AVAILABLE } = countComponentsByStatus(report);

    if (!UNKNOWN && !OK && !EOL_UPCOMING && !EOL) {
      this.log(ux.colorize('yellow', 'No components found in scan.'));
      return;
    }

    this.log(ux.colorize('bold', 'Scan results:'));
    this.log(ux.colorize('bold', '-'.repeat(40)));
    this.log(ux.colorize('bold', `${report.components.length.toLocaleString()} total packages scanned`));
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

export function countComponentsByStatus(report: EolReport): Record<ComponentStatus | 'NES_AVAILABLE', number> {
  const grouped: Record<ComponentStatus | 'NES_AVAILABLE', number> = {
    UNKNOWN: 0,
    OK: 0,
    EOL_UPCOMING: 0,
    EOL: 0,
    NES_AVAILABLE: 0,
  };

  for (const component of report.components) {
    const status = deriveComponentStatus(component.metadata);
    grouped[status]++;

    if (component.nesRemediation?.remediations?.length) {
      grouped.NES_AVAILABLE++;
    }
  }

  return grouped;
}
