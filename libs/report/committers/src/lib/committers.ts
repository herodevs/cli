import { format, subMonths } from 'date-fns';
import { runCommand } from '@herodevs/utility';
import { parseDateFlags } from './parse-date-flags';
import { dateFormat, gitOutputFormat, monthsToSubtract } from './constants';
import { parseGitLogEntries } from './parse-git-log-entries';
import { getCommitterCounts } from './get-committer-counts';
import { ArgumentsCamelCase, CommandBuilder, CommandModule } from 'yargs';
import { CommitterCount } from './types';

interface Options {
  startDate: string;
  endDate: string;
  exclude: string[];
  // monthly: boolean;
}

export const reportCommittersCommand: CommandModule<object, Options> = {
  command: 'committers',
  describe: 'show git committers',
  aliases: [],
  builder: {
    startDate: {
      alias: 's',
      default: format(new Date(), dateFormat),
      describe: `Start Date (format: ${dateFormat})`,
      string: true,
    },
    endDate: {
      alias: 'e',
      describe: `End Date (format: ${dateFormat})`,
      required: false,
      default: format(subMonths(new Date(), monthsToSubtract), dateFormat),
    },
    exclude: {
      alias: 'x',
      array: true,
      describe: 'Path Exclusions (eg -x="./src/bin" -x="./dist")',
      required: false,
    },
    // monthly: {
    //   alias: 'm',
    //   describe:
    //     'Break down by calendar month, rather than by committer.  (eg -m)',
    //   required: false,
    //   default: false,
    // },
  } as CommandBuilder<unknown, Options>,
  handler: run,
};

async function run(args: ArgumentsCamelCase<Options>): Promise<void> {
  const { startDate, endDate } = parseDateFlags(dateFormat, args.startDate, args.endDate);
  const ignores = args.exclude && args.exclude.length ? `-- . "!(${args.exclude.join('|')})"` : '';
  const gitCommand = `git log --since "${endDate}" --until "${startDate}" --pretty=format:${gitOutputFormat} ${ignores}`;
  const result = await runCommand(gitCommand);

  const rawEntries = (result as string).split('\n');

  // const { committers, monthly } = collapseAndSortCommitterInfo(startDate, endDate, rawEntries);
  // if( args.monthly ){
  //   printMonthly(monthly);
  //   return;
  // }else{
  //   printCommitters(committers);
  //   return;
  // }
  if (rawEntries.length === 1 && rawEntries[0] === '') {
    const startDateStr = format(startDate, 'yyyy-MM-dd');
    const endDateStr = format(endDate, 'yyyy-MM-dd');
    console.log(`No commits found between ${endDateStr} and ${startDateStr}`);
    return;
  }
  const entries = parseGitLogEntries(rawEntries);
  console.error(`entries: ${JSON.stringify(entries, null, 2)}`);
  const committerCounts = getCommitterCounts(entries);
  outputCommitters(committerCounts);
}

function outputCommitters(committerCounts: CommitterCount[]) {
  const longestNameLength = committerCounts.reduce((acc, c) => {
    return c.name.length > acc ? c.name.length : acc;
  }, 'Committer'.length);

  const header = `Committer${' '.repeat(longestNameLength - 9)} | Commits`;
  console.log(header);
  console.log(
    header
      .split('')
      .map((c) => (c === '|' ? '|' : '-'))
      .join('')
  );

  console.log(
    committerCounts
      .map((c) => {
        const committer = `${c.name}${' '.repeat(longestNameLength - c.name.length)}`;
        const count = ' '.repeat(7 - c.count.toString().length) + c.count;
        return `${committer} | ${count}`;
      })
      .join('\n')
  );
}
