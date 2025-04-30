import fs from 'node:fs';
import path from 'node:path';
import { Command, Flags, ux } from '@oclif/core';

import { isErrnoException } from '../../service/error.svc.ts';
import { extractPurls, getPurlOutput } from '../../service/purls.svc.ts';
import ScanSbom from '../scan/sbom.ts';

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
      description: 'Save the list of purls as eol.purls.<output>',
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

    try {
      const sbom = await ScanSbom.loadSbom(flags, this.config);
      const purls = await extractPurls(sbom);
      this.log('Extracted %d purls from SBOM', purls.length);

      ux.action.stop('Scan completed');

      // Print the purls
      for (const purl of purls) {
        this.log(purl);
      }

      // Save if requested
      if (save) {
        try {
          const outputFile = csv && !this.jsonEnabled() ? 'csv' : 'json';
          const outputPath = path.join(_dirFlag || process.cwd(), `eol.purls.${outputFile}`);
          const purlOutput = getPurlOutput(purls, outputFile);
          fs.writeFileSync(outputPath, purlOutput);

          this.log('Purls saved to %s', outputPath);
        } catch (cause: unknown) {
          if (isErrnoException(cause)) {
            switch (cause.code) {
              case 'EACCES':
                throw new Error('Permission denied: Cannot write to output file', { cause });
              case 'ENOSPC':
                throw new Error('No space left on device', { cause });
              case 'EISDIR':
                throw new Error('Cannot write to output file: Is a directory', { cause });
              default:
                throw new Error('Failed to save purls', { cause });
            }
          }
          throw new Error('Failed to save purls', { cause });
        }
      }

      // Return wrapped object with metadata
      return { purls };
    } catch (cause: unknown) {
      throw new Error('Failed to generate PURLs', { cause });
    }
  }
}
