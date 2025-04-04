#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');
const https = require('https');

const isWindows = process.platform === 'win32';
const binaryPath = isWindows
  ? path.join(process.env.LOCALAPPDATA, 'Programs', 'hd', 'hd.exe')
  : '/usr/local/bin/hd';

// Check for updates if the update command is used
if (process.argv[2] === 'update') {
  try {
    // Get current version from package.json
    const packageJson = require('../package.json');
    const currentVersion = packageJson.version;

    // Get latest version from S3
    const options = {
      hostname: 'end-of-life-dataset-cli-releases.s3.amazonaws.com',
      path: '/channels/latest/version',
      method: 'GET',
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        const latestVersion = data.trim();
        if (latestVersion !== currentVersion) {
          console.log(`New version ${latestVersion} available!`);
          console.log('Run "npm install -g @herodevs/cli" to update.');
        } else {
          console.log('You are using the latest version.');
        }
      });
    });

    req.on('error', (error) => {
      console.error('Error checking for updates:', error.message);
    });

    req.end();
    return;
  } catch (error) {
    console.error('Error checking for updates:', error.message);
    process.exit(1);
  }
}

try {
  // On Windows, we need to use the full path to the binary
  const command = isWindows
    ? `"${binaryPath}" ${process.argv.slice(2).join(' ')}`
    : `${binaryPath} ${process.argv.slice(2).join(' ')}`;

  execSync(command, {
    stdio: 'inherit',
    shell: isWindows ? 'cmd.exe' : undefined,
  });
} catch (error) {
  console.error(
    'Error: Could not find hd binary. Please run npm install again.'
  );
  process.exit(1);
}
