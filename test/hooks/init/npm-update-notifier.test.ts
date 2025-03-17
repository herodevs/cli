import assert from 'node:assert';
import { describe, it } from 'node:test';
import { handleUpdate } from '../../../src/hooks/init/npm-update-notifier.ts';

describe('handleUpdate', () => {
  it('should notify on major updates for v0.x.x', () => {
    const result = handleUpdate(
      {
        type: 'major',
        latest: '1.0.0',
        current: '0.3.1',
        name: '@herodevs/cli',
      },
      '0.3.1',
    );

    assert.deepStrictEqual(result, {
      message: 'Update available! v0.3.1 → v1.0.0\nWhile in v0, all updates may contain breaking changes.',
      defer: false,
    });
  });

  it('should notify on minor updates for v0.x.x', () => {
    const result = handleUpdate(
      {
        type: 'minor',
        latest: '0.4.0',
        current: '0.3.1',
        name: '@herodevs/cli',
      },
      '0.3.1',
    );

    assert.deepStrictEqual(result, {
      message: 'Update available! v0.3.1 → v0.4.0\nWhile in v0, all updates may contain breaking changes.',
      defer: false,
    });
  });

  it('should notify on patch updates for v0.x.x', () => {
    const result = handleUpdate(
      {
        type: 'patch',
        latest: '0.3.2',
        current: '0.3.1',
        name: '@herodevs/cli',
      },
      '0.3.1',
    );

    assert.deepStrictEqual(result, {
      message: 'Update available! v0.3.1 → v0.3.2\nWhile in v0, all updates may contain breaking changes.',
      defer: false,
    });
  });

  it('should notify on major updates for v1.x.x+ with breaking changes warning', () => {
    const result = handleUpdate(
      {
        type: 'major',
        latest: '2.0.0',
        current: '1.0.0',
        name: '@herodevs/cli',
      },
      '1.0.0',
    );

    assert.deepStrictEqual(result, {
      message: 'Major update available! v1.0.0 → v2.0.0\nThis includes breaking changes.',
      defer: false,
    });
  });

  it('should notify on minor updates for v1.x.x+ with new features message', () => {
    const result = handleUpdate(
      {
        type: 'minor',
        latest: '1.1.0',
        current: '1.0.0',
        name: '@herodevs/cli',
      },
      '1.0.0',
    );

    assert.deepStrictEqual(result, {
      message: 'New features available! v1.0.0 → v1.1.0\nUpdate includes new functionality.',
      defer: false,
    });
  });

  it('should notify on patch updates for v1.x.x+ with bug fix message', () => {
    const result = handleUpdate(
      {
        type: 'patch',
        latest: '1.0.1',
        current: '1.0.0',
        name: '@herodevs/cli',
      },
      '1.0.0',
    );

    assert.deepStrictEqual(result, {
      message: 'Patch update available v1.0.0 → v1.0.1\nThis may include bug fixes and security updates.',
      defer: false,
    });
  });
});
