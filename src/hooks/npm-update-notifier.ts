import type { Hook } from '@oclif/core';
import { ux } from '@oclif/core';
import updateNotifier, { type UpdateInfo } from 'update-notifier';
import pkg from '../../package.json' with { type: 'json' };
import { debugLogger } from '../service/log.svc.ts';

const updateNotifierHook: Hook.Init = async (options) => {
  debugLogger('pkg.version', pkg.version);

  const distTag = getDistTag(pkg.version);
  debugLogger('distTag', distTag);

  let updateCheckInterval = 1000 * 60 * 60 * 24; // Check once per day for latest versions

  // If we're not on the latest dist-tag, check for updates every time
  if (distTag !== 'latest') {
    updateCheckInterval = 0; // Check every time for non-latest versions
  }

  debugLogger('updateCheckInterval', updateCheckInterval);

  const notifier = updateNotifier({
    pkg,
    distTag,
    updateCheckInterval,
  });

  debugLogger('updateNotifierHook', { notifier });

  if (notifier.update) {
    const notification = handleUpdate(notifier.update, pkg.version);
    debugLogger('notification', notification);

    if (notification) {
      console.log(ux.colorize('yellow', notification.message));
    }
  }
};

export default updateNotifierHook;

type DistTag = 'latest' | 'beta' | 'prev1' | 'alpha' | 'next';

export function getDistTag(version: string): DistTag {
  const isBeta = version.includes('-beta');
  const isAlpha = version.includes('-alpha');
  const isNext = version.includes('-next');

  if (isBeta) {
    return 'beta';
  }

  if (isAlpha) {
    return 'alpha';
  }

  if (isNext) {
    return 'next';
  }

  return 'latest';
}

export function handleUpdate(update: UpdateInfo, currentVersion: string) {
  const isPreV1 = currentVersion.startsWith('0.') || update.latest.startsWith('0.');
  const currentDistTag = getDistTag(currentVersion);
  const updateDistTag = getDistTag(update.latest);

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
  if (isPreV1 || currentDistTag !== 'latest' || updateDistTag !== 'latest' || update.type === 'major') {
    message += '\nThis update may contain breaking changes.';
  }

  // For all other updates (minor, patch), they should be non-breaking
  return {
    message,
    defer: false,
  };
}
