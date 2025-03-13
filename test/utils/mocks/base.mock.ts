import { default as sinon } from 'sinon';

/**
 * A simple base class for returning mocked values
 * from a FIFO
 */
export class BaseStackMock {
  stack: unknown[] = [];

  constructor(target: Record<string, unknown>, prop: string) {
    sinon.stub(target, prop).callsFake(() => this.next());
  }

  next() {
    // fair to say it's always a promise?
    return Promise.resolve(this.stack.shift());
  }

  public push(value: unknown) {
    this.stack.push(value);
    return this;
  }
}
