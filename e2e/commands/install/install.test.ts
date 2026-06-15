import { equal, match } from 'node:assert/strict';
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, it } from 'node:test';
import { gzipSync } from 'node:zlib';
import { runCommand } from '@oclif/test';

const fixturesDir = path.resolve(import.meta.dirname, '../../fixtures/install');
const projectFixtureDir = path.join(fixturesDir, 'simple-project');
const packageFixtureDir = path.join(fixturesDir, 'hd-demo-dep');

describe('install e2e', () => {
  const originalCwd = process.cwd();
  const originalCatalogUrl = process.env.HD_INSTALL_CATALOG_URL;
  const originalRegistryOverride = process.env.HD_INSTALL_NPM_REGISTRY_URL;
  const originalNpmCache = process.env.NPM_CONFIG_CACHE;
  let tempDir: string;
  let projectDir: string;
  let registry: MockRegistry | undefined;

  beforeEach(async () => {
    tempDir = mkdtempSync(path.join(tmpdir(), 'hd-install-e2e-'));
    projectDir = path.join(tempDir, 'project');
    cpSync(projectFixtureDir, projectDir, { recursive: true });

    const tarballPath = createFixtureTarball(tempDir);
    registry = await startMockRegistry(tarballPath);
    process.env.HD_INSTALL_CATALOG_URL = `${registry.url}/catalog`;
    process.env.HD_INSTALL_NPM_REGISTRY_URL = registry.url;
    process.env.NPM_CONFIG_CACHE = path.join(tempDir, '.npm-cache');
    process.chdir(projectDir);
  });

  afterEach(() => {
    registry?.close();
    process.chdir(originalCwd);
    restoreEnv('HD_INSTALL_CATALOG_URL', originalCatalogUrl);
    restoreEnv('HD_INSTALL_NPM_REGISTRY_URL', originalRegistryOverride);
    restoreEnv('NPM_CONFIG_CACHE', originalNpmCache);
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('runs npm install through the local proxy against a real fixture project', async () => {
    if (!registry) {
      throw new Error('Mock registry was not started');
    }

    const output = await runCommand('install');
    equal(output.error, undefined);

    const stdout = output.stdout;
    match(stdout, /Install completed\./);

    const installedPackagePath = path.join(projectDir, 'node_modules', 'hd-demo-dep', 'index.js');
    equal(existsSync(installedPackagePath), true);
    equal(readFileSync(installedPackagePath, 'utf8'), "module.exports = 'installed through hd install';\n");

    const lockfile = JSON.parse(readFileSync(path.join(projectDir, 'package-lock.json'), 'utf8'));
    equal(lockfile.packages['node_modules/hd-demo-dep'].version, '1.0.0');
    match(lockfile.packages['node_modules/hd-demo-dep'].resolved, /\/hd-demo-dep-1\.0\.0-hd-demo-dep-1\.0\.1\.tgz$/);
  });
});

function restoreEnv(name: string, value: string | undefined): void {
  if (value === undefined) {
    delete process.env[name];
    return;
  }
  process.env[name] = value;
}

function createFixtureTarball(destination: string): string {
  const entries = [
    createTarEntry('package/package.json', readFileSync(path.join(packageFixtureDir, 'package.json'))),
    createTarEntry('package/index.js', readFileSync(path.join(packageFixtureDir, 'index.js'))),
  ];
  const tarballPath = path.join(destination, 'hd-demo-dep-1.0.0.tgz');
  writeFileSync(tarballPath, gzipSync(Buffer.concat([...entries, Buffer.alloc(1024)])));
  return tarballPath;
}

function createTarEntry(name: string, content: Buffer): Buffer {
  const header = Buffer.alloc(512);
  writeTarString(header, name, 0, 100);
  writeTarOctal(header, 0o644, 100, 8);
  writeTarOctal(header, 0, 108, 8);
  writeTarOctal(header, 0, 116, 8);
  writeTarOctal(header, content.length, 124, 12);
  writeTarOctal(header, 0, 136, 12);
  header.fill(' ', 148, 156);
  header[156] = '0'.charCodeAt(0);
  writeTarString(header, 'ustar', 257, 6);
  writeTarString(header, '00', 263, 2);

  let checksum = 0;
  for (const byte of header) {
    checksum += byte;
  }
  writeTarOctal(header, checksum, 148, 8);

  return Buffer.concat([header, content, Buffer.alloc(padToTarBlock(content.length))]);
}

function writeTarString(header: Buffer, value: string, offset: number, length: number): void {
  header.write(value, offset, Math.min(Buffer.byteLength(value), length), 'utf8');
}

function writeTarOctal(header: Buffer, value: number, offset: number, length: number): void {
  const encoded = value.toString(8).padStart(length - 1, '0');
  header.write(`${encoded}\0`, offset, length, 'ascii');
}

function padToTarBlock(size: number): number {
  const remainder = size % 512;
  return remainder === 0 ? 0 : 512 - remainder;
}

interface MockRegistry {
  url: string;
  close: () => void;
}

async function startMockRegistry(tarballPath: string): Promise<MockRegistry> {
  let registryUrl = '';
  const server = createServer((req, res) => {
    handleRegistryRequest(req, res, registryUrl, tarballPath);
  });

  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });

  const address = server.address();
  if (!address || typeof address === 'string') {
    throw new Error('Mock registry did not bind to a TCP port');
  }

  registryUrl = `http://127.0.0.1:${address.port}`;

  return {
    url: registryUrl,
    close: () => {
      server.closeAllConnections();
      server.close();
    },
  };
}

