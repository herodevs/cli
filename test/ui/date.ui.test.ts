import assert from 'node:assert';
import { describe, it } from 'node:test';
import { parseDateToString } from '../../src/ui/date.ui.ts';

describe('date.ui', () => {
  describe('parseDateToString', () => {
    it('returns empty string for null input', () => {
      assert.strictEqual(parseDateToString(null), '');
    });

    it('converts string date to ISO string', () => {
      const dateStr = '2024-03-20T12:00:00Z';
      const result = parseDateToString(dateStr);
      assert.strictEqual(result, new Date(dateStr).toISOString());
    });

    it('converts number timestamp to ISO string', () => {
      const timestamp = Date.now();
      const result = parseDateToString(timestamp);
      assert.strictEqual(result, new Date(timestamp).toISOString());
    });

    it('converts Date object to ISO string', () => {
      const date = new Date();
      const result = parseDateToString(date);
      assert.strictEqual(result, date.toISOString());
    });

    it('throws error for invalid date input', () => {
      assert.throws(() => parseDateToString({}), { message: 'Invalid date' });
    });

    it('handles empty string input', () => {
      assert.throws(() => parseDateToString(''), { message: 'Invalid date' });
    });
  });
});
