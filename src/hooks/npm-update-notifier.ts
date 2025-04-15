import type { Hook } from '@oclif/core';
import updateNotifier, { type UpdateInfo } from 'update-notifier';
import pkg from '../../package.json' with { type: 'json' };

const updateNotifierHook: Hook.Init = async (options) => {
  const notifier = updateNotifier({
    pkg,
    updateCheckInterval: 1000 * 60 * 60 * 24, // Check once per day
  });

  if (notifier.update) {
    const notification = handleUpdate(notifier.update, pkg.version);
    if (notification) {
      notifier.notify(notification);
    }
  }
};

export default updateNotifierHook;

export function handleUpdate(update: UpdateInfo, currentVersion: string) {
  const isPreV1 = currentVersion.startsWith('0.');
  const isBeta = currentVersion.includes('-beta') || update.latest.includes('-beta');
  const isAlpha = currentVersion.includes('-alpha') || update.latest.includes('-alpha');
  const isNext = currentVersion.includes('-next') || update.latest.includes('-next');

  let message = `Update available! v${currentVersion} → v${update.latest}`;

  /**
   * Show breaking changes warning for:
   * - v0.x.x versions (all updates can contain breaking changes per SemVer spec[1][2])
   * - Prerelease versions (beta/alpha/next)
   * - Major version updates
   *
   * [1]https://semver.org/#spec-item-4
   * [2]https://antfu.me/posts/epoch-semver#leading-zero-major-versioning
   */
  if (isPreV1 || isBeta || isAlpha || isNext || update.type === 'major') {
    message += '\nThis update may contain breaking changes.';
  }

  // For all other updates (minor, patch), they should be non-breaking
  return {
    message,
    defer: false,
  };
}
