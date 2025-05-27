import assert from 'node:assert';
import { describe, it } from 'node:test';
import { createBatches, dedupeAndEncodePurls } from '../../src/api/nes/nes.client.ts';
import { DEFAULT_SCAN_BATCH_SIZE } from '../../src/api/types/hd-cli.types.ts';

describe('nes.client', () => {
  describe('createBatches', () => {
    it('should handle empty array', () => {
      const result = createBatches([], DEFAULT_SCAN_BATCH_SIZE);
      assert.deepStrictEqual(result, []);
    });

    it('should create single batch when items length is less than batch size', () => {
      const items = ['a', 'b', 'c'];
      const result = createBatches(items, 5);
      assert.deepStrictEqual(result, [['a', 'b', 'c']]);
    });

    it('should create single batch when items length equals batch size', () => {
      const items = ['a', 'b', 'c', 'd', 'e'];
      const result = createBatches(items, 5);
      assert.deepStrictEqual(result, [['a', 'b', 'c', 'd', 'e']]);
    });

    it('should create multiple batches when items length exceeds batch size', () => {
      const items = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'];
      const result = createBatches(items, 3);
      assert.deepStrictEqual(result, [['a', 'b', 'c'], ['d', 'e', 'f'], ['g', 'h', 'i'], ['j']]);
    });

    it('should handle batch size of 1', () => {
      const items = ['a', 'b', 'c'];
      const result = createBatches(items, 1);
      assert.deepStrictEqual(result, [['a'], ['b'], ['c']]);
    });
  });

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
