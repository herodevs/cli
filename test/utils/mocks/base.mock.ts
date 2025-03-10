/* eslint-disable @typescript-eslint/no-explicit-any */

import { default as sinon } from "sinon";

/**
 * A simple base class for returning mocked values
 * from a FIFO
 */
export class BaseStackMock {
  protected stack: any[] = []

  protected constructor(
    protected target: any,
    protected prop: string
  ) {
    sinon.stub(target, prop).callsFake(() => this.next())
  }

  protected next() {
    // fair to say it's always a promise?
    return Promise.resolve(this.stack.shift())
  }

  public push(value: any) {
    this.stack.push(value)
    return this
  }
}