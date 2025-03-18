import assert from 'node:assert';
import { describe, it } from 'node:test';
import {
  calculateOverallStats,
  formatAsCsv,
  formatAsJson,
  formatAsText,
  formatMonthlyReport,
  formatOutputBasedOnFlag,
  formatOverallStats,
  groupCommitsByMonth,
  parseGitLogOutput,
} from '../../src/service/committers.svc.ts';

describe('committers', () => {
  // Sample test data to be reused across tests
  const sampleGitLog = `January|John Doe
February|Jane Smith
January|John Doe
February|Bob Johnson
March|Jane Smith
January|Alice Brown`;

  const sampleEntries = [
    { month: 'January', author: 'John Doe' },
    { month: 'February', author: 'Jane Smith' },
    { month: 'January', author: 'John Doe' },
    { month: 'February', author: 'Bob Johnson' },
    { month: 'March', author: 'Jane Smith' },
    { month: 'January', author: 'Alice Brown' },
  ];

  const sampleMonthlyData = {
    January: {
      'John Doe': 2,
      'Alice Brown': 1,
    },
    February: {
      'Jane Smith': 1,
      'Bob Johnson': 1,
    },
    March: {
      'Jane Smith': 1,
    },
  };

  const sampleOverallStats = {
    'John Doe': 2,
    'Jane Smith': 2,
    'Bob Johnson': 1,
    'Alice Brown': 1,
  };

  const sampleReportData = {
    monthly: {
      January: {
        'John Doe': 2,
        'Alice Brown': 1,
        total: 3,
      },
      February: {
        'Jane Smith': 1,
        'Bob Johnson': 1,
        total: 2,
      },
      March: {
        'Jane Smith': 1,
        total: 1,
      },
    },
    overall: {
      'John Doe': 2,
      'Jane Smith': 2,
      'Bob Johnson': 1,
      'Alice Brown': 1,
      total: 6,
    },
  };

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
      const quotedLog = `"January|John Doe"
"February|Jane Smith"`;

      const expected = [
        { month: 'January', author: 'John Doe' },
        { month: 'February', author: 'Jane Smith' },
      ];

      const result = parseGitLogOutput(quotedLog);

      assert.deepStrictEqual(result, expected);
    });
  });

  describe('groupCommitsByMonth', () => {
    it('should group commit entries by month', () => {
      const result = groupCommitsByMonth(sampleEntries);

      assert.deepStrictEqual(result, sampleMonthlyData);
    });

    it('should handle empty array', () => {
      const result = groupCommitsByMonth([]);

      assert.deepStrictEqual(result, {});
    });
  });

  describe('calculateOverallStats', () => {
    it('should calculate overall commit statistics by author', () => {
      const result = calculateOverallStats(sampleEntries);

      assert.deepStrictEqual(result, sampleOverallStats);
    });

    it('should handle empty array', () => {
      const result = calculateOverallStats([]);

      assert.deepStrictEqual(result, {});
    });
  });

  describe('formatMonthlyReport', () => {
    it('should format monthly report sections correctly', () => {
      const result = formatMonthlyReport(sampleMonthlyData);

      // Check for expected sections and content patterns
      assert.ok(result.includes('## January'));
      assert.ok(result.includes('## February'));
      assert.ok(result.includes('## March'));
      assert.ok(result.includes('     2  John Doe'));
      assert.ok(result.includes('     1  Alice Brown'));
      assert.ok(result.includes('     3  TOTAL'));
    });

    it('should sort months alphabetically', () => {
      // Create sample with unordered months
      const unorderedMonths = {
        March: { 'Jane Smith': 1 },
        January: { 'John Doe': 2 },
        February: { 'Bob Johnson': 1 },
      };

      const result = formatMonthlyReport(unorderedMonths);
      const lines = result.split('\n');

      // Find the actual order of month headings in the output
      const monthLines = lines.filter((line) => line.startsWith('## '));
      const months = monthLines.map((line) => line.substring(3).trim());

      // Check correct order
      assert.strictEqual(months[0], 'February');
      assert.strictEqual(months[1], 'January');
      assert.strictEqual(months[2], 'March');
    });

    it('should sort authors by commit count', () => {
      const result = formatMonthlyReport({
        January: {
          'John Doe': 2,
          'Alice Brown': 1,
        },
      });

      const lines = result.split('\n');

      // Find the lines containing the authors within the January section
      const johnDoeLine = lines.find((line) => line.includes('John Doe'));
      const aliceBrownLine = lines.find((line) => line.includes('Alice Brown'));

      if (!johnDoeLine) {
        assert.fail('Could not find expected lines in output: John Doe missing');
      } else if (!aliceBrownLine) {
        assert.fail('Could not find expected lines in output:Alice Brown missing');
      } else {
        // Find their positions in the array
        const johnDoeIndex = lines.indexOf(johnDoeLine);
        const aliceBrownIndex = lines.indexOf(aliceBrownLine);

        // John Doe should come before Alice Brown due to higher commit count
        assert.ok(johnDoeIndex >= 0, 'John Doe line not found');
        assert.ok(aliceBrownIndex >= 0, 'Alice Brown line not found');
        assert.ok(johnDoeIndex < aliceBrownIndex, 'John Doe line should appear before Alice Brown line');
      }
    });
  });

  describe('formatOverallStats', () => {
    it('should format overall statistics section correctly', () => {
      const grandTotal = 6; // Sum of all commits
      const result = formatOverallStats(sampleOverallStats, grandTotal);

      assert.ok(result.includes('## Overall Statistics'));
      assert.ok(result.includes('     2  John Doe'));
      assert.ok(result.includes('     2  Jane Smith'));
      assert.ok(result.includes('     1  Bob Johnson'));
      assert.ok(result.includes('     1  Alice Brown'));
      assert.ok(result.includes('     6  GRAND TOTAL'));
    });

    it('should sort authors by commit count', () => {
      const grandTotal = 6;
      const result = formatOverallStats(sampleOverallStats, grandTotal);

      const lines = result.split('\n');

      // Find lines with John Doe and Bob Johnson
      const johnDoeLine = lines.find((line) => line.includes('John Doe'));
      const bobJohnsonLine = lines.find((line) => line.includes('Bob Johnson'));

      // Find their positions in the array
      if (!johnDoeLine) {
        assert.fail('Could not find expected lines in output: John Doe missing');
      } else if (!bobJohnsonLine) {
        assert.fail('Could not find expected lines in output:Bob Johnson missing');
      } else {
        const johnDoeIndex = lines.indexOf(johnDoeLine);
        const bobJohnsonIndex = lines.indexOf(bobJohnsonLine);

        assert.ok(johnDoeIndex >= 0, 'John Doe line not found');
        assert.ok(bobJohnsonIndex >= 0, 'Bob Johnson line not found');
        assert.ok(johnDoeIndex < bobJohnsonIndex, 'John Doe line should appear before Bob Johnson line');
      }
    });
  });

  describe('formatAsCsv', () => {
    it('should format report data as CSV', () => {
      const result = formatAsCsv(sampleReportData);

      // Check that output is a string and contains expected header
      assert.strictEqual(typeof result, 'string');
      assert.ok(result.startsWith('Month,'));

      // Check that all months are included
      assert.ok(result.includes('\nJanuary,'));
      assert.ok(result.includes('\nFebruary,'));
      assert.ok(result.includes('\nMarch,'));
      assert.ok(result.includes('\nOverall,'));

      // Check that columns are correctly ordered and total is included
      const lines = result.split('\n');
      assert.ok(lines[0].endsWith(',Total'));

      // Check that values are included properly
      const januaryLine = lines.find((line) => line.startsWith('January'));
      if (januaryLine) {
        assert.ok(januaryLine.includes(',2,') && januaryLine.includes(',3'));
      } else {
        assert.fail('Cannot find January line');
      }
    });

    it('should handle empty data', () => {
      const emptyData = {
        monthly: {},
        overall: { total: 0 },
      };

      const result = formatAsCsv(emptyData);

      assert.strictEqual(typeof result, 'string');
      assert.ok(result.startsWith('Month,'));
      assert.ok(result.includes('Overall'));
    });
  });

  describe('formatAsText', () => {
    it('should format report data as text', () => {
      const result = formatAsText(sampleReportData);

      // Check for expected sections and formatting
      assert.ok(result.includes('Monthly Commit Report'));
      assert.ok(result.includes('## January'));
      assert.ok(result.includes('## February'));
      assert.ok(result.includes('## March'));
      assert.ok(result.includes('## Overall Statistics'));

      // Check for correct counts and totals
      assert.ok(result.includes('     2  John Doe'));
      assert.ok(result.includes('     3  TOTAL')); // January total
      assert.ok(result.includes('     6  GRAND TOTAL'));
    });

    it('should sort authors by commit count within each section', () => {
      const result = formatAsText(sampleReportData);

      const lines = result.split('\n');

      // Find the January section boundaries
      const januarySectionStart = lines.findIndex((line) => line === '## January');
      const nextSectionStart = lines.findIndex((line, index) => index > januarySectionStart && line.startsWith('## '));

      // Extract just the January section lines
      const januarySectionLines = lines.slice(januarySectionStart, nextSectionStart);

      // Find the lines for John Doe and Alice Brown within this section
      const johnDoeLine = januarySectionLines.find((line) => line.includes('John Doe'));
      const aliceBrownLine = januarySectionLines.find((line) => line.includes('Alice Brown'));

      if (!johnDoeLine) {
        assert.fail('Could not find expected lines in output: John Doe missing');
      } else if (!aliceBrownLine) {
        assert.fail('Could not find expected lines in output:Alice Brown missing');
      } else {
        // Get their positions within the January section array
        const johnDoeIndex = januarySectionLines.indexOf(johnDoeLine);
        const aliceBrownIndex = januarySectionLines.indexOf(aliceBrownLine);

        assert.ok(johnDoeIndex >= 0, 'John Doe line not found in January section');
        assert.ok(aliceBrownIndex >= 0, 'Alice Brown line not found in January section');
        assert.ok(johnDoeIndex < aliceBrownIndex, 'John Doe line should appear before Alice Brown line');
      }
    });
  });

  describe('formatAsJson', () => {
    it('should format report data as JSON', () => {
      const result = formatAsJson(sampleReportData);

      // Check output is a valid JSON string
      const parsedResult = JSON.parse(result);
      assert.deepStrictEqual(parsedResult, sampleReportData);

      // Check that output is properly indented
      assert.ok(result.includes('  "monthly": {'));
      assert.ok(result.includes('    "January": {'));
    });
  });

  describe('formatOutputBasedOnFlag', () => {
    it('should format as JSON when json flag is provided', () => {
      const result = formatOutputBasedOnFlag('json', sampleReportData);

      // Verify result is valid JSON
      const parsedResult = JSON.parse(result);
      assert.deepStrictEqual(parsedResult, sampleReportData);
    });

    it('should format as CSV when csv flag is provided', () => {
      const result = formatOutputBasedOnFlag('csv', sampleReportData);

      assert.strictEqual(typeof result, 'string');
      assert.ok(result.startsWith('Month,'));
    });

    it('should format as text when any other flag is provided', () => {
      const result = formatOutputBasedOnFlag('text', sampleReportData);

      assert.ok(result.includes('Monthly Commit Report'));
      assert.ok(result.includes('## January'));
    });
  });
});
