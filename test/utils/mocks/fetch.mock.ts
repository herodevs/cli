import { BaseStackMock } from './base.mock.ts';

/**
 * Simple stack mock for `fetch` (ultimately)
 * what Apollo uses to make GraphQL calls.
 */
export class FetchMock extends BaseStackMock {
  constructor(stack: unknown[] = []) {
    super(globalThis, 'fetch');
    for (const value of stack) {
      this.push(value);
    }
  }

  addGraphQL<D>(data?: D, errors: unknown[] = []) {
    this.push({
      headers: {
        get: () => 'application/json; charset=utf-8',
      },
      status: 200,
      async text() {
        return JSON.stringify({
          data,
          errors,
        });
      },
    } as unknown as Response);
    return this;
  }

  getCalls() {
    return super.getCalls().map(([input, init]) => ({
      input,
      init: init as RequestInit | undefined,
    }));
  }
}
