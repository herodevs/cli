import assert from 'node:assert';
import { describe, it } from 'node:test';
import type { Sbom } from '../../src/service/eol/cdx.svc.ts';
import { extractPurls, formatCsvValue, getPurlOutput, parsePurlsFile } from '../../src/service/purls.svc.ts';

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
    it('should parse eol.purls.json format', () => {
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

    it('should return empty array for empty file', () => {
      const result = parsePurlsFile('');
      assert.deepStrictEqual(result, []);
    });

    it('should return empty array for whitespace-only file', () => {
      const result = parsePurlsFile('  \n  \t  ');
      assert.deepStrictEqual(result, []);
    });

    it('should throw error for file with no valid purls', () => {
      const input = 'not-a-purl\nstill-not-a-purl';
      assert.throws(() => parsePurlsFile(input), {
        message: 'Invalid purls file: must be either JSON with purls array or text file with one purl per line',
      });
    });
  });
});

describe('extractPurls', () => {
  it('should extract purls from components', () => {
    const sbom: Sbom = {
      components: [
        {
          group: '',
          name: 'react',
          version: '18.2.0',
          purl: 'pkg:npm/react@18.2.0',
        },
        {
          group: '',
          name: 'typescript',
          version: '5.0.0',
          purl: 'pkg:npm/typescript@5.0.0',
        },
      ],
      dependencies: [],
    };
    const result = extractPurls(sbom);
    assert.deepStrictEqual(result, ['pkg:npm/react@18.2.0', 'pkg:npm/typescript@5.0.0']);
  });

  it('should extract purls from direct dependencies', () => {
    const sbom: Sbom = {
      components: [],
      dependencies: [
        { ref: 'pkg:npm/express@4.18.2', dependsOn: [] },
        { ref: 'pkg:npm/lodash@4.17.21', dependsOn: [] },
      ],
    };
    const result = extractPurls(sbom);
    assert.deepStrictEqual(result, ['pkg:npm/express@4.18.2', 'pkg:npm/lodash@4.17.21']);
  });

  it('should extract purls from transitive dependencies', () => {
    const sbom: Sbom = {
      components: [],
      dependencies: [
        {
          ref: 'pkg:npm/express@4.18.2',
          dependsOn: ['pkg:npm/body-parser@1.20.2', 'pkg:npm/cookie-parser@1.4.6'],
        },
        {
          ref: 'pkg:npm/react@18.2.0',
          dependsOn: ['pkg:npm/scheduler@0.23.0'],
        },
      ],
    };
    const result = extractPurls(sbom);
    assert.deepStrictEqual(
      result.sort(),
      [
        'pkg:npm/express@4.18.2',
        'pkg:npm/body-parser@1.20.2',
        'pkg:npm/cookie-parser@1.4.6',
        'pkg:npm/react@18.2.0',
        'pkg:npm/scheduler@0.23.0',
      ].sort(),
    );
  });

  it('should handle empty components and dependencies', () => {
    const sbom: Sbom = {
      components: [],
      dependencies: [],
    };
    const result = extractPurls(sbom);
    assert.deepStrictEqual(result, []);
  });

  it('should handle mixed components and dependencies', () => {
    const sbom: Sbom = {
      components: [
        {
          group: '',
          name: 'react',
          version: '18.2.0',
          purl: 'pkg:npm/react@18.2.0',
        },
        {
          group: '',
          name: 'typescript',
          version: '5.0.0',
          purl: 'pkg:npm/typescript@5.0.0',
        },
      ],
      dependencies: [
        {
          ref: 'pkg:npm/express@4.18.2',
          dependsOn: ['pkg:npm/body-parser@1.20.2'],
        },
      ],
    };
    const result = extractPurls(sbom);
    assert.deepStrictEqual(
      result.sort(),
      [
        'pkg:npm/react@18.2.0',
        'pkg:npm/typescript@5.0.0',
        'pkg:npm/express@4.18.2',
        'pkg:npm/body-parser@1.20.2',
      ].sort(),
    );
  });
});
