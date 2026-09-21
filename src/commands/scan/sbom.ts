import type { CdxBom } from '@herodevs/eol-shared';
import { Command, Flags } from '@oclif/core';
import ora from 'ora';
import { track } from '../../service/analytics.svc.ts';
import { createSbom } from '../../service/cdx.svc.ts';
import { readSbomFromFile, saveArtifactToFile, validateDirectory } from '../../service/file.svc.ts';
import { getErrorMessage } from '../../service/log.svc.ts';

export default class ScanSbom extends Command {
  static override description = 'Generate a CycloneDX SBOM for a directory';
  static override examples = [
    { description: 'Default behavior (no command or flags specified)', command: '<%= config.bin %>' },
    { description: 'Equivalent to', command: '<%= config.bin %> <%= command.id %> --dir .' },
    {
      description: 'Load and reformat an existing SBOM instead of generating one',
      command: '<%= config.bin %> <%= command.id %> --file /path/to/sbom.json',
    },
    {
      description: 'Save the SBOM to a file instead of printing it to stdout',
      command: '<%= config.bin %> <%= command.id %> --output ./herodevs.sbom.json',
    },
    {
      description: 'Generate an SBOM, then scan it in a separate step',
      command: '<%= config.bin %> <%= command.id %> --output sbom.json && <%= config.bin %> scan eol --file sbom.json',
    },
  ];
  static override flags = {
    file: Flags.string({
      char: 'f',
      description: 'The file path of an existing SBOM to load (supports CycloneDX and SPDX 2.3 formats)',
      exclusive: ['dir'],
    }),
    dir: Flags.string({
      char: 'd',
      default: process.cwd(),
      defaultHelp: async () => '<current directory>',
      description: 'The directory to scan in order to generate a CycloneDX SBOM',
      exclusive: ['file'],
    }),
    output: Flags.string({
      char: 'o',
      description:
        'Save the SBOM to a file instead of printing it to stdout. Defaults to herodevs.sbom.json when given a directory or omitted a filename',
    }),
  };

  public async run(): Promise<CdxBom> {
    const { flags } = await this.parse(ScanSbom);

    const sbom = await this.loadSbom(flags.file, flags.dir);

    if (!flags.file) {
      track('CLI SBOM Generated', (context) => ({
        command: context.command,
        command_flags: context.command_flags,
      }));
    }

    if (flags.output !== undefined) {
      const sbomPath = this.saveSbom(flags.dir, sbom, flags.output);
      this.log(`SBOM saved to ${sbomPath}`);
      track('CLI SBOM Output Saved', (context) => ({
        command: context.command,
        command_flags: context.command_flags,
        sbom_output_path: sbomPath,
      }));
      return sbom;
    }

    this.log(JSON.stringify(sbom, null, 2));
    return sbom;
  }

  private async loadSbom(file: string | undefined, dir: string): Promise<CdxBom> {
    const spinner = ora();
    spinner.start(file ? 'Loading SBOM file' : 'Generating SBOM');

    const sbom = file ? this.getSbomFromFile(file) : await this.getSbomFromScan(dir);

    spinner.succeed(file ? 'Loaded SBOM file' : 'Generated SBOM');

    return sbom;
  }

  private async getSbomFromScan(dirPath: string): Promise<CdxBom> {
    try {
      validateDirectory(dirPath);
      const sbom = await createSbom(dirPath);
      if (!sbom) {
        this.error(`SBOM failed to generate for dir: ${dirPath}`);
      }
      return sbom;
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      track('CLI Error Encountered', () => ({ error: errorMessage }));
      this.error(`Failed to scan directory: ${errorMessage}`);
    }
  }

  private getSbomFromFile(filePath: string): CdxBom {
    try {
      return readSbomFromFile(filePath);
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      track('CLI Error Encountered', () => ({ error: errorMessage }));
      this.error(errorMessage);
    }
  }

  private saveSbom(dir: string, sbom: CdxBom, outputPath?: string): string {
    try {
      return saveArtifactToFile(dir, { kind: 'sbom', payload: sbom, outputPath });
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      track('CLI Error Encountered', () => ({ error: errorMessage }));
      this.error(errorMessage);
    }
  }
}
