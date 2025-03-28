import assert from 'node:assert';
import { describe, it } from 'node:test';
import { formatCsvValue, getPurlOutput, parsePurlsFile } from '../../src/service/purls.svc.ts';

describe('getPurlOutput', () => {
  describe('json output', () => {
    it('should format purls as JSON with proper indentation', () => {
      const purls = ['pkg:npm/react@18.2.0', 'pkg:npm/typescript@5.0.0'];
      const result = getPurlOutput(purls, 'json');
      const expected = JSON.stringify({ purls }, null, 2);
      assert.strictEqual(result, expected);
    });

    it('should handle empty array', () => {
      const purls: string[] = [];
      const result = getPurlOutput(purls, 'json');
      assert.strictEqual(result, JSON.stringify({ purls }, null, 2));
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

describe('parsePurlsFile', () => {
  describe('JSON format', () => {
    it('should parse nes.purls.json format', () => {
      const input = JSON.stringify({
        purls: ['pkg:npm/@apollo/client@3.13.5', 'pkg:npm/react@18.2.0'],
      });
      const result = parsePurlsFile(input);
      assert.deepStrictEqual(result, ['pkg:npm/@apollo/client@3.13.5', 'pkg:npm/react@18.2.0']);
    });

    it('should parse direct JSON array', () => {
      const input = JSON.stringify(['pkg:npm/express@4.18.2', 'pkg:npm/typescript@5.0.0']);
      const result = parsePurlsFile(input);
      assert.deepStrictEqual(result, ['pkg:npm/express@4.18.2', 'pkg:npm/typescript@5.0.0']);
    });
  });

  describe('text format', () => {
    it('should parse text file with one purl per line', () => {
      const input = `pkg:npm/react@18.2.0
pkg:npm/typescript@5.0.0`;
      const result = parsePurlsFile(input);
      assert.deepStrictEqual(result, ['pkg:npm/react@18.2.0', 'pkg:npm/typescript@5.0.0']);
    });

    it('should handle empty lines and whitespace', () => {
      const input = `
        pkg:npm/react@18.2.0
        
        pkg:npm/typescript@5.0.0
      `;
      const result = parsePurlsFile(input);
      assert.deepStrictEqual(result, ['pkg:npm/react@18.2.0', 'pkg:npm/typescript@5.0.0']);
    });

    it('should filter out invalid lines', () => {
      const input = `
        not-a-purl
        pkg:npm/react@18.2.0
        also-not-a-purl
        pkg:npm/typescript@5.0.0
      `;
      const result = parsePurlsFile(input);
      assert.deepStrictEqual(result, ['pkg:npm/react@18.2.0', 'pkg:npm/typescript@5.0.0']);
    });
  });

  describe('error handling', () => {
    it('should throw error for invalid JSON', () => {
      const input = '{ invalid json }';
      assert.throws(() => parsePurlsFile(input), {
        message: 'Invalid purls file: must be either JSON with purls array or text file with one purl per line',
      });
    });

    it('should throw error for empty file', () => {
      assert.throws(() => parsePurlsFile(''), {
        message: 'Invalid purls file: must be either JSON with purls array or text file with one purl per line',
      });
    });

    it('should throw error for file with no valid purls', () => {
      const input = 'not-a-purl\nstill-not-a-purl';
      assert.throws(() => parsePurlsFile(input), {
        message: 'Invalid purls file: must be either JSON with purls array or text file with one purl per line',
      });
    });
  });
});
