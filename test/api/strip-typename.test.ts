import assert from 'node:assert';
import { describe, it } from 'node:test';
import { stripTypename } from '../../src/utils/strip-typename';

describe('stripTypename', () => {
  it('removes __typename from objects and nested structures', () => {
    const input = {
      __typename: 'Root',
      id: '1',
      name: 'Test',
      nested: {
        __typename: 'Nested',
        value: 42,
        array: [
          { __typename: 'Item', itemId: 'a' },
          { __typename: 'Item', itemId: 'b' },
        ],
      },
      list: [
        { __typename: 'ListItem', listId: 'x' },
        { __typename: 'ListItem', listId: 'y' },
      ],
    };

    const expectedOutput = {
      id: '1',
      name: 'Test',
      nested: {
        value: 42,
        array: [{ itemId: 'a' }, { itemId: 'b' }],
      },
      list: [{ listId: 'x' }, { listId: 'y' }],
    };

    const output = stripTypename(input);
    assert.deepStrictEqual(output, expectedOutput);
  });

  it('handles null and primitive values correctly', () => {
    assert.strictEqual(stripTypename(null), null);
    assert.strictEqual(stripTypename(42), 42);
    assert.strictEqual(stripTypename('string'), 'string');
    assert.strictEqual(stripTypename(true), true);
  });

  it('handles arrays of primitives correctly', () => {
    const input = [1, 2, 3, { __typename: 'Item', id: 'a' }];
    const expectedOutput = [1, 2, 3, { id: 'a' }];
    const output = stripTypename(input);
    assert.deepStrictEqual(output, expectedOutput);
  });
});
