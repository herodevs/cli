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
    expect(output).toEqual(expectedOutput);
  });

  it('handles null and primitive values correctly', () => {
    expect(stripTypename(null)).toBeNull();
    expect(stripTypename(42)).toBe(42);
    expect(stripTypename('string')).toBe('string');
    expect(stripTypename(true)).toBe(true);
  });

  it('handles arrays of primitives correctly', () => {
    const input = [1, 2, 3, { __typename: 'Item', id: 'a' }];
    const expectedOutput = [1, 2, 3, { id: 'a' }];
    const output = stripTypename(input);
    expect(output).toEqual(expectedOutput);
  });
});
