import assert from 'node:assert';
import { describe, it } from 'node:test';
import { config } from '../../src/config/constants.ts';
import {
  convertComponentToTableRow,
  createTableForStatus,
  groupComponentsByStatus,
  truncateString,
} from '../../src/ui/eol.ui.ts';
import { createMockComponent, createMockScan } from '../utils/mocks/scan-result-component.mock.ts';

describe('EOL UI', () => {
  describe('truncateString', () => {
    it('returns original PURL if length is sixty characters or less', () => {
      // Arrange
      const purl = 'pkg:npm/test@1.0.0';

      // Act
      const result = truncateString(purl, 60);

      // Assert
      assert.strictEqual(result, purl);
    });

    it('truncates PURL if length is greater than sixty characters', () => {
      // Arrange
      const longPurl = 'pkg:npm/very-long-package-name-that-exceeds-sixty-characters-significantly@1.0.0';
      const expected = `${longPurl.slice(0, 57)}...`;

      // Act
      const result = truncateString(longPurl, 60);

      // Assert
      assert.strictEqual(result, expected);
    });
  });

  describe('convertComponentToTableRow', () => {
    it('converts a component to a table row', () => {
      // Arrange
      const component = createMockComponent(
        'pkg:npm/very-long-package-name-that-exceeds-thirty-characters@1.0.0',
        'EOL',
        new Date('2023-01-01'),
        365,
      );

      // Act
      const result = convertComponentToTableRow(component);

      // Assert
      assert.strictEqual(result.name, 'very-long-package-name-that-exceeds-thirty-characters');
      assert.strictEqual(result.version, '1.0.0');
      assert.strictEqual(result.eol, '2023-01-01');
      assert.strictEqual(result.daysEol, 365);
      assert.strictEqual(result.type, 'npm');
      assert.strictEqual(result.vulnCount, 0); // Default vulnCount
    });

    it('handles null values for eolAt and daysEol', () => {
      // Arrange
      const component = createMockComponent('pkg:npm/test@1.0.0', 'OK');

      // Act
      const result = convertComponentToTableRow(component);

      // Assert
      assert.strictEqual(result.name, 'test');
      assert.strictEqual(result.version, '1.0.0');
      assert.strictEqual(result.eol, '');
      assert.strictEqual(result.daysEol, null);
      assert.strictEqual(result.type, 'npm');
      assert.strictEqual(result.vulnCount, 0); // Default vulnCount
    });
  });

  describe('createTableForStatus', () => {
    it('creates a table with components of matching status', () => {
      // Arrange
      const components = createMockScan([
        createMockComponent('pkg:npm/test1@1.0.0', 'EOL', new Date('2023-01-01'), 365),
        createMockComponent('pkg:npm/test2@2.0.0', 'OK'),
        createMockComponent('pkg:npm/test3@3.0.0', 'EOL', new Date('2023-02-01'), 400),
      ]).components;
      const grouped = groupComponentsByStatus(components);

      // Act
      const table = createTableForStatus(grouped, 'EOL');

      // Assert
      assert.strictEqual(typeof table, 'string');
      // Check that the table contains the expected data, ignoring exact formatting
      if (config.showVulnCount) {
        assert.match(table, /test1.*1.0.0.*2023-01-01.*365.*npm.*0/);
      } else {
        assert.match(table, /test1.*1.0.0.*2023-01-01.*365.*npm/);
      }
      assert.match(table, /test3.*3.0.0.*2023-02-01.*400.*npm/);
    });

    it('returns empty table when no components match status', () => {
      // Arrange
      const components = createMockScan([createMockComponent('pkg:npm/test1@1.0.0', 'OK')]).components;
      const grouped = groupComponentsByStatus(components);

      // Act
      const table = createTableForStatus(grouped, 'EOL');

      // Assert
      assert.strictEqual(typeof table, 'string');
      // The table should be empty except for headers
      assert.doesNotMatch(table, /test1/);
    });
    it('creates a table with components of matching status without EOL columns', () => {
      // Arrange
      const components = createMockScan([
        createMockComponent('pkg:npm/test1@1.0.0', 'OK'),
        createMockComponent('pkg:npm/test2@2.0.0', 'EOL', new Date('2023-01-01'), 365),
        createMockComponent('pkg:npm/test3@3.0.0', 'OK'),
      ]).components;
      const grouped = groupComponentsByStatus(components);

      // Act
      const table = createTableForStatus(grouped, 'OK');

      // Assert
      assert.strictEqual(typeof table, 'string');
      // Check that the table contains the expected columns in order
      const lines = table.split('\n');
      const headerLine = lines[1]; // Second line contains headers
      if (config.showVulnCount) {
        assert.match(headerLine, /NAME.*VERSION.*TYPE.*# OF VULNS/);
        assert.match(table, /test1.*1.0.0.*npm.*0/);
      } else {
        assert.match(headerLine, /NAME.*VERSION.*TYPE/);
        assert.match(table, /test1.*1.0.0.*npm/);
      }
      // Verify EOL and DAYS EOL columns are not present
      assert.doesNotMatch(headerLine, /EOL/);
      assert.doesNotMatch(headerLine, /DAYS EOL/);
    });

    it('creates a table for UNKNOWN status without EOL columns', () => {
      // Arrange
      const components = createMockScan([
        createMockComponent('pkg:npm/test1@1.0.0', 'UNKNOWN'),
        createMockComponent('pkg:npm/test2@2.0.0', 'OK'),
        createMockComponent('pkg:npm/test3@3.0.0', 'UNKNOWN'),
      ]).components;
      const grouped = groupComponentsByStatus(components);

      // Act
      const table = createTableForStatus(grouped, 'UNKNOWN');

      // Assert
      assert.strictEqual(typeof table, 'string');
      // Check that the table contains the expected columns in order
      const lines = table.split('\n');
      const headerLine = lines[1]; // Second line contains headers
      if (config.showVulnCount) {
        assert.match(headerLine, /NAME.*VERSION.*TYPE.*# OF VULNS/);
        assert.match(table, /test1.*1.0.0.*npm.*0/);
      } else {
        assert.match(headerLine, /NAME.*VERSION.*TYPE/);
        assert.match(table, /test1.*1.0.0.*npm/);
      }
      // Verify EOL and DAYS EOL columns are not present
      assert.doesNotMatch(headerLine, /EOL/);
      assert.doesNotMatch(headerLine, /DAYS EOL/);
    });

    it('returns empty table when no components match status', () => {
      // Arrange
      const components = createMockScan([
        createMockComponent('pkg:npm/test1@1.0.0', 'EOL', new Date('2023-01-01'), 365),
      ]).components;
      const grouped = groupComponentsByStatus(components);

      // Act
      const table = createTableForStatus(grouped, 'OK');

      // Assert
      assert.strictEqual(typeof table, 'string');
      // The table should be empty except for headers
      assert.doesNotMatch(table, /test1/);
    });
  });
});
