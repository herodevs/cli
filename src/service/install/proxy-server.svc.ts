import { Readable } from 'node:stream';
import Fastify, { type FastifyInstance, type FastifyReply, type FastifyRequest } from 'fastify';
import semver from 'semver';
import type { InstallCatalogEntry, InstallNesPackageSummary, InstallProxyOptions } from '../../types/install.ts';
import { debugLogger } from '../log.svc.ts';
import { recordAvailableNotEntitled, recordMatchedNesPackage } from './install-summary.svc.ts';

const DEFAULT_NES_REGISTRY_URL = 'https://registry.nes.herodevs.com/npm/pkg';
const DEFAULT_PUBLIC_REGISTRY_URL = 'https://registry.npmjs.org';
const UPSTREAM_FETCH_TIMEOUT_MS = 300_000;
const HOP_BY_HOP_HEADERS = new Set([
  'connection',
  'content-encoding',
  'content-length',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
]);
const ENTITLEMENT_FAILURE_STATUSES = new Set([401, 403]);

interface RegistryRequest {
  isMetadataRequest: boolean;
  packageName?: string;
  withPackageName(packageName: string): string;
}

/**
 * Short-lived local npm registry proxy used by `hd install`.
 *
 * Requests pass through to public npm unless the package is present in the NES catalog loaded at
 * startup. Only catalog-matched requests are sent to the NES registry with HeroDevs auth attached.
 */
export function createInstallProxy(options: InstallProxyOptions): FastifyInstance {
  const nesRegistryUrl = options.nesRegistryUrl ?? DEFAULT_NES_REGISTRY_URL;
  const publicRegistryUrl = options.publicRegistryUrl ?? DEFAULT_PUBLIC_REGISTRY_URL;
  const nesManifestCache = new Map<string, Promise<Record<string, unknown>>>();
  const app = Fastify({ logger: false });

  app.all('/*', async (request, reply) => {
    const registryRequest = parseRegistryRequest(request.url);
    const catalogEntries = registryRequest.packageName ? options.catalog.get(registryRequest.packageName) : undefined;
    if (registryRequest.packageName && catalogEntries && registryRequest.isMetadataRequest) {
      const response = await getSynthesizedManifest(
        request,
        options,
        registryRequest.packageName,
        catalogEntries,
        nesRegistryUrl,
        publicRegistryUrl,
        nesManifestCache,
      );
      reply.code(response.status);
      copyResponseHeaders(reply, response.headers);
      return reply.send(response.body);
    }

    const catalogEntry = catalogEntries?.[0];
    const alreadyKnownNotEntitled =
      registryRequest.packageName && catalogEntry
        ? hasAvailableNotEntitledPackage(
            options.summary.availableNotEntitled,
            registryRequest.packageName,
            catalogEntry,
          )
        : false;
    const shouldUseNesRegistry = Boolean(catalogEntry) && !alreadyKnownNotEntitled;
    const upstreamPackageName = shouldUseNesRegistry
      ? (catalogEntry?.nesPackageName ?? registryRequest.packageName)
      : registryRequest.packageName;
    const upstreamRegistryUrl = shouldUseNesRegistry ? nesRegistryUrl : publicRegistryUrl;
    const upstreamPath = upstreamPackageName ? registryRequest.withPackageName(upstreamPackageName) : request.url;
    debugLogger('install proxy request %o', {
      packageName: registryRequest.packageName,
      upstreamPackageName,
      shouldUseNesRegistry,
      upstreamRegistryUrl,
      upstreamPath,
    });

    let upstreamResponse = await fetchUpstream(
      request,
      upstreamRegistryUrl,
      upstreamPath,
      shouldUseNesRegistry ? (options.registryAuthToken ?? options.authToken) : undefined,
    );
    debugLogger('install proxy response %o', {
      status: upstreamResponse.status,
      upstreamRegistryUrl,
      upstreamPath,
    });

    if (
      shouldUseNesRegistry &&
      registryRequest.packageName &&
      catalogEntry &&
      ENTITLEMENT_FAILURE_STATUSES.has(upstreamResponse.status)
    ) {
      recordAvailableNotEntitled(options.summary, registryRequest.packageName, catalogEntry);
      debugLogger('install proxy fallback public npm %o', {
        packageName: registryRequest.packageName,
        status: upstreamResponse.status,
      });
      upstreamResponse = await fetchUpstream(request, publicRegistryUrl, request.url);
    } else if (shouldUseNesRegistry && registryRequest.packageName && catalogEntry) {
      recordMatchedNesPackage(options.summary, registryRequest.packageName, catalogEntry);
    }

    reply.code(upstreamResponse.status);
    copyResponseHeaders(reply, upstreamResponse.headers);

    if (!upstreamResponse.body) {
      return reply.send();
    }

    // Tarballs can be large, so passthrough responses must stream instead of buffering the body in memory.
    return reply.send(Readable.fromWeb(upstreamResponse.body));
  });

  return app;
}