function handleRegistryRequest(
  req: IncomingMessage,
  res: ServerResponse,
  registryUrl: string,
  tarballPath: string,
): void {
  const url = new URL(req.url ?? '/', registryUrl);
  const decodedPathname = decodeURIComponent(url.pathname);

  if (
    req.method === 'GET' &&
    (decodedPathname === '/hd-demo-dep' || decodedPathname === '/@neverendingsupport/hd-demo-dep')
  ) {
    const isNesPackage = decodedPathname === '/@neverendingsupport/hd-demo-dep';
    const packageName = isNesPackage ? '@neverendingsupport/hd-demo-dep' : 'hd-demo-dep';
    const packageVersion = isNesPackage ? '1.0.0-hd-demo-dep-1.0.1' : '1.0.0';
    const tarballUrl = isNesPackage
      ? `${registryUrl}/%40neverendingsupport/hd-demo-dep/-/hd-demo-dep-1.0.0-hd-demo-dep-1.0.1.tgz`
      : `${registryUrl}/hd-demo-dep/-/hd-demo-dep-1.0.0.tgz`;

    sendJson(res, {
      name: packageName,
      'dist-tags': { latest: packageVersion },
      versions: {
        [packageVersion]: {
          name: packageName,
          version: packageVersion,
          main: 'index.js',
          dist: {
            tarball: tarballUrl,
          },
        },
      },
    });
    return;
  }

  if (req.method === 'GET' && decodedPathname === '/catalog') {
    sendJson(res, {
      results: [
        {
          component: 'pkg:npm/hd-demo-dep',
          versions: [
            {
              version: '1.0.0',
              nes: {
                latest: '1.0.0-hd-demo-dep-1.0.1',
                purl: 'pkg:npm/%40neverendingsupport/hd-demo-dep',
              },
            },
          ],
        },
      ],
      totalPages: 1,
    });
    return;
  }

  if (
    req.method === 'GET' &&
    (decodedPathname === '/hd-demo-dep/-/hd-demo-dep-1.0.0.tgz' ||
      decodedPathname === '/@neverendingsupport/hd-demo-dep/-/hd-demo-dep-1.0.0-hd-demo-dep-1.0.1.tgz')
  ) {
    res.writeHead(200, { 'content-type': 'application/octet-stream' });
    res.end(readFileSync(tarballPath));
    return;
  }

  res.writeHead(404, { 'content-type': 'application/json' });
  res.end(JSON.stringify({ error: 'not found' }));
}

function sendJson(res: ServerResponse, body: unknown): void {
  res.writeHead(200, { 'content-type': 'application/json' });
  res.end(JSON.stringify(body));
}
