import assert from 'node:assert';
import { describe, it } from 'node:test';
import { truncatePurl } from '../../src/ui/eol.ui.ts';

describe('EOL UI', () => {
  describe('truncatePurl', () => {
    it('returns original PURL if length is 60 or less', () => {
      // Arrange
      const purl = 'pkg:npm/test@1.0.0';

      // Act
      const result = truncatePurl(purl);

      // Assert
      assert.strictEqual(result, purl);
    });

    it('truncates PURL if length is greater than 60', () => {
      // Arrange
      const longPurl = 'pkg:npm/very-long-package-name-that-exceeds-sixty-characters-significantly@1.0.0';
      const expected = `${longPurl.slice(0, 57)}...`;

      // Act
      const result = truncatePurl(longPurl);

      // Assert
      assert.strictEqual(result, expected);
    });
  });
});
