import { addHours, addMinutes, addSeconds, format, formatISO, subMonths } from 'date-fns';
import { runCommand } from '@herodevs/utility';
import { parseDateFlags } from './parse-date-flags';
import { dateFormat, gitOutputFormat, monthsToSubtract } from './constants';
import { parseGitLogEntries } from './parse-git-log-entries';
import { getCommitterCounts } from './get-committer-counts';
import { ArgumentsCamelCase, CommandBuilder, CommandModule } from 'yargs';
import { CommitterCount } from './types';

interface Options {
  beforeDate: string;
  afterDate: string;
  exclude: string[];
  json: boolean;
  // monthly: boolean;
}

export const reportCommittersCommand: CommandModule<object, Options> = {
  command: 'committers',
  describe: 'show git committers',
  aliases: ['git'],
  builder: {
    beforeDate: {
      alias: 's',
      default: format(new Date(), dateFormat),
      describe: `Start Date (format: ${dateFormat})`,
      string: true,
    },
    afterDate: {
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
    json: {
      describe: 'Output to JSON format',
      required: false,
      default: false,
      boolean: true,
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
  const { beforeDate, afterDate } = parseDateFlags(dateFormat, args.beforeDate, args.afterDate);
  const beforeDateEndOfDay = formatISO(addHours(addMinutes(addSeconds(beforeDate, 59), 59), 23));

  const ignores = args.exclude && args.exclude.length ? `-- . "!(${args.exclude.join('|')})"` : '';

  const gitCommand = `git log --since "${afterDate}" --until "${beforeDateEndOfDay}" --pretty=format:${gitOutputFormat} ${ignores}`;

  const result = await runCommand(gitCommand);

  const rawEntries = (result as string).split('\n');
  if (rawEntries.length === 1 && rawEntries[0] === '') {
    const beforeDateStr = format(beforeDate, 'yyyy-MM-dd');
    const afterDateStr = format(afterDate, 'yyyy-MM-dd');
    console.log(`No commits found between ${afterDateStr} and ${beforeDateStr}`);
    return;
  }
  const entries = parseGitLogEntries(rawEntries);
  const committerCounts = getCommitterCounts(entries);
  if (args.json) {
    outputCommittersJson(committerCounts);
  } else {
    outputCommitters(committerCounts);
  }
}

function outputCommitters(committerCounts: CommitterCount[]) {
  console.table(committerCounts.map((c) => ({ Committer: c.name, Commits: c.count, 'Last Commit': c.lastCommit })));
}

function outputCommittersJson(committerCounts: CommitterCount[]) {
  console.log(JSON.stringify(committerCounts, null, 2));
}
