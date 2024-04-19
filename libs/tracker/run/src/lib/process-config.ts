import { Config, ProcessResult } from '@herodevs/tracker-shared';
import { processCategory } from './process-category';
import { getGitCommit } from './get-git-commit';

export async function processConfig(
  config: Config,
  rootDirectory: string
): Promise<ProcessResult> {
  console.log(`Starting...`);
  const categoryResults = Object.entries(config.categories).map(
    ([name, category]) =>
      processCategory(
        rootDirectory,
        { ...category, name },
        config.ignorePatterns || []
      )
  );
  const commit = await getGitCommit();
  return {
    timestamp: commit.timestamp,
    hash: commit.hash,
    categories: categoryResults,
  };
}
