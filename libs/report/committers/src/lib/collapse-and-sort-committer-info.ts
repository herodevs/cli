import { parseGitLogEntries } from './parse-git-log-entries';
import { parseMonthly } from './parse-monthly';
import { SortedCommitterInfo } from './types';

export function collapseAndSortCommitterInfo(
  startDate: Date,
  endDate: Date,
  rawEntries: string[]
): SortedCommitterInfo {
  return undefined as any;
  /*
  const entries = parseGitLogEntries(rawEntries);
  const committerHash = {} as any;
  for (let i = 0; i < entries.length; i++) {
    committerHash[entries[i].committer] =
      committerHash[entries[i].committer] || [];
    committerHash[entries[i].committer].push(
      [entries[i].commitHash, entries[i].date].join(' ')
    );
  }

  const sortable = [] as { name: string; commits: string[] }[];
  Object.keys(committerHash).forEach((name) => {
    sortable.push({ name, commits: committerHash[name] });
  });

  const committers = sortable.sort((a, b) => {
    return b.commits.length - a.commits.length;
  });

  const monthly = parseMonthly(startDate, endDate, entries);
  return { committers, monthly };
  */
}
