/* eslint-disable @typescript-eslint/no-explicit-any */
import { Response } from "node-fetch"

import { fetcher } from "../../../src/service/nes/nes.client"
import { BaseStackMock } from "./base.mock"

/**
 * Simple stack mock for `fetch` (ultimately)
 * what Apollo uses to make GraphQL calls.
 */
export class FetchMock extends BaseStackMock {
  public constructor(protected stack: any[] = []) {
    super(fetcher, 'fetch', stack)
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