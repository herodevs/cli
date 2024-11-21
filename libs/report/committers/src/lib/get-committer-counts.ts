import { type Commit, type CommitterCount, type CommitterLastCommitDate } from './types';

export function getCommitterCounts(entries: Commit[]): CommitterCount[] {
  const lastCommits = getLastCommitDatePerUser(entries);
  const counts = new Map<string, CommitterCount>();

  for (const { committer } of entries) {
    if (!counts.has(committer)) {
      counts.set(committer, {
        name: committer,
        count: 0,
        lastCommitDate: lastCommits[committer] ?? '',
      });
    }
    counts.get(committer)!.count++;
  }

  return Array.from(counts.values()).sort((a, b) => b.count - a.count);
}

export function getLastCommitDatePerUser(entries: Commit[]): CommitterLastCommitDate {
  const lastCommitDates: CommitterLastCommitDate = {};

  for (const { committer, date } of entries) {
    if (Number.isNaN(date.getTime())) continue;

    const currentTimestamp = date.getTime();

    if (!lastCommitDates[committer] || currentTimestamp > Date.parse(lastCommitDates[committer])) {
      lastCommitDates[committer] = date.toLocaleString('en-US', { timeZone: 'UTC' });
    }
  }
  return lastCommitDates;
}
