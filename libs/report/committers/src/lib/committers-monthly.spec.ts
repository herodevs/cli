import { parseMonthly } from './parse-monthly';

describe('parseMonthly', () => {
  const sampleCommits = [
    {
      date: new Date('2023-01-15T12:00:00Z'),
      committer: 'Marco',
      commitHash: 'abc123',
    },
    {
      date: new Date('2023-01-20T12:00:00Z'),
      committer: 'Marco',
      commitHash: 'def456',
    },
    {
      date: new Date('2023-02-10T12:00:00Z'),
      committer: 'George',
      commitHash: 'ghi789',
    },
    {
      date: new Date('2023-02-15T12:00:00Z'),
      committer: 'Marco',
      commitHash: 'jkl012',
    },
  ];

  it('should group commits by month and count them per committer', () => {
    const start = new Date('2023-01-01T00:00:00Z');
    const end = new Date('2023-03-01T00:00:00Z');
    const result = parseMonthly(start, end, sampleCommits);

    expect(result).toEqual([
      {
        month: 'January 2023',
        start: new Date('2022-12-31T23:00:00.000Z'), // Start of January
        end: new Date('2023-01-31T23:00:00.000Z'), // End of January
        committers: {
          Marco: 2,
        },
      },
      {
        month: 'February 2023',
        start: new Date('2023-01-31T23:00:00.000Z'), // Start of February
        end: new Date('2023-02-28T23:00:00.000Z'), // End of February
        committers: {
          George: 1,
          Marco: 1,
        },
      },
    ]);
  });

  it('should return an empty array if there are no commits', () => {
    const result = parseMonthly(
      new Date('2023-01-01T00:00:00Z'),
      new Date('2023-03-01T00:00:00Z'),
      []
    );
    expect(result).toEqual([]);
  });

  it('should handle date ranges with no commits in certain months', () => {
    const commits = [
      {
        date: new Date('2023-03-10T12:00:00Z'),
        committer: 'Greg',
        commitHash: 'mno345',
      },
    ];
    const start = new Date('2023-01-01T00:00:00Z');
    const end = new Date('2023-04-01T00:00:00Z');
    const result = parseMonthly(start, end, commits);

    expect(result).toEqual([
      {
        month: 'March 2023',
        start: new Date('2023-02-28T23:00:00.000Z'), // Start of March
        end: new Date('2023-03-31T22:00:00.000Z'), // End of March
        committers: {
          Greg: 1,
        },
      },
    ]);
  });

  it('should handle an empty date range', () => {
    const result = parseMonthly(
      new Date('2023-01-01T00:00:00Z'),
      new Date('2023-01-01T00:00:00Z'),
      sampleCommits
    );
    expect(result).toEqual([]);
  });
});
