import { format, parse } from 'date-fns';
import { dateFormat } from './constants';
import { outputMonthlyCommitters, parseMonthly } from './parse-monthly';
import { MonthlyData } from './types';

describe('parseMonthly', () => {
  // Helper to create date objects that represent the date of the provided date string in the
  // current user's timezone.
  const newDate = (dateStr: string) => parse(dateStr, dateFormat, new Date());

  const sampleCommits = [
    {
      date: newDate('2023-01-15'),
      committer: 'Marco',
      commitHash: 'abc123',
    },
    {
      date: newDate('2023-01-20'),
      committer: 'Marco',
      commitHash: 'def456',
    },
    {
      date: newDate('2023-02-10'),
      committer: 'George',
      commitHash: 'ghi789',
    },
    {
      date: newDate('2023-02-15'),
      committer: 'Marco',
      commitHash: 'jkl012',
    },
  ];

  it('should group commits by month and count them per committer', () => {
    const start = newDate('2023-01-01');
    const end = newDate('2023-03-01');
    const result = parseMonthly(start, end, sampleCommits);

    expect(result).toEqual([
      {
        month: 'January 2023',
        start: newDate('2023-01-01'),
        end: newDate('2023-02-01'),
        committers: {
          Marco: 2,
        },
      },
      {
        month: 'February 2023',
        start: newDate('2023-02-01'),
        end: newDate('2023-03-01'),
        committers: {
          George: 1,
          Marco: 1,
        },
      },
    ]);
  });

  it('should return an empty array if there are no commits', () => {
    const result = parseMonthly(
      newDate('2023-01-01'),
      newDate('2023-03-01'),
      []
    );
    expect(result).toEqual([]);
  });

  it('should handle date ranges with no commits in certain months', () => {
    const commits = [
      {
        date: newDate('2023-03-10'),
        committer: 'Greg',
        commitHash: 'mno345',
      },
    ];
    const start = newDate('2023-01-01');
    const end = newDate('2023-04-01');
    const result = parseMonthly(start, end, commits);

    expect(result).toEqual([
      {
        month: 'March 2023',
        start: newDate('2023-03-01'),
        end: newDate('2023-04-01'),
        committers: {
          Greg: 1,
        },
      },
    ]);
  });

  it('should handle an empty date range', () => {
    const result = parseMonthly(
      newDate('2023-01-01'),
      newDate('2023-01-01'),
      sampleCommits
    );
    expect(result).toEqual([]);
  });
});

describe('outputMonthlyCommitters', () => {
  const consoleTableSpy = jest.spyOn(console, 'table').mockImplementation();

  afterEach(() => {
    consoleTableSpy.mockClear();
  });

  afterAll(() => {
    consoleTableSpy.mockRestore();
  });

  it('should format and display the monthly commit data correctly', () => {
    const exampleCommits = [
      {
        month: 'January 2024',
        start: new Date('2024-01-01'),
        end: new Date('2024-01-31'),
        committers: {
          Marco: 5,
          George: 3,
        },
      },
      {
        month: 'February 2024',
        start: new Date('2024-02-01'),
        end: new Date('2024-02-28'),
        committers: {
          Greg: 7,
        },
      },
    ] as MonthlyData[];

    const expectedOutput = [
      {
        month: 'January 2024',
        start: format(new Date('2024-01-01'), 'yyyy-MM-dd'),
        end: format(new Date('2024-01-31'), 'yyyy-MM-dd'),
        totalCommits: 8,
      },
      {
        month: 'February 2024',
        start: format(new Date('2024-02-01'), 'yyyy-MM-dd'),
        end: format(new Date('2024-02-28'), 'yyyy-MM-dd'),
        totalCommits: 7,
      },
    ];

    outputMonthlyCommitters(exampleCommits);
    expect(consoleTableSpy).toHaveBeenCalledTimes(1);
    expect(consoleTableSpy).toHaveBeenCalledWith(expectedOutput);
  });
});
