import type { Hook } from '@oclif/core';
import updateNotifier from 'update-notifier';
import pkg from '../../../package.json' with { type: 'json' };

const updateNotifierHook: Hook.Init = async (options) => {
  const notifier = updateNotifier({
    pkg,
    updateCheckInterval: 1000 * 60 * 60 * 24, // Check once per day
  });

  if (notifier.update) {
    const isPreV1 = pkg.version.startsWith('0.');
    const isMajorOrMinor = ['major', 'minor'].includes(notifier.update.type);

    /**
     * Show all updates for v0.x.x
     * This is because all updates (including patches) can contain breaking
     * changes per SemVer spec[1]. See also a discussion on Antfu's blog[2].
     * [1]https://semver.org/#spec-item-4
     * [2]https://antfu.me/posts/epoch-semver#leading-zero-major-versioning
     */
    if (isPreV1) {
      notifier.notify({
        message: `Update available! v${pkg.version} → v${notifier.update.latest}\nWhile in v0, all updates may contain breaking changes.`,
        defer: false,
      });
    // Only show major/minor updates for v1.x.x+
    } else if (isMajorOrMinor) {
      notifier.notify({
        message: `New ${notifier.update.type} version available! v${pkg.version} → v${notifier.update.latest}`,
        defer: false,
      });
    }
  }
};

export default updateNotifierHook;
