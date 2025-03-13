import assert from 'node:assert';
import { describe, it } from 'node:test';
import { daysBetween, formatLine, getMessageAndStatus } from '../../src/service/line.ts';
import type { Line } from '../../src/service/line.ts';

describe('line', () => {
  describe('daysBetween', () => {
    it('should calculate days between dates', () => {
      const date1 = new Date('2024-01-01');
      const date2 = new Date('2024-01-31');
      assert.equal(daysBetween(date1, date2), 30);
    });

    it('should handle negative differences', () => {
      const date1 = new Date('2024-01-31');
      const date2 = new Date('2024-01-01');
      assert.equal(daysBetween(date1, date2), -30);
    });
  });

  describe('getMessageAndStatus', () => {
    it('should format EOL status', () => {
      const eolAt = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
      const { stat, msg } = getMessageAndStatus('EOL', eolAt);
      assert(stat.includes('EOL'));
      assert(msg.includes('days ago'));
    });

    it('should format LTS status', () => {
      const eolAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
      const { stat, msg } = getMessageAndStatus('LTS', eolAt);
      assert(stat.includes('LTS'));
      assert(msg.includes('Will go EOL in'));
    });

    it('should format OK status', () => {
      const { stat, msg } = getMessageAndStatus('OK');
      assert(stat.includes('OK'));
      assert.equal(msg, '');
    });

    it('should handle missing eolAt date', () => {
      const { msg } = getMessageAndStatus('EOL');
      assert(msg.includes('unknown') && msg.includes('days ago'));
    });

    it('should throw on unknown status', () => {
      assert.throws(() => getMessageAndStatus('INVALID'), /Unknown status: INVALID/);
    });
  });

  describe('formatLine', () => {
    const context = { longest: 20, total: 3 };

    it('should format line with EOL status', () => {
      const line: Line = {
        purl: 'pkg:npm/test@1.0.0',
        status: 'EOL',
        info: { isEol: true, eolAt: new Date() },
      };
      const result = formatLine(line, 0, context);
      assert(result.name.includes('['));
      assert(result.name.includes('EOL'));
      assert(result.name.includes('pkg:npm/test@1.0.0'));
      assert.equal(result.value, line);
    });

    it('should throw when isEol is true but status is not EOL', () => {
      const line: Line = {
        purl: 'pkg:npm/test@1.0.0',
        status: 'OK',
        info: { isEol: true },
      };
      assert.throws(() => formatLine(line, 0, context), /isEol is true but status is not EOL/);
    });

    it('should handle missing info', () => {
      const line: Line = {
        purl: 'pkg:npm/test@1.0.0',
        status: 'OK',
      };
      const result = formatLine(line, 0, context);
      assert(result.name.includes('OK'));
    });
  });
});
