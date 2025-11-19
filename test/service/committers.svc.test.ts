import { formatDate } from 'date-fns';
import assert from 'node:assert';
import { describe, it } from 'node:test';
import {
  type AuthorReportRow,
  generateCommittersReport,
  generateMonthlyReport,
  type MonthlyReportRow,
  parseGitLogOutput,
} from '../../src/service/committers.svc.ts';
import { parseDate } from '../../src/utils/date-parsers.ts';

describe('committers', () => {
  // Sample test data to be reused across tests
  const sampleGitLog = `9382084093|John Doe|2025-08-19
9382084093|Jane Smith|2025-08-19
9382084093|John Doe|2025-08-19
9382084093|Bob Johnson|2025-08-19
9382084093|Jane Smith|2025-08-19
9382084093|Alice Brown|2025-08-19`;

  const sampleDate = parseDate(formatDate(new Date('2025-08-19'), 'yyyy-MM-dd'));
  const initialDate = formatDate(new Date('2025-08-19'), 'yyyy-MM-dd');

  const sampleEntries = [
    {
      author: 'John Doe',
      commitHash: '9382084093',
      monthGroup: 'August 2025',
      date: sampleDate,
    },
    {
      author: 'Jane Smith',
      commitHash: '9382084093',
      monthGroup: 'August 2025',
      date: sampleDate,
    },
    {
      author: 'John Doe',
      commitHash: '9382084093',
      monthGroup: 'August 2025',
      date: sampleDate,
    },
    {
      author: 'Bob Johnson',
      commitHash: '9382084093',
      monthGroup: 'August 2025',
      date: sampleDate,
    },
    {
      author: 'Jane Smith',
      commitHash: '9382084093',
      monthGroup: 'August 2025',
      date: sampleDate,
    },
    {
      author: 'Alice Brown',
      commitHash: '9382084093',
      monthGroup: 'August 2025',
      date: sampleDate,
    },
  ];

  const sampleAuthorReport: AuthorReportRow[] = [
    {
      author: 'John Doe',
      commits: [
        {
          author: 'John Doe',
          commitHash: '9382084093',
          date: sampleDate,
          monthGroup: 'August 2025',
        },
        {
          author: 'John Doe',
          commitHash: '9382084093',
          date: sampleDate,
          monthGroup: 'August 2025',
        },
      ],
      lastCommitOn: sampleDate,
    },
    {
      author: 'Jane Smith',
      commits: [
        {
          author: 'Jane Smith',
          commitHash: '9382084093',
          date: sampleDate,
          monthGroup: 'August 2025',
        },
        {
          author: 'Jane Smith',
          commitHash: '9382084093',
          date: sampleDate,
          monthGroup: 'August 2025',
        },
      ],
      lastCommitOn: sampleDate,
    },
    {
      author: 'Bob Johnson',
      commits: [
        {
          author: 'Bob Johnson',
          commitHash: '9382084093',
          date: sampleDate,
          monthGroup: 'August 2025',
        },
      ],
      lastCommitOn: sampleDate,
    },
    {
      author: 'Alice Brown',
      commits: [
        {
          author: 'Alice Brown',
          commitHash: '9382084093',
          date: sampleDate,
          monthGroup: 'August 2025',
        },
      ],
      lastCommitOn: sampleDate,
    },
  ];
  const sampleMonthlyReport: MonthlyReportRow[] = [
    {
      month: 'August 2025',
      start: initialDate,
      end: '2025-08-31',
      totalCommits: 6,
      committers: {
        'John Doe': 2,
        'Jane Smith': 2,
        'Bob Johnson': 1,
        'Alice Brown': 1,
      },
    },
  ];

  describe('parseGitLogOutput', () => {
    it('should parse git log output into commit entries', () => {
      const result = parseGitLogOutput(sampleGitLog);

      assert.deepStrictEqual(result, sampleEntries);
    });

    it('should handle empty input', () => {
      const result = parseGitLogOutput('');

      assert.deepStrictEqual(result, []);
    });

    it('should handle quoted input', () => {
      const quotedLog = `"9382084093|John Doe|2025-08-19"
"9382084093|Jane Smith|2025-08-19"`;

      const expected = [
        {
          author: 'John Doe',
          commitHash: '9382084093',
          monthGroup: 'August 2025',
          date: sampleDate,
        },
        {
          author: 'Jane Smith',
          commitHash: '9382084093',
          monthGroup: 'August 2025',
          date: sampleDate,
        },
      ];

      const result = parseGitLogOutput(quotedLog);

      assert.deepStrictEqual(result, expected);
    });
  });

  describe('generateCommittersReport', () => {
    it('should generate the committers report from a git log input', () => {
      const result = generateCommittersReport(sampleEntries);

      assert.deepStrictEqual(result, sampleAuthorReport);
    });

    it('should not fail if the git log input is empty', () => {
      const result = generateCommittersReport([]);

      assert.deepStrictEqual(result, []);
    });
  });

  describe('generateMonthlyReport', () => {
    it('should generate the monthly report from a git log input', () => {
      const result = generateMonthlyReport(sampleEntries);

      assert.deepStrictEqual(result, sampleMonthlyReport);
    });

    it('should not fail if the git log input is empty', () => {
      const result = generateMonthlyReport([]);

      assert.deepStrictEqual(result, []);
    });
  });
});
