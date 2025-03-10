import { runCommand } from '@herodevs/utility';
import { addHours, addMinutes, addSeconds, format, formatISO, subMonths } from 'date-fns';
import { ArgumentsCamelCase, CommandBuilder, CommandModule } from 'yargs';
import { dateFormat, gitOutputFormat, monthsToSubtract } from './constants';
import { getCommitterCounts } from './get-committer-counts';
import { parseDateFlags } from './parse-date-flags';
import { parseGitLogEntries } from './parse-git-log-entries';
import {
  outputMonthlyCommitters,
  outputMonthlyCommittersJson,
  parseMonthly,
} from './parse-monthly';
import { CommitterCount } from './types';

interface Options {
  beforeDate: string;
  afterDate: string;
  exclude: string[];
  json: boolean;
  directory: string;
  monthly: boolean;
}

export const reportCommittersCommand: CommandModule<object, Options> = {
  command: 'committers',
  describe: 'show git committers',
  aliases: ['git'],
  builder: {
    beforeDate: {
      alias: 's',
      default: format(new Date(), dateFormat),
      describe: `End Date (format: ${dateFormat})`,
      string: true,
    },
    afterDate: {
      alias: 'e',
      describe: `Start Date (format: ${dateFormat})`,
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
    directory: {
      alias: 'd',
      describe: 'Directory to search',
      required: false,
      string: true,
    },
    monthly: {
      alias: 'm',
      boolean: true,
      describe: 'Break down by calendar month.',
      required: false,
      default: false,
    },
  } as CommandBuilder<unknown, Options>,
  handler: run,
};

async function run(args: ArgumentsCamelCase<Options>): Promise<void> {
  const { beforeDate, afterDate } = parseDateFlags(dateFormat, args.beforeDate, args.afterDate);
  const beforeDateEndOfDay = formatISO(addHours(addMinutes(addSeconds(beforeDate, 59), 59), 23));

  const ignores = args.exclude && args.exclude.length ? `-- . "!(${args.exclude.join('|')})"` : '';

  let gitCommand = `git log --since "${afterDate}" --until "${beforeDateEndOfDay}" --pretty=format:${gitOutputFormat} ${ignores}`;

  const cwd = args.directory;

  if (cwd) {
    // According to git documentation, the -- is used to separate the options from the pathspecs
    // https://git-scm.com/docs/git-log#Documentation/git-log.txt---ltpathgt82308203
    gitCommand = `${gitCommand} -- ${cwd}`;
  }

  const result = await runCommand(gitCommand);

  const rawEntries = (result as string).split('\n');
  if (rawEntries.length === 1 && rawEntries[0] === '') {
    const beforeDateStr = format(beforeDate, 'yyyy-MM-dd');
    const afterDateStr = format(afterDate, 'yyyy-MM-dd');
    console.log(`No commits found between ${afterDateStr} and ${beforeDateStr}`);
    return;
  }
  const entries = parseGitLogEntries(rawEntries);

  if (args.monthly) {
    const monthly = parseMonthly(afterDate, beforeDate, entries);
    if (args.json) {
      outputMonthlyCommittersJson(monthly);
      return;
    }
    outputMonthlyCommitters(monthly);
    return;
  }

  const committerCounts = getCommitterCounts(entries);
  if (args.json) {
    outputCommittersJson(committerCounts);
  } else {
    outputCommitters(committerCounts);
  }
}

function outputCommitters(committerCounts: CommitterCount[]) {
  console.table(
    committerCounts.map((c) => ({
      Committer: c.name,
      Commits: c.count,
      'Last Commit Date': c.lastCommitDate,
    }))
  );
}

function outputCommittersJson(committerCounts: CommitterCount[]) {
  console.log(JSON.stringify(committerCounts, null, 2));
}
