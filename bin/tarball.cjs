#!/usr/bin/env node

const https = require('node:https');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const VERSION = process.argv[2] || '1.4.0-beta.1';
const BUCKET = 'end-of-life-dataset-cli-releases';
const REGION = 'us-east-1';

const platformMap = {
    linux: 'linux',
    darwin: 'darwin',
    win32: 'win32',
};

const archMap = {
    x64: 'x64',
    arm64: 'arm64',
};

const hostPlatform = os.platform();
const hostArch = os.arch();

const platform = platformMap[hostPlatform];
const arch = archMap[hostArch];

if (!platform || !arch) {
    console.error(`Unsupported platform or architecture: ${hostPlatform} ${hostArch}`);
    process.exit(1);
}

const tarballName = `dataset-cli-${platform}-${arch}.tar.gz`;

const s3Url = `https://${BUCKET}.s3.${REGION}.amazonaws.com/versions/${VERSION}/${tarballName}`;

https.get(s3Url, (res) => {
    if (res.statusCode !== 200) {
        console.error(`Failed to download: ${res.statusCode} ${res.statusMessage}`);
        process.exit(1);
    }

    const outputPath = path.join(__dirname, tarballName);
    const fileStream = fs.createWriteStream(outputPath);
    res.pipe(fileStream);

    fileStream.on('finish', () => {
        fileStream.close(() => {
            console.log(`Downloaded to ${outputPath}`);
        });
    });
}).on('error', (err) => {
    console.error(`Download error: ${err.message}`);
});
