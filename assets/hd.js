#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

const platform = os.platform();
const arch = os.arch();

// Map platform/arch to our binary names
const binaryMap = {
  'darwin-arm64': 'hd-v*-darwin-arm64.tar.gz',
  'linux-x64': 'hd-v*-linux-x64.tar.gz',
};

const binaryPattern = binaryMap[`${platform}-${arch}`];
if (!binaryPattern) {
  console.error(`Unsupported platform: ${platform}-${arch}`);
  process.exit(1);
}

// Find the matching binary
const files = fs.readdirSync(__dirname);
const binaryFile = files.find((f) => f.match(binaryPattern.replace('*', '.*')));
if (!binaryFile) {
  console.error(`No binary found for ${platform}-${arch}`);
  process.exit(1);
}

// Extract the binary
const binaryPath = path.join(__dirname, binaryFile);
const extractDir = path.join(os.tmpdir(), 'hd-binary');
fs.mkdirSync(extractDir, { recursive: true });

try {
  execSync(`tar -xzf "${binaryPath}" -C "${extractDir}"`, { stdio: 'inherit' });

  // Execute the binary
  const binaryExecutable = path.join(extractDir, 'bin', 'hd');
  if (!fs.existsSync(binaryExecutable)) {
    console.error('Binary not found after extraction');
    process.exit(1);
  }

  // Make the binary executable
  fs.chmodSync(binaryExecutable, '755');

  // Execute the binary with all arguments
  const args = process.argv.slice(2);
  execSync(`"${binaryExecutable}" ${args.join(' ')}`, { stdio: 'inherit' });
} catch (error) {
  console.error('Failed to execute binary:', error);
  process.exit(1);
}
