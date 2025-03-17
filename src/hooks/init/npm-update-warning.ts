import type { Hook } from '@oclif/core';

const npmUpdateHook: Hook.Init = async (options) => {
  console.log('hi there');
};

export default npmUpdateHook;
