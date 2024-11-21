import { getLastCommitDatePerUser } from './get-committer-counts';
import { type Commit } from './types';

describe('getLastCommitDatePerUser', () => {
    test('returns the latest commit date for each committer', () => {
        const commits: Commit[] = [
            { commitHash: 'abc123', committer: 'Marco', date: new Date('2024-11-20T12:00:00.000Z') },
            { commitHash: 'def456', committer: 'Greg', date: new Date('2024-11-19T12:00:00.000Z') },
            { commitHash: 'ghi789', committer: 'Marco', date: new Date('2024-11-21T12:00:00.000Z') },
        ];

        const result = getLastCommitDatePerUser(commits);
        expect(result).toMatchObject({
          Greg: '11/19/2024, 12:00:00 PM',
          Marco: '11/21/2024, 12:00:00 PM',
        });
    });

    test('handles a single committer with multiple commits', () => {
      const commits = [
        { commitHash: 'abc123', committer: 'Marco', date: new Date('2024-11-20T12:00:00.000Z') },
        { commitHash: 'def456', committer: 'Marco', date: new Date('2024-11-21T12:00:00.000Z') },
        { commitHash: 'ghi789', committer: 'Marco', date: new Date('2024-11-19T12:00:00.000Z') },
      ];

      const result = getLastCommitDatePerUser(commits);

      expect(result).toMatchObject({
        Marco: '11/21/2024, 12:00:00 PM',
      });
    });

    test('returns an empty object when there are no commits', () => {
      const commits: Commit[] = [];

      const result = getLastCommitDatePerUser(commits);

      expect(result).toEqual({});
    });

    test('handles multiple committers with no overlap', () => {
      const commits = [
        { commitHash: 'abc123', committer: 'Marco', date: new Date('2024-11-20T12:00:00.000Z') },
        { commitHash: 'def456', committer: 'Greg', date: new Date('2024-11-19T12:00:00.000Z') },
      ];

      const result = getLastCommitDatePerUser(commits);

      expect(result).toMatchObject({
        Marco: '11/20/2024, 12:00:00 PM',
        Greg: '11/19/2024, 12:00:00 PM',
      });
    });

    test('ignores commits with invalid dates', () => {
      const commits = [
        { commitHash: 'abc123', committer: 'Marco', date: new Date('Invalid date') },
        { commitHash: 'def456', committer: 'Marco', date: new Date('2024-11-21T12:00:00.000Z') },
      ];

      const result = getLastCommitDatePerUser(commits);

      expect(result).toEqual({
        Marco: '11/21/2024, 12:00:00 PM',
      });
    });
});
