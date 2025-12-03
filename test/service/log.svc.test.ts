import { debugLogger, getErrorMessage } from '../../src/service/log.svc.ts';

describe('log.svc', () => {
  it('getErrorMessage returns error.message for Error', () => {
    const msg = getErrorMessage(new Error('boom'));
    expect(msg).toBe('boom');
  });

  it('getErrorMessage stringifies non-Error objects', () => {
    expect(getErrorMessage({ bad: 'x' })).toBe('{"bad":"x"}');
  });

  it('getErrorMessage stringifies non-Error', () => {
    expect(getErrorMessage('x')).toBe('x');
  });

  it('debugLogger is a function', () => {
    expect(typeof debugLogger).toBe('function');
  });
});
