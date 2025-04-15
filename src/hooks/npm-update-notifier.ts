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
  const isMajorUpdate = update.type === 'major';
  const isMinorUpdate = update.type === 'minor';
  const isPatchUpdate = update.type === 'patch';

  /**
   * Show all updates for v0.x.x
   * This is because all updates (including patches) can contain breaking
   * changes per SemVer spec[1]. See also a discussion on Antfu's blog[2].
   * [1]https://semver.org/#spec-item-4
   * [2]https://antfu.me/posts/epoch-semver#leading-zero-major-versioning
   */
  if (isPreV1) {
    return {
      message: `Update available! v${currentVersion} → v${update.latest}\nWhile in v0, all updates may contain breaking changes.`,
      defer: false,
    };
  }

  // For stable versions (1.x.x+), use different messaging based on update type
  if (isMajorUpdate) {
    return {
      message: `Major update available! v${currentVersion} → v${update.latest}\nThis includes breaking changes.`,
      defer: false,
    };
  }

  if (isMinorUpdate) {
    return {
      message: `New features available! v${currentVersion} → v${update.latest}\nUpdate includes new functionality.`,
      defer: false,
    };
  }

  if (isPatchUpdate) {
    return {
      message: `Patch update available v${currentVersion} → v${update.latest}\nThis may include bug fixes and security updates.`,
      defer: false,
    };
  }
}
