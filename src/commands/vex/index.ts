import { Command, Flags } from '@oclif/core';
import { filenamePrefix } from '../../config/constants.ts';
import { track } from '../../service/analytics.svc.ts';
import { readSbomFromFile, saveArtifactToFile } from '../../service/file.svc.ts';
import { getErrorMessage } from '../../service/log.svc.ts';
import { type OpenVexDocument, applyVexFilters, fetchVexStatement } from '../../service/vex.svc.ts';

export default class Vex extends Command {
  static override description = 'Download and filter the HeroDevs VEX statement';
  static enableJsonFlag = true;
  static override examples = [
    {
      description: 'Download the full HeroDevs VEX statement',
      command: '<%= config.bin %> <%= command.id %>',
    },
    {
      description: 'Filter to packages present in an SBOM',
      command: '<%= config.bin %> <%= command.id %> --file /path/to/sbom.json',
    },
    {
      description: 'Filter by vulnerability ID pattern',
      command: '<%= config.bin %> <%= command.id %> --vuln "CVE-2021-*"',
    },
    {
      description: 'Filter by package PURL pattern',
      command: '<%= config.bin %> <%= command.id %> --package "pkg:npm/express*"',
    },
    {
      description: 'Filter by status',
      command: '<%= config.bin %> <%= command.id %> --status not_affected',
    },
    {
      description: 'Save filtered VEX to a file',
      command: '<%= config.bin %> <%= command.id %> --file sbom.json --save',
    },
    {
      description: 'Exclude packages matching a PURL pattern',
      command: '<%= config.bin %> <%= command.id %> --exclude-package "pkg:npm/lodash*"',
    },
    {
      description: 'Combine multiple filters (AND logic)',
      command: '<%= config.bin %> <%= command.id %> --file sbom.json --vuln "CVE-*" --status affected',
    },
  ];

  static override flags = {
    file: Flags.string({
      char: 'f',
      description: 'Path to a CycloneDX or SPDX 2.3 SBOM; filters VEX entries to packages present in the SBOM',
    }),
    package: Flags.string({
      char: 'p',
      description:
        'Glob pattern matched against product PURLs (repeatable, e.g. --package "pkg:npm/lodash*"). Keeps statements where any product matches.',
      multiple: true,
    }),
    vuln: Flags.string({
      char: 'v',
      description: 'Glob pattern matched against vulnerability IDs (repeatable, e.g. --vuln "CVE-2021-*")',
      multiple: true,
    }),
    status: Flags.string({
      description: 'Filter by VEX analysis status (repeatable)',
      multiple: true,
      options: ['affected', 'not_affected', 'fixed', 'under_investigation'],
    }),
    'exclude-package': Flags.string({
      char: 'e',
      description:
        'Glob pattern matched against product PURLs to exclude (repeatable, e.g. --exclude-package "pkg:npm/lodash*"). Removes statements where any product matches.',
      multiple: true,
    }),
    save: Flags.boolean({
      char: 's',
      default: false,
      description: `Save VEX statement to ${filenamePrefix}.vex.json in the current directory`,
    }),
    output: Flags.string({
      char: 'o',
      description: `Save VEX statement to a custom path (defaults to ${filenamePrefix}.vex.json when not provided)`,
    }),
  };

  public async run(): Promise<OpenVexDocument> {
    const { flags } = await this.parse(Vex);

    track('CLI VEX Download Started', (context) => ({
      command: context.command,
      command_flags: context.command_flags,
    }));

    let vex: OpenVexDocument;
    try {
      vex = await fetchVexStatement();
    } catch (error) {
      const message = getErrorMessage(error);
      track('CLI VEX Download Failed', () => ({ error: message }));
      this.error(`Failed to fetch VEX statement. ${message}`);
    }

    const hasFilters =
      flags.file ||
      flags.package?.length ||
      flags.vuln?.length ||
      flags.status?.length ||
      flags['exclude-package']?.length;

    if (hasFilters) {
      const sbom = flags.file ? this.loadSbom(flags.file) : undefined;
      vex = applyVexFilters(vex, {
        sbom,
        packagePatterns: flags.package,
        vulnPatterns: flags.vuln,
        statuses: flags.status,
        excludePackagePatterns: flags['exclude-package'],
      });
    }

    track('CLI VEX Download Completed', (context) => ({
      command: context.command,
      command_flags: context.command_flags,
      statement_count: vex.statements.length,
      filtered: Boolean(hasFilters),
    }));

    let outputPath = flags.output;
    if (flags.output && !flags.save) {
      this.warn('--output requires --save to write the file. Run again with --save to create the file.');
      outputPath = undefined;
    }

    const shouldSave = flags.save;
    if (shouldSave) {
      const savedPath = this.saveVex(vex, outputPath);
      this.log(`VEX statement saved to ${savedPath}`);
    }

    if (!this.jsonEnabled()) {
      this.log(JSON.stringify(vex, null, 2));
    }

    return vex;
  }

  private loadSbom(filePath: string) {
    try {
      return readSbomFromFile(filePath);
    } catch (error) {
      const message = getErrorMessage(error);
      track('CLI Error Encountered', () => ({ error: message }));
      this.error(message);
    }
  }

  private saveVex(vex: OpenVexDocument, outputPath?: string): string {
    try {
      return saveArtifactToFile(process.cwd(), { kind: 'vex', payload: vex, outputPath });
    } catch (error) {
      const message = getErrorMessage(error);
      track('CLI Error Encountered', () => ({ error: message }));
      this.error(message);
    }
  }
}
