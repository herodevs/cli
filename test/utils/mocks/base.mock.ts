import { default as sinon } from 'sinon';

/**
 * A simple base class for returning mocked values
 * from a FIFO
 */
export class BaseStackMock {
  private stack: unknown[] = [];
  private stub: sinon.SinonStub | null = null;

  constructor(target: Record<string, unknown>, prop: string) {
    // Create a new sandbox for each instance
    this.stub = sinon.stub(target, prop).callsFake(() => this.next());
  }

  protected next() {
    return Promise.resolve(this.stack.shift());
  }

  public push(value: unknown) {
    this.stack.push(value);
    return this;
  }

  public restore() {
    if (this.stub) {
      this.stub.restore();
      this.stub = null;
    }
    this.stack = [];
  }
}
