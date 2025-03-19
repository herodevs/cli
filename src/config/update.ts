import type { Config } from '@oclif/core';

export const updateConfig: NonNullable<Config['updateConfig']> = {
  autoupdate: {
    debounce: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
    rollout: 100, // 100% rollout
  },
};

export default updateConfig;
