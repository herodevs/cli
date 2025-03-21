#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawnSync } = require('child_process');

const platform = os.platform();
const arch = os.arch();

// Map platform/arch to our binary names
const binaryMap = {
  'darwin-arm64': 'hd-v*-darwin-arm64.tar.gz',
  // 'darwin-x64': 'hd-v*-darwin-x64.tar.gz',
  'linux-x64': 'hd-v*-linux-x64.tar.gz',
  // 'linux-arm64': 'hd-v*-linux-arm64.tar.gz',
  // 'win32-x64': 'hd-v*-win32-x64.tar.gz',
  // 'win32-x86': 'hd-v*-win32-x86.tar.gz'
};

const binaryPattern = binaryMap[`${platform}-${arch}`];
if (!binaryPattern) {
  console.error(`Unsupported platform: ${platform}-${arch}`);
  process.exit(1);
}

// Find the package location
const packageRoot = path.join(__dirname, '..');

// Find the matching binary in the package root directory
const files = fs.readdirSync(packageRoot);
const binaryFile = files.find((f) => 
  new RegExp(binaryPattern.replace('*', '.*')).test(f)
);

if (!binaryFile) {
  console.error(`No binary found for ${platform}-${arch}`);
  process.exit(1);
}

// Extract the binary
const binaryPath = path.join(packageRoot, binaryFile);
const extractDir = path.join(os.tmpdir(), `hd-binary-${Date.now()}`);
fs.mkdirSync(extractDir, { recursive: true });

try {
  // Handle extraction based on platform
  if (platform === 'win32') {
    // For Windows, use a JS-based tar extraction or another approach
    const tar = require('tar');
    tar.extract({
      file: binaryPath,
      cwd: extractDir
    });
  } else {
    // For Unix-based systems
    spawnSync('tar', ['-xzf', binaryPath, '-C', extractDir], { 
      stdio: 'inherit' 
    });
  }

  // Determine the binary executable path based on platform
  const binName = platform === 'win32' ? 'hd.exe' : 'hd';
  const binaryExecutable = path.join(extractDir, 'bin', binName);
  
  if (!fs.existsSync(binaryExecutable)) {
    console.error('Binary not found after extraction');
    process.exit(1);
  }

  // Make the binary executable (not needed for Windows)
  if (platform !== 'win32') {
    fs.chmodSync(binaryExecutable, '755');
  }

  // Execute the binary with all arguments
  const args = process.argv.slice(2);
  const result = spawnSync(binaryExecutable, args, { 
    stdio: 'inherit' 
  });
  
  // Clean up the temp directory
  fs.rmSync(extractDir, { recursive: true, force: true });
  
  // Propagate the exit code
  process.exit(result.status);
} catch (error) {
  console.error('Failed to execute binary:', error);
  // Try to clean up even on error
  try {
    fs.rmSync(extractDir, { recursive: true, force: true });
  } catch (e) {
    // Ignore cleanup errors
  }
  process.exit(1);
}