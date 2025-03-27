import assert from 'node:assert';
import { describe, it } from 'node:test';
import { parseMomentToSimpleDate } from '../../src/ui/date.ui.ts';

describe('date.ui', () => {
  describe('parseMomentToSimpleDate', () => {
    it('returns empty string for null input', () => {
      assert.strictEqual(parseMomentToSimpleDate(null), '');
    });

    it('converts moment string to YYYY-MM-DD format', () => {
      // Arrange
      const momentDate = '2024-03-20T12:00:00Z';

      // Act
      const result = parseMomentToSimpleDate(momentDate);

      // Assert
      assert.strictEqual(result, '2024-03-20');
    });

    it('converts number timestamp to YYYY-MM-DD format', () => {
      // Arrange
      const timestamp = new Date('2024-03-20').getTime();

      // Act
      const result = parseMomentToSimpleDate(timestamp);

      // Assert
      assert.strictEqual(result, '2024-03-20');
    });

    it('converts Date object to YYYY-MM-DD format', () => {
      // Arrange
      const date = new Date('2024-03-20');

      // Act
      const result = parseMomentToSimpleDate(date);

      // Assert
      assert.strictEqual(result, '2024-03-20');
    });

    it('throws error for empty string input', () => {
      // Arrange
      const input = '';

      // Assert
      assert.throws(
        // Act
        () => parseMomentToSimpleDate(input),
        {
          message: 'Invalid date',
        },
      );
    });

    it('throws error for non-date string input', () => {
      // Arrange
      const input = 'not-a-date';

      // Assert
      assert.throws(
        // Act
        () => parseMomentToSimpleDate(input),
        {
          message: 'Invalid date',
        },
      );
    });

    it('throws error for invalid date values', () => {
      // Arrange
      const input = '2024-13-45';

      // Assert
      assert.throws(
        // Act
        () => parseMomentToSimpleDate(input),
        {
          message: 'Invalid date',
        },
      );
    });
  });
});
