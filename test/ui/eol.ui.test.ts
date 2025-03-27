import assert from 'node:assert';
import { describe, it } from 'node:test';
import { getColorForStatus, truncatePurl } from '../../src/ui/eol.ui.ts';

describe('EOL UI', () => {
  describe('truncatePurl', () => {
    it('returns original PURL if length is 50 or less', () => {
      // Arrange
      const purl = 'pkg:npm/test@1.0.0';

      // Act
      const result = truncatePurl(purl);

      // Assert
      assert.strictEqual(result, purl);
    });

    it('truncates PURL if length is greater than 50', () => {
      // Arrange
      const longPurl = 'pkg:npm/very-long-package-name-that-exceeds-fifty-characters@1.0.0';
      const sliced = 'pkg:npm/very-long-package-name-that-exceeds-fifty-characters'.slice(0, 47);
      const expected = `${sliced}...`;
      // Act
      const result = truncatePurl(longPurl);

      // Assert
      assert.strictEqual(result, expected);
    });
  });

  describe('getColorForStatus', () => {
    it('returns red for EOL status', () => {
      // Arrange
      const status = 'EOL';

      // Act
      const result = getColorForStatus(status);

      // Assert
      assert.strictEqual(result, 'red');
    });

    it('returns yellow for LTS status', () => {
      // Arrange
      const status = 'LTS';

      // Act
      const result = getColorForStatus(status);

      // Assert
      assert.strictEqual(result, 'yellow');
    });

    it('returns green for OK status', () => {
      // Arrange
      const status = 'OK';

      // Act
      const result = getColorForStatus(status);

      // Assert
      assert.strictEqual(result, 'green');
    });

    it('returns default for UNKNOWN status', () => {
      // Arrange
      const status = 'UNKNOWN';

      // Act
      const result = getColorForStatus(status);

      // Assert
      assert.strictEqual(result, 'default');
    });
  });
});
