import assert from 'node:assert';
import { describe, it } from 'node:test';
import { getPurlOutput } from '../../src/service/report/purls.svc.ts';

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
    it('should format simple purls with header', () => {
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

    it('should escape purls containing commas', () => {
      const purls = ['pkg:npm/foo@1.0.0', 'pkg:npm/bar@1.0.0,beta'];
      const result = getPurlOutput(purls, 'csv');
      const expected = 'purl\npkg:npm/foo@1.0.0\n"pkg:npm/bar@1.0.0,beta"';
      assert.strictEqual(result, expected);
    });

    it('should escape purls containing quotes', () => {
      const purls = ['pkg:npm/foo@1.0.0', 'pkg:npm/"bar"@1.0.0'];
      const result = getPurlOutput(purls, 'csv');
      const expected = 'purl\npkg:npm/foo@1.0.0\n"pkg:npm/""bar""@1.0.0"';
      assert.strictEqual(result, expected);
    });

    it('should handle purls with both quotes and commas', () => {
      const purls = ['pkg:npm/"foo,bar"@1.0.0'];
      const result = getPurlOutput(purls, 'csv');
      const expected = 'purl\n"pkg:npm/""foo,bar""@1.0.0"';
      assert.strictEqual(result, expected);
    });
  });
});
