import assert from 'node:assert';
import { describe, it } from 'node:test';
import { getDistTag, handleUpdate } from '../../src/hooks/npm-update-notifier.ts';

describe('getDistTag', () => {
  it('should return beta for beta versions', () => {
    assert.strictEqual(getDistTag('1.0.0-beta.1'), 'beta');
    assert.strictEqual(getDistTag('2.3.4-beta.42'), 'beta');
  });

  it('should return alpha for alpha versions', () => {
    assert.strictEqual(getDistTag('1.0.0-alpha.1'), 'alpha');
    assert.strictEqual(getDistTag('2.3.4-alpha.42'), 'alpha');
  });

  it('should return next for next versions', () => {
    assert.strictEqual(getDistTag('1.0.0-next.1'), 'next');
    assert.strictEqual(getDistTag('2.3.4-next.42'), 'next');
  });

  it('should return latest for stable versions', () => {
    assert.strictEqual(getDistTag('1.0.0'), 'latest');
    assert.strictEqual(getDistTag('2.3.4'), 'latest');
  });
});

describe('handleUpdate', () => {
  describe('updates that may contain breaking changes', () => {
    it('should warn about v0.x.x updates', () => {
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
        message: 'Update available! v0.3.1 → v0.3.2\nThis update may contain breaking changes.',
        defer: false,
      });
    });

    it('should warn about beta updates', () => {
      const result = handleUpdate(
        {
          type: 'minor',
          latest: '1.4.0-beta.2',
          current: '1.4.0-beta.1',
          name: '@herodevs/cli',
        },
        '1.4.0-beta.1',
      );

      assert.deepStrictEqual(result, {
        message: 'Update available! v1.4.0-beta.1 → v1.4.0-beta.2\nThis update may contain breaking changes.',
        defer: false,
      });
    });

    it('should warn about alpha updates', () => {
      const result = handleUpdate(
        {
          type: 'minor',
          latest: '1.4.0-alpha.1',
          current: '1.4.0',
          name: '@herodevs/cli',
        },
        '1.4.0',
      );

      assert.deepStrictEqual(result, {
        message: 'Update available! v1.4.0 → v1.4.0-alpha.1\nThis update may contain breaking changes.',
        defer: false,
      });
    });

    it('should warn about next updates', () => {
      const result = handleUpdate(
        {
          type: 'minor',
          latest: '1.4.0-next.1',
          current: '1.4.0',
          name: '@herodevs/cli',
        },
        '1.4.0',
      );

      assert.deepStrictEqual(result, {
        message: 'Update available! v1.4.0 → v1.4.0-next.1\nThis update may contain breaking changes.',
        defer: false,
      });
    });

    it('should warn about major updates', () => {
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
        message: 'Update available! v1.0.0 → v2.0.0\nThis update may contain breaking changes.',
        defer: false,
      });
    });

    it('should warn when updating from stable to beta', () => {
      const result = handleUpdate(
        {
          type: 'minor',
          latest: '1.4.0-beta.1',
          current: '1.3.0',
          name: '@herodevs/cli',
        },
        '1.3.0',
      );

      assert.deepStrictEqual(result, {
        message: 'Update available! v1.3.0 → v1.4.0-beta.1\nThis update may contain breaking changes.',
        defer: false,
      });
    });

    it('should warn when updating from beta to stable', () => {
      const result = handleUpdate(
        {
          type: 'minor',
          latest: '1.4.0',
          current: '1.4.0-beta.1',
          name: '@herodevs/cli',
        },
        '1.4.0-beta.1',
      );

      assert.deepStrictEqual(result, {
        message: 'Update available! v1.4.0-beta.1 → v1.4.0\nThis update may contain breaking changes.',
        defer: false,
      });
    });

    it('should warn about minor updates between beta versions', () => {
      const result = handleUpdate(
        {
          type: 'minor',
          latest: '1.4.0-beta.2',
          current: '1.3.0-beta.1',
          name: '@herodevs/cli',
        },
        '1.3.0-beta.1',
      );

      assert.deepStrictEqual(result, {
        message: 'Update available! v1.3.0-beta.1 → v1.4.0-beta.2\nThis update may contain breaking changes.',
        defer: false,
      });
    });
  });

  describe('updates that should not contain breaking changes', () => {
    it('should not warn about minor updates', () => {
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
        message: 'Update available! v1.0.0 → v1.1.0',
        defer: false,
      });
    });

    it('should not warn about patch updates', () => {
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
        message: 'Update available! v1.0.0 → v1.0.1',
        defer: false,
      });
    });

    it('should not warn about minor updates between stable versions', () => {
      const result = handleUpdate(
        {
          type: 'minor',
          latest: '1.4.0',
          current: '1.3.0',
          name: '@herodevs/cli',
        },
        '1.3.0',
      );

      assert.deepStrictEqual(result, {
        message: 'Update available! v1.3.0 → v1.4.0',
        defer: false,
      });
    });
  });
});
