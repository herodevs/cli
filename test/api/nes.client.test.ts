import assert from 'node:assert';
import { describe, it } from 'node:test';
import { dedupeAndEncodePurls } from '../../src/api/nes/nes.client.ts';

describe('nes.client', () => {
  describe('dedupeAndEncodePurls', () => {
    const inputs = [
      {
        purls: ['pkg:npm/@angular/core@14.3.0', 'pkg:npm/npm-bundled@2.0.1', 'pkg:npm/%40angular/core@14.3.0'],
        expected: ['pkg:npm/%40angular/core@14.3.0', 'pkg:npm/npm-bundled@2.0.1'],
        description: 'should dedupe angular core purls',
      },
      {
        purls: ['pkg:npm/@angular/core@14.3.0', 'pkg:npm/npm-bundled@2.0.1', 'pkg:npm/rxjs@6.6.7'],
        expected: ['pkg:npm/%40angular/core@14.3.0', 'pkg:npm/npm-bundled@2.0.1', 'pkg:npm/rxjs@6.6.7'],
        description: 'should not dedupe unique purls',
      },
      {
        purls: [
          'pkg:maven/org.apache.commons/commons-lang3@3.12.0',
          'pkg:maven/org.apache.commons/commons-lang3@3.12.0',
          'pkg:maven/org.apache.commons/commons-lang3@3.12.0',
        ],
        expected: ['pkg:maven/org.apache.commons/commons-lang3@3.12.0'],
        description: 'should dedupe maven purls',
      },
    ];
    for (const input of inputs) {
      it(`should dedupe and encode purls: ${input.description}`, () => {
        const result = dedupeAndEncodePurls(input.purls);
        assert.deepStrictEqual(result, input.expected);
      });
    }
  });
});
