import assert from 'node:assert';
import { describe, it } from 'node:test';
import type { ScanResultComponent } from '../../src/api/types/nes.types.ts';
import { daysBetween, formatLine, getMessageAndStatus, getStatusFromComponent } from '../../src/service/line.svc.ts';
import type { Line } from '../../src/service/line.svc.ts';

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
    it('should format EOL status with days', () => {
      const { stat, msg } = getMessageAndStatus('EOL', 30);
      assert(stat.includes('EOL'));
      assert(msg.includes('30') && msg.includes('days ago'));
    });

    it('should format LTS status with days', () => {
      const { stat, msg } = getMessageAndStatus('LTS', 30);
      assert(stat.includes('LTS'));
      assert(msg.includes('30') && msg.includes('Will go EOL in'));
    });

    it('should format OK status', () => {
      const { stat, msg } = getMessageAndStatus('OK', null);
      assert(stat.includes('OK'));
      assert.equal(msg, '');
    });

    it('should handle null daysEol', () => {
      const { msg } = getMessageAndStatus('EOL', null);
      assert(msg.includes("EOL'd") && msg.includes('unknown') && msg.includes('days ago'));
    });

    it('should throw on unknown status', () => {
      assert.throws(() => getMessageAndStatus('INVALID', null), /Unknown status: INVALID/);
    });
  });

  describe('getStatusFromComponent', () => {
    const baseComponent: ScanResultComponent = {
      purl: 'pkg:npm/test@1.0.0',
      info: {
        eolAt: null,
        isEol: false,
        isUnsafe: false,
      },
    };

    it('should use component status if provided', () => {
      const component = { ...baseComponent, status: 'LTS' as const };
      assert.equal(getStatusFromComponent(component, -30), 'LTS');
    });

    it('should throw if isEol is true but status is not EOL', () => {
      const component = {
        ...baseComponent,
        status: 'OK' as const,
        info: { ...baseComponent.info, isEol: true },
      };
      assert.throws(() => getStatusFromComponent(component, null), /isEol is true but status is not EOL/);
    });

    describe('when status is not provided', () => {
      it('should return EOL if daysEol is null and isEol is true', () => {
        const component = {
          ...baseComponent,
          info: { ...baseComponent.info, isEol: true },
        };
        assert.equal(getStatusFromComponent(component, null), 'EOL');
      });

      it('should return OK if daysEol is null and isEol is false', () => {
        const component = { ...baseComponent };
        assert.equal(getStatusFromComponent(component, null), 'OK');
      });

      it('should return LTS if daysEol is zero or negative (future/today)', () => {
        const component = { ...baseComponent };
        assert.equal(getStatusFromComponent(component, 0), 'LTS');
        assert.equal(getStatusFromComponent(component, -30), 'LTS');
      });

      it('should return EOL if daysEol is positive (past date)', () => {
        const component = { ...baseComponent };
        assert.equal(getStatusFromComponent(component, 30), 'EOL');
      });
    });
  });

  describe('formatLine', () => {
    const context = { longest: 20, total: 3 };

    it('should format line with EOL status', () => {
      const line: Line = {
        purl: 'pkg:npm/test@1.0.0',
        status: 'EOL',
        daysEol: 30,
        info: { isEol: true, eolAt: new Date() },
      };
      const result = formatLine(line, 0, context);
      assert(result.name.includes('['));
      assert(result.name.includes('EOL'));
      assert(result.name.includes('pkg:npm/test@1.0.0'));
      assert.equal(result.value, line);
    });

    it('should format line with OK status', () => {
      const line: Line = {
        purl: 'pkg:npm/test@1.0.0',
        status: 'OK',
        daysEol: null,
        info: { isEol: false, eolAt: null },
      };
      const result = formatLine(line, 0, context);
      assert(result.name.includes('OK'));
      assert.equal(result.value, line);
    });

    it('should format line with LTS status', () => {
      const line: Line = {
        purl: 'pkg:npm/test@1.0.0',
        status: 'LTS',
        daysEol: 30,
        info: { isEol: false, eolAt: new Date() },
      };
      const result = formatLine(line, 0, context);
      assert(result.name.includes('LTS'));
      assert.equal(result.value, line);
    });
  });
});
