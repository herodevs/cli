import { strictEqual } from 'node:assert';
import { describe, it } from 'node:test';
import { getScanInputOptionsFromFlags } from '../../src/service/eol/eol.svc.ts';

describe('eol.svc', () => {
  describe('getScanInputOptionsFromFlags', () => {
    it('parses no-data-retention flag when true', () => {
      const flags = { 'no-data-retention': true };

      const result = getScanInputOptionsFromFlags(flags);

      strictEqual(result.noDataRetention, true);
      strictEqual(result.type, 'SBOM');
    });

    it('parses no-data-retention flag when false', () => {
      const flags = { 'no-data-retention': false };

      const result = getScanInputOptionsFromFlags(flags);

      strictEqual(result.noDataRetention, false);
      strictEqual(result.type, 'SBOM');
    });

    it('handles when no-data-retention flag is not provided', () => {
      const flags = {};

      const result = getScanInputOptionsFromFlags(flags);

      strictEqual(result.noDataRetention, false);
      strictEqual(result.type, 'SBOM');
    });

    it('handles invalid type for no-data-retention flag (string)', () => {
      const flags = { 'no-data-retention': 'true' };

      const result = getScanInputOptionsFromFlags(flags);

      strictEqual(result.noDataRetention, false);
      strictEqual(result.type, 'SBOM');
    });

    it('handles invalid type for no-data-retention flag (number)', () => {
      const flags = { 'no-data-retention': 1 };

      const result = getScanInputOptionsFromFlags(flags);

      strictEqual(result.noDataRetention, false);
      strictEqual(result.type, 'SBOM');
    });

    it('handles invalid type for no-data-retention flag (null)', () => {
      const flags = { 'no-data-retention': null };

      const result = getScanInputOptionsFromFlags(flags);

      strictEqual(result.noDataRetention, false);
      strictEqual(result.type, 'SBOM');
    });

    it('handles invalid type for no-data-retention flag (undefined)', () => {
      const flags = { 'no-data-retention': undefined };

      const result = getScanInputOptionsFromFlags(flags);

      strictEqual(result.noDataRetention, false);
      strictEqual(result.type, 'SBOM');
    });
  });
});
