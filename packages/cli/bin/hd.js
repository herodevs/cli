#!/usr/bin/env node
const { platform, arch, env } = process;

const PLATFORMS = {
  win32: {
    x64: '@herodevs/cli-win32-x64/hd',
  },
  darwin: {
    arm64: '@herodevs/cli-darwin-arm64/hd',
  },
  linux: {
    x64: '@herodevs/cli-linux-x64/hd',
  },
};

const binPath = PLATFORMS[platform][arch];

if (binPath) {
  // biome-ignore lint/style/useNodejsImportProtocol: if we want to support older versions of node we cannot use the node: protocol
  const result = require('child_process').spawnSync(require.resolve(binPath), process.argv.slice(2), {
    shell: false,
    stdio: 'inherit',
    env: {
      ...env,
    },
  });

  if (result.error) {
    throw result.error;
  }

  process.exitCode = result.status;
} else {
  console.error("The HeroDevs CLI package doesn't ship with prebuilt binaries for your platform yet.");
  process.exitCode = 1;
}
