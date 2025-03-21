import type { Hook } from '@oclif/core';
import updateConfig from '../../config/update.js';

export const initUpdate: Hook<'init'> = async ({ config }) => {
  // Apply update configuration
  Object.assign(config, updateConfig);
};
