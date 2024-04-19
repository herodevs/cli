import { checkbox, confirm } from '@inquirer/prompts';
import { runCommand } from '@herodevs/utility';
import { getPackageJsonSection } from './get-package-json-section';
import { getFileContents } from './get-file-contents';
import { getDiagnosticTypes } from './get-diagnostic-types';
import { ArgumentsCamelCase, CommandBuilder, CommandModule } from 'yargs';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface Options {}

export const reportDiagnosticsCommand: CommandModule<object, Options> = {
  command: 'diagnostics',
  describe: 'show diagnostic information',
  aliases: ['diag', 'd'],
  builder: {} as CommandBuilder<unknown, Options>,
  handler: run,
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function run(args: ArgumentsCamelCase<Options>): Promise<void> {
  const answer = await confirm({
    message:
      'Data produced by the command may contain sensitive data, please review before sharing it. Continue?',
  });
  if (!answer) {
    return;
  }

  const diagTypeList = getDiagnosticTypes().map((d) => ({
    ...d,
    checked: true,
  }));

  const diagTypes = await checkbox({
    message: 'select diagnostic(s) to run',
    choices: diagTypeList,
    required: true,
    pageSize: diagTypeList.length,
  });

  for (let i = 0; i < diagTypes.length; i++) {
    let output = '';
    let title = '';
    switch (diagTypes[i]) {
      case 'dependencies':
        title = 'Package JSON - dependencies';
        output = getPackageJsonSection('dependencies');
        break;
      case 'devDependencies':
        title = 'Package JSON - devDependencies';
        output = getPackageJsonSection('devDependencies');
        break;
      case 'overrides':
        title = 'Package JSON - overrides';
        output = getPackageJsonSection('overrides');
        break;
      case 'npmrc':
        title = '.npmrc file contents';
        output = getFileContents('.npmrc');
        break;
      case 'npm config':
        try {
          title = 'npm config results';
          output = await runCommand('npm config get');
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (e: any) {
          output = e.stderr;
        }
        break;
      case 'npm ls':
        title = 'npm ls results';
        output = await runCommand('npm ls --depth=1000');
        break;
    }
    const titleMsg = `*** ${title} ***`;
    const titleWrapper = '*'.repeat(titleMsg.length);
    console.log(`${titleWrapper}\n${titleMsg}\n${titleWrapper}\n${output}\n`);
  }
}
