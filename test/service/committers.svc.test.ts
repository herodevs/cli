import assert from 'node:assert';
import { describe, it } from 'node:test';
import {
  generateCommittersReport,
  generateMonthlyReport,
  parseGitLogOutput,
} from '../../src/service/committers.svc.ts';

describe('committers', () => {
  // Sample test data to be reused across tests
  const sampleGitLog = `9382084093|John Doe|2025-08-19
9382084093|Jane Smith|2025-08-19
9382084093|John Doe|2025-08-19
9382084093|Bob Johnson|2025-08-19
9382084093|Jane Smith|2025-08-19
9382084093|Alice Brown|2025-08-19`;

  const sampleEntries = [
    {
      author: 'John Doe',
      commitHash: '9382084093',
      monthGroup: 'August 2025',
      date: new Date('2025-08-19T00:00:00.000Z'),
    },
    {
      author: 'Jane Smith',
      commitHash: '9382084093',
      monthGroup: 'August 2025',
      date: new Date('2025-08-19T00:00:00.000Z'),
    },
    {
      author: 'John Doe',
      commitHash: '9382084093',
      monthGroup: 'August 2025',
      date: new Date('2025-08-19T00:00:00.000Z'),
    },
    {
      author: 'Bob Johnson',
      commitHash: '9382084093',
      monthGroup: 'August 2025',
      date: new Date('2025-08-19T00:00:00.000Z'),
    },
    {
      author: 'Jane Smith',
      commitHash: '9382084093',
      monthGroup: 'August 2025',
      date: new Date('2025-08-19T00:00:00.000Z'),
    },
    {
      author: 'Alice Brown',
      commitHash: '9382084093',
      monthGroup: 'August 2025',
      date: new Date('2025-08-19T00:00:00.000Z'),
    },
  ];

  const sampleAuthorReport: unknown[] = [
    {
      author: 'John Doe',
      commits: [
        {
          author: 'John Doe',
          commitHash: '9382084093',
          date: new Date('2025-08-19T00:00:00.000Z'),
          monthGroup: 'August 2025',
        },
        {
          author: 'John Doe',
          commitHash: '9382084093',
          date: new Date('2025-08-19T00:00:00.000Z'),
          monthGroup: 'August 2025',
        },
      ],
      lastCommitOn: new Date('2025-08-19T00:00:00.000Z'),
    },
    {
      author: 'Jane Smith',
      commits: [
        {
          author: 'Jane Smith',
          commitHash: '9382084093',
          date: new Date('2025-08-19T00:00:00.000Z'),
          monthGroup: 'August 2025',
        },
        {
          author: 'Jane Smith',
          commitHash: '9382084093',
          date: new Date('2025-08-19T00:00:00.000Z'),
          monthGroup: 'August 2025',
        },
      ],
      lastCommitOn: new Date('2025-08-19T00:00:00.000Z'),
    },
    {
      author: 'Bob Johnson',
      commits: [
        {
          author: 'Bob Johnson',
          commitHash: '9382084093',
          date: new Date('2025-08-19T00:00:00.000Z'),
          monthGroup: 'August 2025',
        },
      ],
      lastCommitOn: new Date('2025-08-19T00:00:00.000Z'),
    },
    {
      author: 'Alice Brown',
      commits: [
        {
          author: 'Alice Brown',
          commitHash: '9382084093',
          date: new Date('2025-08-19T00:00:00.000Z'),
          monthGroup: 'August 2025',
        },
      ],
      lastCommitOn: new Date('2025-08-19T00:00:00.000Z'),
    },
  ];
  const sampleMonthlyReport: unknown[] = [
    {
      month: 'August 2025',
      start: '2025-08-18',
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
          date: new Date('2025-08-19T00:00:00.000Z'),
        },
        {
          author: 'Jane Smith',
          commitHash: '9382084093',
          monthGroup: 'August 2025',
          date: new Date('2025-08-19T00:00:00.000Z'),
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
