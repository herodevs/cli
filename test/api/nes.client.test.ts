import assert from 'node:assert';
import { describe, it } from 'node:test';
import { createBatches } from '../../src/api/nes/nes.client.ts';
import { DEFAULT_SCAN_BATCH_SIZE } from '../../src/api/types/hd-cli.types.ts';

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
