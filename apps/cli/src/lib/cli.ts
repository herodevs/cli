import * as yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { getCommands } from './get-commands';
import { ensureVersionIsUpToDate } from './ensure-version';

export function cli(): void {
  const commands = getCommands();

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const pkg = require('../../package.json');
  const packageName = pkg.name;
  const packageVersion = pkg.version;

  yargs
    .scriptName(packageName)
    .usage('Usage: $0 <command> [options]')
    .middleware(() => ensureVersionIsUpToDate(packageName, packageVersion))
    .command(commands)
    .parse(hideBin(process.argv));
}