async function getSynthesizedManifest(
  request: FastifyRequest,
  options: InstallProxyOptions,
  packageName: string,
  catalogEntries: InstallCatalogEntry[],
  nesRegistryUrl: string,
  publicRegistryUrl: string,
  manifestCache: Map<string, Promise<Record<string, unknown>>>,
): Promise<{ body: unknown; headers: Headers; status: number }> {
  const manifests = new Map<string, Record<string, unknown>>();

  for (const entry of catalogEntries) {
    try {
      manifests.set(
        entry.nesPackageName,
        await getNesManifest(request, options, entry.nesPackageName, nesRegistryUrl, manifestCache),
      );
    } catch (error) {
      if (error instanceof UpstreamResponseError && ENTITLEMENT_FAILURE_STATUSES.has(error.status)) {
        recordAvailableNotEntitled(options.summary, packageName, entry);
        continue;
      }

      if (error instanceof UpstreamResponseError && error.status === 404) {
        debugLogger('install proxy skipped missing NES manifest %o', {
          packageName,
          nesPackageName: entry.nesPackageName,
          status: error.status,
        });
        continue;
      }

      throw error;
    }
  }

  const body = synthesizeManifest(packageName, catalogEntries, manifests);
  if (Object.keys(body.versions).length === 0) {
    debugLogger('install proxy fallback public npm empty synthesized manifest %o', {
      packageName,
    });
    return getPublicManifest(request, publicRegistryUrl);
  }

  for (const entry of catalogEntries) {
    if (Object.hasOwn(body.versions, entry.ossVersion)) {
      recordMatchedNesPackage(options.summary, packageName, entry);
    }
  }
  return {
    body,
    headers: new Headers({ 'content-type': 'application/json' }),
    status: 200,
  };
}

async function getNesManifest(
  request: FastifyRequest,
  options: InstallProxyOptions,
  nesPackageName: string,
  nesRegistryUrl: string,
  manifestCache: Map<string, Promise<Record<string, unknown>>>,
): Promise<Record<string, unknown>> {
  let manifest = manifestCache.get(nesPackageName);
  if (!manifest) {
    manifest = fetchNesManifest(request, options, nesPackageName, nesRegistryUrl);
    manifestCache.set(nesPackageName, manifest);
  }

  return manifest;
}

async function fetchNesManifest(
  request: FastifyRequest,
  options: InstallProxyOptions,
  nesPackageName: string,
  nesRegistryUrl: string,
): Promise<Record<string, unknown>> {
  const manifestPath = parseRegistryRequest(request.url).withPackageName(nesPackageName);
  const response = await fetchUpstream(
    request,
    nesRegistryUrl,
    manifestPath,
    options.registryAuthToken ?? options.authToken,
    // npm may request abbreviated install metadata, but this proxy needs the complete manifest to preserve package fields.
    { accept: 'application/json' },
  );
  debugLogger('install proxy response %o', {
    status: response.status,
    upstreamRegistryUrl: nesRegistryUrl,
    upstreamPath: manifestPath,
  });

  if (!response.ok) {
    throw new UpstreamResponseError(response.status);
  }

  return (await response.json()) as Record<string, unknown>;
}

async function getPublicManifest(
  request: FastifyRequest,
  publicRegistryUrl: string,
): Promise<{ body: unknown; headers: Headers; status: number }> {
  const response = await fetchUpstream(request, publicRegistryUrl, request.url);
  if (!response.ok) {
    return {
      body: await response.text(),
      headers: response.headers,
      status: response.status,
    };
  }

  return {
    body: await response.json(),
    headers: response.headers,
    status: response.status,
  };
}

class UpstreamResponseError extends Error {
  readonly status: number;

  constructor(status: number) {
    super(`Upstream registry returned ${status}`);
    this.status = status;
  }
}

function synthesizeManifest(
  packageName: string,
  catalogEntries: InstallCatalogEntry[],
  manifests: Map<string, Record<string, unknown>>,
): { _id: string; name: string; versions: Record<string, unknown>; 'dist-tags': { latest: string | undefined } } {
  const versions: Record<string, unknown> = {};
  for (const entry of catalogEntries) {
    const nesVersion = getManifestVersion(manifests.get(entry.nesPackageName), entry.nesVersion);
    if (!nesVersion) {
      continue;
    }

    versions[entry.ossVersion] = {
      ...nesVersion,
      name: packageName,
      version: entry.ossVersion,
    };
  }

  return {
    _id: packageName,
    name: packageName,
    versions,
    'dist-tags': {
      latest: resolveLatestVersion(Object.keys(versions)),
    },
  };
}

function getManifestVersion(
  manifest: Record<string, unknown> | undefined,
  version: string,
): Record<string, unknown> | undefined {
  const versions = manifest?.versions;
  if (!versions || typeof versions !== 'object') {
    return;
  }

  const versionMetadata = (versions as Record<string, unknown>)[version];
  if (!versionMetadata || typeof versionMetadata !== 'object') {
    return;
  }

  return versionMetadata as Record<string, unknown>;
}

function resolveLatestVersion(versions: string[]): string | undefined {
  return semver.rsort(versions)[0];
}

