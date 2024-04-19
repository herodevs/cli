import { format } from 'date-fns';
import { Commit, getLastCommit } from 'git-last-commit';

export async function getGitCommit(): Promise<{
  hash: string;
  timestamp: string;
}> {
  const commit = await getLastCommitAsPromise();
  return {
    hash: commit.hash,
    timestamp: formatDate(getGitDate(commit.committedOn)),
  };
}

function getLastCommitAsPromise(): Promise<Commit> {
  return new Promise((resolve, reject) => {
    getLastCommit((err, commit) => {
      if (err) {
        reject(err);
      }
      resolve(commit);
    });
  });
}

function formatDate(date: Date): string {
  return format(date, 'yyyy-MM-dd-HH-mm-ss-SSS');
}

function getGitDate(date: string): Date {
  return new Date(+date * 1000);
}
