import { gammaDelimiter } from './constants';
import { Commit } from './types';

export function parseGitLogEntries(entries: string[]): Commit[] {
  return entries.map((entry) => {
    const [commitHash, committer, date] = entry.split(gammaDelimiter);
    return { commitHash, committer, date: new Date(date) } as Commit;
  });
}