function fetchUpstream(
  request: FastifyRequest,
  registryUrl: string,
  requestPath: string,
  authToken?: string,
  headerOverrides: Record<string, string> = {},
): Promise<Response> {
  const upstreamUrl = buildUpstreamUrl(registryUrl, requestPath);
  return fetch(upstreamUrl, {
    method: request.method,
    headers: buildUpstreamHeaders(request, authToken, headerOverrides),
    body: shouldForwardBody(request.method) ? request.raw : undefined,
    duplex: shouldForwardBody(request.method) ? 'half' : undefined,
    signal: AbortSignal.timeout(UPSTREAM_FETCH_TIMEOUT_MS),
  } as RequestInit);
}

/** Owns the lifecycle of a started local proxy server. */
export class InstallProxyServer {
  readonly app: FastifyInstance;
  readonly registryUrl: string;

  constructor(app: FastifyInstance, registryUrl: string) {
    this.app = app;
    this.registryUrl = registryUrl;
  }

  close(): Promise<void> {
    return this.app.close();
  }
}

/** Starts the local proxy on an ephemeral localhost port for a single npm install run. */
export async function startInstallProxy(options: InstallProxyOptions): Promise<InstallProxyServer> {
  const app = createInstallProxy(options);
  const registryUrl = await app.listen({ host: '127.0.0.1', port: 0 });

  return new InstallProxyServer(app, registryUrl);
}

function buildUpstreamHeaders(
  request: FastifyRequest,
  authToken?: string,
  headerOverrides: Record<string, string> = {},
): Headers {
  const headers = new Headers();
  for (const [key, value] of Object.entries(request.headers)) {
    if (value === undefined || HOP_BY_HOP_HEADERS.has(key.toLowerCase()) || key.toLowerCase() === 'host') {
      continue;
    }
    if (Array.isArray(value)) {
      for (const item of value) {
        headers.append(key, item);
      }
    } else {
      headers.set(key, String(value));
    }
  }
  if (authToken) {
    // npm does not know about the customer's HeroDevs CLI token, so catalog-matched NES requests authenticate here.
    headers.set('authorization', `Bearer ${authToken}`);
  }
  for (const [key, value] of Object.entries(headerOverrides)) {
    headers.set(key, value);
  }
  return headers;
}

function shouldForwardBody(method: string): boolean {
  return method !== 'GET' && method !== 'HEAD';
}

function hasAvailableNotEntitledPackage(
  packages: Map<string, InstallNesPackageSummary>,
  ossPackageName: string,
  entry: InstallCatalogEntry,
): boolean {
  for (const item of packages.values()) {
    if (
      item.ossPackageName === ossPackageName &&
      item.ossVersion === entry.ossVersion &&
      item.nesPackageName === entry.nesPackageName &&
      item.nesVersion === entry.nesVersion
    ) {
      return true;
    }
  }
  return false;
}

function buildUpstreamUrl(registryUrl: string, requestPath: string): URL {
  const upstreamUrl = new URL(registryUrl);
  const requestUrl = new URL(requestPath, 'http://localhost');
  const basePath = upstreamUrl.pathname.endsWith('/') ? upstreamUrl.pathname.slice(0, -1) : upstreamUrl.pathname;
  const requestPathname = requestUrl.pathname.startsWith('/') ? requestUrl.pathname.slice(1) : requestUrl.pathname;
  upstreamUrl.pathname = `${basePath}/${requestPathname}`;
  upstreamUrl.search = requestUrl.search;
  return upstreamUrl;
}

function copyResponseHeaders(reply: FastifyReply, headers: Headers): void {
  for (const [key, value] of headers) {
    // Hop-by-hop and body framing headers cannot be copied safely after Node fetch has decoded the body.
    if (!HOP_BY_HOP_HEADERS.has(key.toLowerCase())) {
      reply.header(key, value);
    }
  }
}

function parseRegistryRequest(path: string): RegistryRequest {
  const url = new URL(path, 'http://localhost');
  const { pathname } = url;
  const parts = pathname.split('/').filter(Boolean);
  const [firstPart, secondPart] = parts;
  let packageName: string | undefined;
  let packagePartCount = 0;

  if (firstPart && !firstPart.startsWith('-')) {
    const decodedFirstPart = decodeURIComponent(firstPart);
    if (decodedFirstPart.startsWith('@')) {
      if (decodedFirstPart.includes('/')) {
        packageName = decodedFirstPart;
        packagePartCount = 1;
      } else if (secondPart && secondPart !== '-') {
        packageName = `${decodedFirstPart}/${decodeURIComponent(secondPart)}`;
        packagePartCount = 2;
      }
    } else {
      packageName = decodedFirstPart;
      packagePartCount = 1;
    }
  }

  return {
    isMetadataRequest: Boolean(packageName) && parts.length === packagePartCount,
    packageName,
    withPackageName(nextPackageName: string): string {
      if (!packageName) {
        return path;
      }

      const encodedPackageName = nextPackageName.split('/').map(encodeURIComponent).join('/');
      const suffix = parts.slice(packagePartCount).join('/');
      url.pathname = `/${encodedPackageName}${suffix ? `/${suffix}` : ''}`;
      return `${url.pathname}${url.search}`;
    },
  };
}
