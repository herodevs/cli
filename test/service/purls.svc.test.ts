import assert from 'node:assert';
import { describe, it } from 'node:test';
import { formatCsvValue, getPurlOutput } from '../../src/service/purls.svc.ts';

describe('getPurlOutput', () => {
  describe('json output', () => {
    it('should format purls as JSON with proper indentation', () => {
      const purls = ['pkg:npm/react@18.2.0', 'pkg:npm/typescript@5.0.0'];
      const result = getPurlOutput(purls, 'json');
      const expected = JSON.stringify(purls, null, 2);
      assert.strictEqual(result, expected);
    });

    it('should handle empty array', () => {
      const purls: string[] = [];
      const result = getPurlOutput(purls, 'json');
      assert.strictEqual(result, '[]');
    });
  });

  describe('csv output', () => {
    it('should format purls with header', () => {
      const purls = ['pkg:npm/react@18.2.0', 'pkg:npm/typescript@5.0.0'];
      const result = getPurlOutput(purls, 'csv');
      const expected = 'purl\npkg:npm/react@18.2.0\npkg:npm/typescript@5.0.0';
      assert.strictEqual(result, expected);
    });

    it('should handle empty array', () => {
      const purls: string[] = [];
      const result = getPurlOutput(purls, 'csv');
      assert.strictEqual(result, 'purl');
    });
  });
});

describe('formatCsvValue', () => {
  it('should return value unchanged when no commas present', () => {
    const value = 'pkg:npm/react@18.2.0';
    assert.strictEqual(formatCsvValue(value), value);
  });

  it('should wrap value in quotes when comma present', () => {
    const value = 'pkg:npm/bar@1.0.0,beta';
    assert.strictEqual(formatCsvValue(value), '"pkg:npm/bar@1.0.0,beta"');
  });

  it('should handle empty string', () => {
    assert.strictEqual(formatCsvValue(''), '');
  });
});
