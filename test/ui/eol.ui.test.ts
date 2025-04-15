import assert from 'node:assert';
import { describe, it } from 'node:test';
import { convertComponentToTableRow, createTableForStatus, truncateString } from '../../src/ui/eol.ui.ts';
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
      assert.strictEqual(result.length, 5);
      assert.strictEqual(result[0].content, 'very-long-package-name-that-exceeds-thirty-characters');
      assert.strictEqual(result[1].content, '1.0.0');
      assert.strictEqual(result[2].content, '2023-01-01');
      assert.strictEqual(result[3].content, 365);
      assert.strictEqual(result[4].content, 'npm');
    });

    it('handles null values for eolAt and daysEol', () => {
      // Arrange
      const component = createMockComponent('pkg:npm/test@1.0.0', 'OK');

      // Act
      const result = convertComponentToTableRow(component);

      // Assert
      assert.strictEqual(result.length, 5);
      assert.strictEqual(result[0].content, 'test');
      assert.strictEqual(result[1].content, '1.0.0');
      assert.strictEqual(result[2].content, '');
      assert.strictEqual(result[3].content, null);
      assert.strictEqual(result[4].content, 'npm');
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

      // Act
      const table = createTableForStatus(components, 'EOL');

      // Assert
      assert.strictEqual(table.length, 2);
      assert.strictEqual(table.length, 2); // Only data rows (excluding header)
      assert.deepStrictEqual(table.options.head, ['NAME', 'VERSION', 'EOL', 'DAYS EOL', 'TYPE']);
      assert.deepStrictEqual(table.options.colWidths, [30, 10, 12, 10, 12]);
    });

    it('returns empty table when no components match status', () => {
      // Arrange
      const components = createMockScan([createMockComponent('pkg:npm/test1@1.0.0', 'OK')]).components;

      // Act
      const table = createTableForStatus(components, 'EOL');

      // Assert
      assert.strictEqual(table.length, 0); // No data rows
    });
  });
});
