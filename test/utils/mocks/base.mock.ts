import { default as sinon } from 'sinon';

/**
 * A simple base class for returning mocked values
 * from a FIFO
 */
export class BaseStackMock {
  stack: any[] = [];

  constructor(target: any, prop: string) {
    sinon.stub(target, prop).callsFake(() => this.next());
  }

  next() {
    // fair to say it's always a promise?
    return Promise.resolve(this.stack.shift());
  }

  public push(value: any) {
    this.stack.push(value);
    return this;
  }
}
