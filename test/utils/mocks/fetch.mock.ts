import { BaseStackMock } from "./base.mock"

/**
 * Simple stack mock for `fetch` (ultimately)
 * what Apollo uses to make GraphQL calls.
 */
export class FetchMock extends BaseStackMock {
  public constructor(protected stack: any[] = []) {
    super(globalThis, 'fetch')
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