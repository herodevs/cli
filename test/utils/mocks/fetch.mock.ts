import { BaseStackMock } from "./base.mock.ts"

/**
 * Simple stack mock for `fetch` (ultimately)
 * what Apollo uses to make GraphQL calls.
 */
export class FetchMock extends BaseStackMock {
  constructor(stack: any[] = []) {
    super(globalThis, 'fetch')
    this.stack = stack
  }

  addGraphQL<D>(data?: D, errors: any[] = []) {
    this.stack.push({
      headers: {
        get: () => 'application/json; charset=utf-8'
      },
      status: 200,
      async text() {
        return JSON.stringify({
          data,
          errors
        })
      },
    } as unknown as Response)
    return this
  }
}