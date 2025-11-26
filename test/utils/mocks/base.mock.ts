import { default as sinon } from 'sinon';

/**
 * A simple base class for returning mocked values
 * from a FIFO
 */
export class BaseStackMock {
  protected queue: unknown[] = [];
  private stub: sinon.SinonStub | null = null;
  private calls: unknown[][] = [];

  constructor(target: Record<string, unknown>, prop: string) {
    this.stub = sinon.stub(target, prop).callsFake((...args: unknown[]) => this.invoke(args));
  }

  protected next() {
    return Promise.resolve(this.queue.shift());
  }

  private invoke(args: unknown[]) {
    this.calls.push(args);
    return this.next();
  }

  public push(value: unknown) {
    this.queue.push(value);
    return this;
  }

  public restore() {
    if (this.stub) {
      this.stub.restore();
      this.stub = null;
    }
    this.queue = [];
    this.calls = [];
  }

  public getCalls() {
    return [...this.calls];
  }
}
