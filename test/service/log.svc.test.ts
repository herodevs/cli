import assert from 'node:assert';
import { describe, it } from 'node:test';
import { debugLogger, getErrorMessage } from '../../src/service/log.svc.ts';

describe('log.svc', () => {
  it('getErrorMessage returns error.message for Error', () => {
    const msg = getErrorMessage(new Error('boom'));
    assert.strictEqual(msg, 'boom');
  });

  it('getErrorMessage stringifies non-Error', () => {
    assert.strictEqual(getErrorMessage('x'), 'x');
  });

  it('debugLogger is a function', () => {
    assert.strictEqual(typeof debugLogger, 'function');
  });
});
